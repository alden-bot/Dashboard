import type { I18nManager } from '@/api';
import { renderLayout } from './layout';

export function renderFeed(i18n: I18nManager, lang: string): string {
	const content = `
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-white">Live Message Feed</h1>
			<p class="text-gray-500 text-sm mt-1">Real-time messages from all groups</p>
		</div>

		<div class="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
			<div class="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
				<h3 class="text-sm font-medium text-gray-400">Messages</h3>
				<div class="flex items-center gap-2">
					<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
					<span class="text-xs text-gray-500">Connected</span>
				</div>
			</div>
			<div id="feed" class="max-h-[70vh] overflow-y-auto p-4 space-y-2 font-mono text-sm">
				<div class="text-gray-500 text-center py-8">Waiting for messages...</div>
			</div>
		</div>

		<script>
			(function() {
				const feed = document.getElementById('feed');
				let connected = false;

				function connectSSE() {
					const evtSource = new EventSource('/events');

					evtSource.onopen = function() {
						connected = true;
						const status = feed.parentElement.querySelector('.animate-pulse');
						if (status) status.parentElement.querySelector('span').textContent = 'Connected';
					};

					evtSource.addEventListener('message', function(event) {
						try {
							const data = JSON.parse(event.data);

							// Remove placeholder
							const placeholder = feed.querySelector('.text-center');
							if (placeholder) placeholder.remove();

							const entry = document.createElement('div');
							entry.className = 'flex gap-3 py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors';

							const time = new Date(data.timestamp).toLocaleTimeString();
							const typeBadge = data.type === 1
								? '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-900/50 text-indigo-400 border border-indigo-800">Group</span>'
								: '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-900/50 text-green-400 border border-green-800">DM</span>';

							entry.innerHTML = \`
								<span class="text-gray-600 text-xs whitespace-nowrap">\${time}</span>
								\${typeBadge}
								<span class="text-gray-400 font-medium">\${escapeHtml(data.dName || data.uidFrom)}</span>
								<span class="text-gray-300 flex-1">\${escapeHtml(String(data.content))}</span>
							\`;

							feed.appendChild(entry);
							feed.scrollTop = feed.scrollHeight;

							// Limit entries to prevent memory issues
							while (feed.children.length > 500) {
								feed.removeChild(feed.firstChild);
							}
						} catch (e) {
							// Ignore ping events
						}
					});

					evtSource.addEventListener('ping', function() {
						// Keep alive
					});

					evtSource.onerror = function() {
						connected = false;
						const status = feed.parentElement.querySelector('.animate-pulse');
						if (status) status.parentElement.querySelector('span').textContent = 'Reconnecting...';
						evtSource.close();
						setTimeout(connectSSE, 3000);
					};
				}

				function escapeHtml(str) {
					const div = document.createElement('div');
					div.textContent = str;
					return div.innerHTML;
				}

				connectSSE();
			})();
		</script>
	`;

	return renderLayout('Live Feed', content, i18n, lang, true, 'feed');
}
