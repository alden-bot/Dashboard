import { Hono } from 'hono';
import type Main from '../main';
import { requireAuth } from '../auth/middleware';
import { Role } from '@/core/permission/PermissionManager';
import { renderGroups } from '../views/groups';
import { renderGroupDetail } from '../views/group-detail';
import { escapeHtml } from '../utils/html';

export function createGroupRoutes(plugin: Main): Hono {
	const app = new Hono();

	app.use('/groups/*', requireAuth);

	app.get('/groups', async (c) => {
		const session = c.get('session')!;
		const isAdmin = session.role >= Role.BotAdmin;

		const groupIds = isAdmin
			? plugin.groupTracker.getAllGroupIds()
			: session.groupIds;

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

		return c.html(renderGroupDetail(group, members, isAdmin, plugin.i18n!, plugin.bot.config.LANGUAGE, savedLink));
	});

	app.post('/groups/:id/members/:uid/kick', async (c) => {
		const session = c.get('session')!;
		const threadId = c.req.param('id');
		const userId = c.req.param('uid');

		if (!canManageGroup(session, threadId)) {
			return c.text('Forbidden', 403);
		}

		const success = await plugin.groupService.kickMember(threadId, userId);
		return c.html(success
			? `<div class="alert alert-success">Member kicked</div>`
			: `<div class="alert alert-error">Failed to kick member</div>`,
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
		return c.html(success
			? `<div class="alert alert-success">Member banned</div>`
			: `<div class="alert alert-error">Failed to ban member</div>`,
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
		return c.html(success
			? `<div class="alert alert-success">Member unbanned</div>`
			: `<div class="alert alert-error">Failed to unban member</div>`,
		);
	});

	app.post('/groups/:id/deputies/:uid/add', async (c) => {
		const session = c.get('session')!;
		const threadId = c.req.param('id');
		const userId = c.req.param('uid');

		if (!canManageGroup(session, threadId)) {
			return c.text('Forbidden', 403);
		}

		const success = await plugin.groupService.addDeputy(threadId, userId);
		return c.html(success
			? `<div class="alert alert-success">Deputy added</div>`
			: `<div class="alert alert-error">Failed to add deputy</div>`,
		);
	});

	app.post('/groups/:id/deputies/:uid/remove', async (c) => {
		const session = c.get('session')!;
		const threadId = c.req.param('id');
		const userId = c.req.param('uid');

		if (!canManageGroup(session, threadId)) {
			return c.text('Forbidden', 403);
		}

		const success = await plugin.groupService.removeDeputy(threadId, userId);
		return c.html(success
			? `<div class="alert alert-success">Deputy removed</div>`
			: `<div class="alert alert-error">Failed to remove deputy</div>`,
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
		return c.html(success
			? `<div class="alert alert-success">Group name changed</div>`
			: `<div class="alert alert-error">Failed to change group name</div>`,
		);
	});

	app.post('/groups/:id/link/enable', async (c) => {
		const session = c.get('session')!;
		const threadId = c.req.param('id');

		if (!canManageGroup(session, threadId)) {
			return c.text('Forbidden', 403);
		}

		const link = await plugin.groupService.enableLink(threadId);
		if (link) {
			return c.html(`
				<div class="p-3 bg-gray-800 rounded-lg">
					<p class="text-xs text-gray-400 mb-1">Invite Link:</p>
					<p class="text-sm text-indigo-400 break-all">${escapeHtml(link)}</p>
				</div>
			`);
		}
		return c.html(`<div class="text-sm text-red-400">Failed to enable link</div>`);
	});

	app.post('/groups/:id/link/refresh', async (c) => {
		const session = c.get('session')!;
		const threadId = c.req.param('id');

		if (!canManageGroup(session, threadId)) {
			return c.text('Forbidden', 403);
		}

		const link = await plugin.groupService.enableLink(threadId);
		if (link) {
			return c.html(`
				<div class="p-3 bg-gray-800 rounded-lg">
					<p class="text-xs text-gray-400 mb-1">New Invite Link:</p>
					<p class="text-sm text-indigo-400 break-all">${escapeHtml(link)}</p>
				</div>
			`);
		}
		return c.html(`<div class="text-sm text-red-400">Failed to refresh link</div>`);
	});

	app.post('/groups/:id/link/disable', async (c) => {
		const session = c.get('session')!;
		const threadId = c.req.param('id');

		if (!canManageGroup(session, threadId)) {
			return c.text('Forbidden', 403);
		}

		const success = await plugin.groupService.disableLink(threadId);
		return c.html(success
			? `<div class="text-sm text-green-400">Invite link disabled</div>`
			: `<div class="text-sm text-red-400">Failed to disable link</div>`,
		);
	});

	function canManageGroup(session: { role: number; groupIds: string[] }, threadId: string): boolean {
		if (session.role >= (Role.BotAdmin as number)) return true;
		return session.groupIds.includes(threadId);
	}

	return app;
}
