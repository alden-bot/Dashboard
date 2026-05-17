import { Hono } from 'hono';
import type Main from '../main';
import { requireAuth } from '../auth/middleware';
import { Role } from '@/api';
import { renderGroups } from '../views/groups';
import { renderGroupDetail, renderInviteCard } from '../views/group-detail';

export function createGroupRoutes(plugin: Main): Hono {
	const app = new Hono();

	app.use('/groups/*', requireAuth);

	app.get('/groups', async (c) => {
		const session = c.get('session')!;
		const isAdmin = session.role >= Role.BotAdmin;

		const groupIds = isAdmin ? plugin.groupTracker.getAllGroupIds() : session.groupIds;

		const groups = await plugin.groupService.getGroupsInfo(groupIds);

		return c.html(renderGroups(groups, isAdmin, plugin.i18n!, plugin.bot.config.LANGUAGE));
	});

	app.get('/groups/:id', async (c) => {
		const threadId = c.req.param('id');
		const session = c.get('session')!;
		const isAdmin = session.role >= Role.BotAdmin;

		// Check access
		if (!isAdmin && !session.groupIds.includes(threadId)) {
			return c.text('Forbidden', 403);
		}

		const group = await plugin.groupService.getGroupInfo(threadId);
		if (!group) {
			return c.text('Group not found', 404);
		}

		const members = await plugin.groupService.getGroupMembers(threadId);
		const savedLink = plugin.groupService.getSavedLink(threadId);

		return c.html(
			renderGroupDetail(
				group,
				members,
				isAdmin,
				plugin.i18n!,
				plugin.bot.config.LANGUAGE,
				savedLink,
			),
		);
	});

	app.post('/groups/:id/members/:uid/kick', async (c) => {
		const session = c.get('session')!;
		const threadId = c.req.param('id');
		const userId = c.req.param('uid');

		if (!canManageGroup(session, threadId)) {
			return c.text('Forbidden', 403);
		}

		const success = await plugin.groupService.kickMember(threadId, userId);
		return c.html(
			success
				? `<div class="p-3 rounded-lg text-sm toast-success">Member kicked</div>`
				: `<div class="p-3 rounded-lg text-sm toast-error">Failed to kick member</div>`,
		);
	});

	app.post('/groups/:id/members/:uid/ban', async (c) => {
		const session = c.get('session')!;
		const threadId = c.req.param('id');
		const userId = c.req.param('uid');

		if (!canManageGroup(session, threadId)) {
			return c.text('Forbidden', 403);
		}

		const success = await plugin.groupService.banMember(threadId, userId);
		return c.html(
			success
				? `<div class="p-3 rounded-lg text-sm toast-success">Member banned</div>`
				: `<div class="p-3 rounded-lg text-sm toast-error">Failed to ban member</div>`,
		);
	});

	app.post('/groups/:id/members/:uid/unban', async (c) => {
		const session = c.get('session')!;
		const threadId = c.req.param('id');
		const userId = c.req.param('uid');

		if (!canManageGroup(session, threadId)) {
			return c.text('Forbidden', 403);
		}

		const success = await plugin.groupService.unbanMember(threadId, userId);
		return c.html(
			success
				? `<div class="p-3 rounded-lg text-sm toast-success">Member unbanned</div>`
				: `<div class="p-3 rounded-lg text-sm toast-error">Failed to unban member</div>`,
		);
	});

	app.post('/groups/:id/deputies/:uid/add', async (c) => {
		const session = c.get('session')!;
		const threadId = c.req.param('id');
		const userId = c.req.param('uid');

		if (!canManageGroup(session, threadId)) {
			return c.text('Forbidden', 403);
		}

		const success = await plugin.botService.addVirtualDeputy(threadId, userId);
		return c.html(
			success
				? `<div class="p-3 rounded-lg text-sm toast-success">vDeputy added</div>`
				: `<div class="p-3 rounded-lg text-sm toast-error">Failed to add vDeputy</div>`,
		);
	});

	app.post('/groups/:id/deputies/:uid/remove', async (c) => {
		const session = c.get('session')!;
		const threadId = c.req.param('id');
		const userId = c.req.param('uid');

		if (!canManageGroup(session, threadId)) {
			return c.text('Forbidden', 403);
		}

		const success = await plugin.botService.removeVirtualDeputy(threadId, userId);
		return c.html(
			success
				? `<div class="p-3 rounded-lg text-sm toast-success">vDeputy removed</div>`
				: `<div class="p-3 rounded-lg text-sm toast-error">Failed to remove vDeputy</div>`,
		);
	});

	app.post('/groups/:id/name', async (c) => {
		const session = c.get('session')!;
		const threadId = c.req.param('id');
		const body = await c.req.parseBody();
		const name = body['name'] as string;

		if (!canManageGroup(session, threadId)) {
			return c.text('Forbidden', 403);
		}

		const success = await plugin.groupService.changeName(threadId, name);
		return c.html(
			success
				? `<div class="p-3 rounded-lg text-sm toast-success">Group name changed</div>`
				: `<div class="p-3 rounded-lg text-sm toast-error">Failed to change group name</div>`,
		);
	});

	app.post('/groups/:id/link/enable', async (c) => {
		const session = c.get('session')!;
		const threadId = c.req.param('id');

		if (!canManageGroup(session, threadId)) {
			return c.text('Forbidden', 403);
		}

		const link = await plugin.groupService.enableLink(threadId);
		const savedLink = link || plugin.groupService.getSavedLink(threadId);
		return c.html(renderInviteCard(threadId, savedLink));
	});

	app.post('/groups/:id/link/refresh', async (c) => {
		const session = c.get('session')!;
		const threadId = c.req.param('id');

		if (!canManageGroup(session, threadId)) {
			return c.text('Forbidden', 403);
		}

		const link = await plugin.groupService.enableLink(threadId);
		const savedLink = link || plugin.groupService.getSavedLink(threadId);
		return c.html(renderInviteCard(threadId, savedLink));
	});

	app.post('/groups/:id/link/disable', async (c) => {
		const session = c.get('session')!;
		const threadId = c.req.param('id');

		if (!canManageGroup(session, threadId)) {
			return c.text('Forbidden', 403);
		}

		await plugin.groupService.disableLink(threadId);
		return c.html(renderInviteCard(threadId));
	});

	app.get('/groups/:id/members/:uid/detail', async (c) => {
		const session = c.get('session')!;
		const threadId = c.req.param('id');
		const userId = c.req.param('uid');

		if (!canManageGroup(session, threadId)) {
			return c.text('Forbidden', 403);
		}

		const role = await plugin.bot.permissionManager.getRoleLevel(threadId, userId, true);
		const roleName = Role[role] ?? 'Member';
		const perms = plugin.bot.permissionManager.getUserPermissions(userId);
		const isVirtualDeputy = plugin.bot.permissionManager.isVirtualDeputy(threadId, userId);

		return c.html(`
			<div class="mt-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700 text-sm space-y-1">
				<div class="flex justify-between"><span class="text-gray-400">Role:</span><span class="text-white">${roleName}</span></div>
				<div class="flex justify-between"><span class="text-gray-400">Virtual Deputy:</span><span class="text-white">${isVirtualDeputy ? 'Yes' : 'No'}</span></div>
				<div class="flex justify-between"><span class="text-gray-400">Permissions:</span><span class="text-white">${perms.length > 0 ? perms.join(', ') : 'None'}</span></div>
			</div>
		`);
	});

	function canManageGroup(
		session: { role: Role; groupIds: string[] },
		threadId: string,
	): boolean {
		if (session.role >= Role.BotAdmin) return true;
		return session.groupIds.includes(threadId);
	}

	return app;
}
