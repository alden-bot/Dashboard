import { Hono } from 'hono';
import type Main from '../main';
import { requireAdmin } from '../auth/middleware';
import { renderPlugins } from '../views/plugins';


export function createPluginRoutes(plugin: Main): Hono {
	const app = new Hono();

	app.use('/plugins/*', requireAdmin);

	app.get('/plugins', (c) => {
		const plugins = plugin.botService.getPlugins();
		return c.html(renderPlugins(plugins, plugin.i18n!, plugin.bot.config.LANGUAGE));
	});

	app.post('/plugins/reload-all', async (c) => {
		const success = await plugin.botService.reloadAll();
		if (success) {
			const count = plugin.bot.pluginManager.getPlugins().size;
			return c.html(
				`<div class="p-3 rounded-lg text-sm toast-success">Reloaded ${count} plugins successfully</div>`,
			);
		}
		return c.html(`<div class="p-3 rounded-lg text-sm toast-error">Failed to reload plugins</div>`);
	});

	return app;
}
