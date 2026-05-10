import type { I18nManager } from '@/utils/I18nManager';
import type { BotConfigData } from '../services/BotService';
import { renderLayout } from './layout';

export function renderConfig(
	config: BotConfigData,
	i18n: I18nManager,
	lang: string,
): string {
	const content = `
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-white">Bot Config</h1>
			<p class="text-gray-500 text-sm mt-1">Current configuration (requires restart to apply changes)</p>
		</div>

		<div id="config-result"></div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
			<div class="bg-gray-900 border border-gray-800 rounded-xl p-5">
				<h3 class="text-sm font-medium text-gray-400 mb-4">Current Values</h3>
				<div class="space-y-3">
					<div class="flex justify-between items-center py-2 border-b border-gray-800">
						<span class="text-gray-500 text-sm">Version</span>
						<span class="text-white font-mono text-sm">v${escapeHtml(config.version)}</span>
					</div>
					<div class="flex justify-between items-center py-2 border-b border-gray-800">
						<span class="text-gray-500 text-sm">Prefix</span>
						<code class="text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded text-sm">${escapeHtml(config.prefix)}</code>
					</div>
					<div class="flex justify-between items-center py-2 border-b border-gray-800">
						<span class="text-gray-500 text-sm">Language</span>
						<span class="text-white text-sm">${config.language === 'vi' ? 'Vietnamese' : 'English'}</span>
					</div>
					<div class="flex justify-between items-center py-2 border-b border-gray-800">
						<span class="text-gray-500 text-sm">Reply Unknown</span>
						<span class="text-white text-sm">${config.replyUnknownCommand ? 'Yes' : 'No'}</span>
					</div>
					<div class="py-2">
						<span class="text-gray-500 text-sm block mb-2">Admin IDs</span>
						<div class="flex flex-wrap gap-2">
							${config.adminIds.map((id) => `<code class="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded font-mono">${id}</code>`).join('') || '<span class="text-gray-600 text-sm">None</span>'}
						</div>
					</div>
				</div>
			</div>

			<div class="bg-gray-900 border border-gray-800 rounded-xl p-5">
				<h3 class="text-sm font-medium text-gray-400 mb-4">Edit Config</h3>
				<form hx-post="/config" hx-swap="outerHTML" hx-target="#config-result" class="space-y-4">
					<div>
						<label class="block text-sm text-gray-400 mb-1">Prefix</label>
						<input type="text" name="prefix" value="${escapeHtml(config.prefix)}" maxlength="5"
							class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
					</div>
					<div>
						<label class="block text-sm text-gray-400 mb-1">Language</label>
						<select name="language"
							class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
							<option value="vi" ${config.language === 'vi' ? 'selected' : ''}>Vietnamese</option>
							<option value="en" ${config.language === 'en' ? 'selected' : ''}>English</option>
						</select>
					</div>
					<div class="flex items-center gap-2">
						<input type="checkbox" name="replyUnknownCommand" id="replyUnknown" ${config.replyUnknownCommand ? 'checked' : ''}
							class="w-4 h-4 rounded bg-gray-800 border-gray-700 text-indigo-600 focus:ring-indigo-500">
						<label for="replyUnknown" class="text-sm text-gray-400">Reply to unknown commands</label>
					</div>
					<button type="submit" class="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
						Save Changes
					</button>
					<p class="text-xs text-gray-500 text-center">Changes require a bot restart to take effect</p>
				</form>
			</div>
		</div>
	`;

	return renderLayout('Config', content, i18n, lang, true, 'config');
}

function escapeHtml(str: string): string {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
