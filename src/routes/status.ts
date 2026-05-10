import { Hono } from 'hono';
import type Main from '../main';
import { requireAuth } from '../auth/middleware';
import { renderStatus } from '../views/status';
import { renderDashboard } from '../views/dashboard';
import { Role } from '@/core/permission/PermissionManager';

export function createStatusRoutes(plugin: Main): Hono {
	const app = new Hono();

	app.use('/status', requireAuth);

	app.get('/status', (c) => {
		const session = c.get('session')!;
		const isAdmin = session.role >= Role.BotAdmin;
		const status = plugin.botService.getStatus();

		return c.html(renderStatus(status, plugin.i18n!, plugin.bot.config.LANGUAGE, isAdmin));
	});

	app.get('/dashboard', (c) => {
		const session = c.get('session');
		if (!session) {
			return c.redirect('/login');
		}

		const isAdmin = session.role >= Role.BotAdmin;
		const status = plugin.botService.getStatus();
		const groupCount = plugin.groupTracker.getAllGroupIds().length;

		return c.html(renderDashboard(status, groupCount, plugin.i18n!, plugin.bot.config.LANGUAGE, isAdmin));
	});

	return app;
}
