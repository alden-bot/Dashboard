import type { I18nManager } from '@/utils/I18nManager';
import type { PluginInfo } from '../services/BotService';
import { renderLayout } from './layout';

export function renderPlugins(
	plugins: PluginInfo[],
	i18n: I18nManager,
	lang: string,
): string {
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
			<td class="px-4 py-3">
				<button
					hx-post="/plugins/${escapeHtml(p.name)}/reload"
					hx-confirm="Reload ${escapeHtml(p.name)}?"
					hx-swap="outerHTML"
					class="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
				>
					Reload
				</button>
			</td>
		</tr>`,
		)
		.join('');

	const content = `
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-white">Plugins</h1>
			<p class="text-gray-500 text-sm mt-1">${plugins.length} plugin${plugins.length !== 1 ? 's' : ''} loaded</p>
		</div>

		<div id="plugin-result"></div>

		<div class="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-gray-800 text-left">
							<th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
							<th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Version</th>
							<th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
							<th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Author</th>
							<th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
						</tr>
					</thead>
					<tbody>
						${rows || '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No plugins loaded</td></tr>'}
					</tbody>
				</table>
			</div>
		</div>
	`;

	return renderLayout('Plugins', content, i18n, lang, true, 'plugins');
}

function escapeHtml(str: string): string {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
