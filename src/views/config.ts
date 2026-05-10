import type { I18nManager } from '@/utils/I18nManager';
import type { BotConfigData } from '../services/BotService';
import { renderLayout } from './layout';
import { escapeHtml } from '../utils/html';

export function renderConfig(
	config: BotConfigData,
	i18n: I18nManager,
	lang: string,
): string {
	const content = `
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-white">Bot Config</h1>
			<p class="text-gray-500 text-sm mt-1">Current configuration (read-only)</p>
		</div>

		<div id="config-result"></div>

		<div class="max-w-2xl">
			<div class="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
				<div class="px-5 py-4 border-b border-gray-800 bg-gray-900/50">
					<h3 class="text-sm font-medium text-gray-400">Configuration Values</h3>
				</div>
				<div class="p-5 space-y-0">
					<div class="flex justify-between items-center py-3 border-b border-gray-800/60">
						<span class="text-gray-500 text-sm">Version</span>
						<span class="text-white font-mono text-sm">v${escapeHtml(config.version)}</span>
					</div>
					<div class="flex justify-between items-center py-3 border-b border-gray-800/60">
						<span class="text-gray-500 text-sm">Prefix</span>
						<code class="text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded text-sm">${escapeHtml(config.prefix)}</code>
					</div>
					<div class="flex justify-between items-center py-3 border-b border-gray-800/60">
						<span class="text-gray-500 text-sm">Language</span>
						<span class="text-white text-sm">${config.language === 'vi' ? 'Vietnamese' : 'English'}</span>
					</div>
					<div class="flex justify-between items-center py-3 border-b border-gray-800/60">
						<span class="text-gray-500 text-sm">Reply Unknown</span>
						<span class="text-white text-sm">${config.replyUnknownCommand ? 'Yes' : 'No'}</span>
					</div>
					<div class="py-3">
						<span class="text-gray-500 text-sm block mb-2">Admin IDs</span>
						<div class="flex flex-wrap gap-2">
							${config.adminIds.map((id) => `<code class="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded font-mono">${id}</code>`).join('') || '<span class="text-gray-600 text-sm">None</span>'}
						</div>
					</div>
				</div>
			</div>
		</div>
	`;

	return renderLayout('Config', content, i18n, lang, true, 'config');
}
