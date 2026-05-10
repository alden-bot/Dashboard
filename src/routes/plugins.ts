import { Hono } from 'hono';
import type Main from '../main';
import { requireAdmin } from '../auth/middleware';
import { renderPlugins } from '../views/plugins';
import { escapeHtml } from '../utils/html';

export function createPluginRoutes(plugin: Main): Hono {
	const app = new Hono();

	app.use('/plugins/*', requireAdmin);

	app.get('/plugins', (c) => {
		const plugins = plugin.botService.getPlugins();

		return c.html(renderPlugins(plugins, plugin.i18n!, plugin.bot.config.LANGUAGE));
	});

	app.post('/plugins/:name/reload', async (c) => {
		const name = c.req.param('name');
		const success = await plugin.botService.reloadPlugin(name);

		return c.html(success
			? `<div class="alert alert-success">Plugin "${escapeHtml(name)}" reloaded</div>`
			: `<div class="alert alert-error">Failed to reload plugin "${escapeHtml(name)}"</div>`,
		);
	});

	return app;
}
