import type { I18nManager } from '@/api';
import type { PluginInfo } from '../services/BotService';
import { renderLayout } from './layout';
import { escapeHtml } from '../utils/html';

export function renderPlugins(plugins: PluginInfo[], i18n: I18nManager, lang: string): string {
	const rows = plugins
		.map(
			(p) => `
		<tr class="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
			<td class="px-4 py-3">
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 bg-indigo-900/50 rounded-lg flex items-center justify-center text-indigo-400 text-xs font-bold">
						${escapeHtml(p.name).charAt(0)}
					</div>
					<span class="text-white font-medium">${escapeHtml(p.name)}</span>
				</div>
			</td>
			<td class="px-4 py-3">
				<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">
					v${escapeHtml(p.version)}
				</span>
			</td>
			<td class="px-4 py-3 text-gray-400 text-sm">${escapeHtml(p.description)}</td>
			<td class="px-4 py-3 text-gray-500 text-sm">${escapeHtml(p.author)}</td>
		</tr>`,
		)
		.join('');

	const content = `
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-white">Plugins</h1>
			<p class="text-gray-500 text-sm mt-1">${plugins.length} plugin${plugins.length !== 1 ? 's' : ''} loaded</p>
		</div>

		<div class="mb-4">
			<button
				hx-post="/plugins/reload-all"
				hx-confirm="Reload all plugins? This may cause brief downtime."
				hx-swap="innerHTML"
				hx-target="#plugin-result"
				class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
			>
				Reload All
			</button>
		</div>

		<div id="plugin-result"></div>

		<div class="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-gray-800 text-left">
							<th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
							<th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Version</th>
							<th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
							<th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Author</th>
						</tr>
					</thead>
					<tbody>
						${rows || '<tr><td colspan="4" class="px-4 py-8 text-center text-gray-500">No plugins loaded</td></tr>'}
					</tbody>
				</table>
			</div>
		</div>
	`;

	return renderLayout('Plugins', content, i18n, lang, true, 'plugins');
}
