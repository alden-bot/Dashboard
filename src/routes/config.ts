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
		// Note: All config changes require a restart to take effect
		return c.html(`
			<div class="alert alert-warning">
				Config changes require a bot restart to take effect.
				Please restart the bot to apply changes.
			</div>
		`);
	});

	return app;
}
