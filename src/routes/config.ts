import { Hono } from 'hono';
import type Main from '../main';
import { requireAdmin } from '../auth/middleware';
import { renderConfig } from '../views/config';

export function createConfigRoutes(plugin: Main): Hono {
	const app = new Hono();

	app.use('/config/*', requireAdmin);

	app.get('/config', (c) => {
		const config = plugin.botService.getConfig();

		return c.html(renderConfig(config, plugin.i18n!, plugin.bot.config.LANGUAGE));
	});

	app.post('/config', async (c) => {
		return c.html(`
			<div class="p-3 rounded-lg text-sm bg-yellow-900/50 border border-yellow-600 text-yellow-200">
				Config changes require a bot restart to take effect.
			</div>
		`);
	});

	return app;
}
