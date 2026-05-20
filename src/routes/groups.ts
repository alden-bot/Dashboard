import { Hono } from 'hono';
import type { Context } from 'hono';
import type Main from '../main';
import { requireAuth } from '../auth/middleware';
import { Role } from '@/api';
import { renderGroups } from '../views/groups';
import { renderGroupDetail, renderInviteCard } from '../views/group-detail';
import type { GroupMember } from '../services/GroupService';
import {
	canAccessGroup,
	canGrantVirtualDeputy,
	canManageGroupSettings,
	canManageVirtualDeputies,
	canModerateMember,
	canRevokeVirtualDeputy,
	isBotAdminSession,
} from '../auth/access';
import { escapeHtml, formatList, toast } from '../utils/html';

interface GroupAccess {
	sessionUserId: string;
	isBotAdmin: boolean;
	actorRole: Role;
}

export function createGroupRoutes(plugin: Main): Hono {
	const app = new Hono();

	app.use('/groups/*', requireAuth);

	app.get('/groups', async (c) => {
		const session = c.get('session')!;
		const isBotAdmin = isBotAdminSession(session);
		const groupIds = isBotAdmin ? plugin.groupTracker.getAllGroupIds() : session.groupIds;
		const groups = await plugin.groupService.getGroupsInfo(groupIds);

		return c.html(renderGroups(groups, isBotAdmin, plugin.i18n!, plugin.bot.config.LANGUAGE));
	});

	app.get('/groups/:id', async (c) => {
		const threadId = c.req.param('id');
		const access = await getGroupAccess(c, plugin, threadId);
		if (!access) return c.text('Forbidden', 403);

		const group = await plugin.groupService.getGroupInfo(threadId);
		if (!group) return c.text('Group not found', 404);

		const members = await plugin.groupService.getGroupMembers(threadId, group);
		const savedLink = plugin.groupService.getSavedLink(threadId);

		return c.html(
			renderGroupDetail(
				group,
				members,
				{
					isBotAdmin: access.isBotAdmin,
					actorRole: access.actorRole,
					canManageSettings: canManageGroupSettings(access.actorRole, access.isBotAdmin),
					canManageVirtualDeputies: canManageVirtualDeputies(
						access.actorRole,
						access.isBotAdmin,
					),
				},
				plugin.i18n!,
				plugin.bot.config.LANGUAGE,
				savedLink,
			),
		);
	});

	app.post('/groups/:id/members/:uid/kick', async (c) => {
		return handleMemberAction(c, plugin, 'kick');
	});

	app.post('/groups/:id/members/:uid/ban', async (c) => {
		return handleMemberAction(c, plugin, 'ban');
	});

	app.post('/groups/:id/members/:uid/unban', async (c) => {
		return handleMemberAction(c, plugin, 'unban');
	});

	app.post('/groups/:id/deputies/:uid/add', async (c) => {
		const result = await getTargetAccess(c, plugin);
		if (result instanceof Response) return result;

		if (
			!canGrantVirtualDeputy(result.access.actorRole, result.access.isBotAdmin, result.target)
		) {
			return c.html(
				toast('error', 'Only BotAdmin or group owner can grant vDeputy to members.'),
				403,
			);
		}

		const success = await plugin.botService.addVirtualDeputy(result.threadId, result.userId);
		return c.html(
			success ? toast('success', 'vDeputy added') : toast('error', 'Failed to add vDeputy'),
		);
	});

	app.post('/groups/:id/deputies/:uid/remove', async (c) => {
		const result = await getTargetAccess(c, plugin);
		if (result instanceof Response) return result;

		if (
			!canRevokeVirtualDeputy(
				result.access.actorRole,
				result.access.isBotAdmin,
				result.target,
			)
		) {
			return c.html(
				toast('error', 'Only BotAdmin or group owner can revoke vDeputy access.'),
				403,
			);
		}

		const success = await plugin.botService.removeVirtualDeputy(result.threadId, result.userId);
		return c.html(
			success
				? toast('success', 'vDeputy removed')
				: toast('error', 'Failed to remove vDeputy'),
		);
	});

	app.post('/groups/:id/name', async (c) => {
		const threadId = c.req.param('id');
		const access = await getGroupAccess(c, plugin, threadId);
		if (!access) return c.text('Forbidden', 403);
		if (!canManageGroupSettings(access.actorRole, access.isBotAdmin)) {
			return c.html(toast('error', 'You cannot change this group.'), 403);
		}

		const body = await c.req.parseBody();
		const name = String(body['name'] ?? '').trim();
		if (!name) return c.html(toast('error', 'Group name is required'), 400);

		const success = await plugin.groupService.changeName(threadId, name);
		return c.html(
			success
				? toast('success', 'Group name changed')
				: toast('error', 'Failed to change group name'),
		);
	});

	app.post('/groups/:id/link/enable', async (c) => {
		return handleInviteLink(c, plugin, 'enable');
	});

	app.post('/groups/:id/link/refresh', async (c) => {
		return handleInviteLink(c, plugin, 'refresh');
	});

	app.post('/groups/:id/link/disable', async (c) => {
		return handleInviteLink(c, plugin, 'disable');
	});

	app.get('/groups/:id/members/:uid/detail', async (c) => {
		const result = await getTargetAccess(c, plugin);
		if (result instanceof Response) return result;

		const perms = plugin.bot.permissionManager.getUserPermissions(result.userId);
		const roleName = getDisplayRole(result.target);

		return c.html(`
			<div class="member-detail">
				<div><span>Role:</span><strong>${escapeHtml(roleName)}</strong></div>
				<div><span>Virtual Deputy:</span><strong>${result.target.isVirtualDeputy ? 'Yes' : 'No'}</strong></div>
				<div><span>Permissions:</span><strong>${formatList(perms)}</strong></div>
			</div>
		`);
	});

	return app;
}

