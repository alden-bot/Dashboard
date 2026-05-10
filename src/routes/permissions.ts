import { Hono } from 'hono';
import type Main from '../main';
import { requireAdmin } from '../auth/middleware';
import { renderPermissions } from '../views/permissions';
import { escapeHtml } from '../utils/html';

export function createPermissionRoutes(plugin: Main): Hono {
	const app = new Hono();

	app.use('/permissions/*', requireAdmin);

	app.get('/permissions', (c) => {
		const nodes = plugin.botService.getPermissionNodes();

		return c.html(renderPermissions(nodes, plugin.i18n!, plugin.bot.config.LANGUAGE));
	});

	app.post('/permissions/grant', async (c) => {
		const body = await c.req.parseBody();
		const userId = body['userId'] as string;
		const node = body['node'] as string;

		if (!userId || !node) {
			return c.html(`<div class="alert alert-error">User ID and node are required</div>`);
		}

		const success = await plugin.botService.grantPermission(userId, node);
		return c.html(success
			? `<div class="alert alert-success">Granted "${escapeHtml(node)}" to ${escapeHtml(userId)}</div>`
			: `<div class="alert alert-error">Failed to grant permission</div>`,
		);
	});

	app.post('/permissions/revoke', async (c) => {
		const body = await c.req.parseBody();
		const userId = body['userId'] as string;
		const node = body['node'] as string;

		if (!userId || !node) {
			return c.html(`<div class="alert alert-error">User ID and node are required</div>`);
		}

		const success = await plugin.botService.revokePermission(userId, node);
		return c.html(success
			? `<div class="alert alert-success">Revoked "${escapeHtml(node)}" from ${escapeHtml(userId)}</div>`
			: `<div class="alert alert-error">Failed to revoke permission</div>`,
		);
	});

	app.post('/permissions/deputy/add', async (c) => {
		const body = await c.req.parseBody();
		const threadId = body['threadId'] as string;
		const userId = body['userId'] as string;

		if (!threadId || !userId) {
			return c.html(`<div class="alert alert-error">Thread ID and User ID are required</div>`);
		}

		const success = await plugin.botService.addVirtualDeputy(threadId, userId);
		return c.html(success
			? `<div class="alert alert-success">Virtual deputy added</div>`
			: `<div class="alert alert-error">Failed to add virtual deputy</div>`,
		);
	});

	app.post('/permissions/deputy/remove', async (c) => {
		const body = await c.req.parseBody();
		const threadId = body['threadId'] as string;
		const userId = body['userId'] as string;

		if (!threadId || !userId) {
			return c.html(`<div class="alert alert-error">Thread ID and User ID are required</div>`);
		}

		const success = await plugin.botService.removeVirtualDeputy(threadId, userId);
		return c.html(success
			? `<div class="alert alert-success">Virtual deputy removed</div>`
			: `<div class="alert alert-error">Failed to remove virtual deputy</div>`,
		);
	});

	return app;
}
