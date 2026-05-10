import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type Main from '../main';
import { requireAdmin } from '../auth/middleware';
import { renderFeed } from '../views/feed';

export function createSSERoutes(plugin: Main): Hono {
	const app = new Hono();

	app.use('/events', requireAdmin);
	app.use('/feed', requireAdmin);

	// Feed page
	app.get('/feed', (c) => {
		return c.html(renderFeed(plugin.i18n!, plugin.bot.config.LANGUAGE));
	});

	// SSE endpoint
	app.get('/events', (c) => {
		return streamSSE(c, async (stream) => {
			// Send buffered history first
			const buffer = plugin.getFeedBuffer();
			for (const entry of buffer) {
				await stream.writeSSE({
					event: 'message',
					data: JSON.stringify(entry),
				});
			}

			// Subscribe to real-time updates
			let connected = true;
			const unsubscribe = plugin.subscribeFeed((entry) => {
				if (connected) {
					stream.writeSSE({
						event: 'message',
						data: JSON.stringify(entry),
					}).catch(() => {
						connected = false;
					});
				}
			});

			// Cleanup on disconnect
			stream.onAbort(() => {
				connected = false;
				unsubscribe();
			});

			// Keep stream alive with periodic pings
			while (connected) {
				await new Promise((resolve) => setTimeout(resolve, 15000));
				if (connected) {
					try {
						await stream.writeSSE({ event: 'ping', data: '{}' });
					} catch {
						connected = false;
					}
				}
			}

			unsubscribe();
		});
	});

	return app;
}