async function handleMemberAction(
	c: Context,
	plugin: Main,
	action: 'kick' | 'ban' | 'unban',
): Promise<Response> {
	const result = await getTargetAccess(c, plugin);
	if (result instanceof Response) return result;

	if (!canModerateMember(result.access.actorRole, result.access.isBotAdmin, result.target)) {
		return c.html(toast('error', 'This action is only allowed against normal members.'), 403);
	}

	const success =
		action === 'kick'
			? await plugin.groupService.kickMember(result.threadId, result.userId)
			: action === 'ban'
				? await plugin.groupService.banMember(result.threadId, result.userId)
				: await plugin.groupService.unbanMember(result.threadId, result.userId);

	return c.html(
		success
			? toast('success', getActionSuccessMessage(action))
			: toast('error', getActionFailureMessage(action)),
	);
}

async function handleInviteLink(
	c: Context,
	plugin: Main,
	action: 'enable' | 'refresh' | 'disable',
): Promise<Response> {
	const threadId = c.req.param('id');
	const access = await getGroupAccess(c, plugin, threadId);
	if (!access) return c.text('Forbidden', 403);
	if (!canManageGroupSettings(access.actorRole, access.isBotAdmin)) {
		return c.html(
			renderInviteCard(threadId, plugin.groupService.getSavedLink(threadId), false),
		);
	}

	if (action === 'disable') {
		await plugin.groupService.disableLink(threadId);
		return c.html(renderInviteCard(threadId, undefined, true));
	}

	const link = await plugin.groupService.enableLink(threadId);
	const savedLink = link || plugin.groupService.getSavedLink(threadId);
	return c.html(renderInviteCard(threadId, savedLink, true));
}

async function getTargetAccess(
	c: Context,
	plugin: Main,
): Promise<
	| Response
	| {
			access: GroupAccess;
			threadId: string;
			userId: string;
			target: GroupMember;
	  }
> {
	const threadId = c.req.param('id');
	const userId = c.req.param('uid');
	const access = await getGroupAccess(c, plugin, threadId);
	if (!access) return c.text('Forbidden', 403);

	const target = await plugin.groupService.getGroupMember(threadId, userId);
	if (!target) return c.html(toast('error', 'Member not found'), 404);

	return { access, threadId, userId, target };
}

async function getGroupAccess(
	c: Context,
	plugin: Main,
	threadId: string,
): Promise<GroupAccess | null> {
	const session = c.get('session');
	if (!session || !canAccessGroup(session, threadId)) return null;

	const isBotAdmin = isBotAdminSession(session);
	const actorRole = isBotAdmin
		? Role.BotAdmin
		: await plugin.groupTracker.getRoleForUser(session.userId, threadId);

	if (!isBotAdmin && actorRole < Role.Deputy) return null;
	return { sessionUserId: session.userId, isBotAdmin, actorRole };
}

function getDisplayRole(member: GroupMember): string {
	switch (member.role) {
		case 'botAdmin':
			return 'BotAdmin';
		case 'leader':
			return 'Leader';
		case 'deputy':
			return 'Deputy';
		case 'virtualDeputy':
			return 'vDeputy';
		case 'bot':
			return 'Bot';
		case 'member':
			return 'Member';
	}
}

function getActionSuccessMessage(action: 'kick' | 'ban' | 'unban'): string {
	if (action === 'kick') return 'Member kicked';
	if (action === 'ban') return 'Member banned';
	return 'Member unbanned';
}

function getActionFailureMessage(action: 'kick' | 'ban' | 'unban'): string {
	if (action === 'kick') return 'Failed to kick member';
	if (action === 'ban') return 'Failed to ban member';
	return 'Failed to unban member';
}
