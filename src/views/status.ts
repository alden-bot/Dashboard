import type { I18nManager } from '@/api';
import type { BotStatus } from '../services/BotService';
import { renderLayout } from './layout';

export function renderStatus(
	status: BotStatus,
	i18n: I18nManager,
	lang: string,
	isAdmin = false,
): string {
	const usedMem = status.os.totalMem - status.os.freeMem;
	const memPercent = Math.round((usedMem / status.os.totalMem) * 100);
	const heapPercent = Math.round((status.memory.heapUsed / status.memory.heapTotal) * 100);

	const content = `
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-white">System Status</h1>
			<p class="text-gray-500 text-sm mt-1">Real-time system information</p>
		</div>

		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
			<div class="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-lg">
				<div class="text-gray-500 text-xs mb-1">Version</div>
				<div class="text-white font-bold text-lg">v${status.version}</div>
			</div>
			<div class="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-lg">
				<div class="text-gray-500 text-xs mb-1">Uptime</div>
				<div class="text-white font-bold text-lg">${status.uptimeFormatted}</div>
			</div>
			<div class="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-lg">
				<div class="text-gray-500 text-xs mb-1">Plugins</div>
				<div class="text-white font-bold text-lg">${status.pluginCount}</div>
			</div>
			<div class="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-lg">
				<div class="text-gray-500 text-xs mb-1">Groups</div>
				<div class="text-white font-bold text-lg">${status.groupCount}</div>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
			<div class="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
				<h3 class="text-sm font-medium text-gray-400 mb-4">Memory (Heap)</h3>
				<div class="flex justify-between text-sm mb-2">
					<span class="text-gray-500">${status.memory.heapUsed} MB used</span>
					<span class="text-gray-500">${status.memory.heapTotal} MB total</span>
				</div>
				<div class="bg-gray-800 rounded-full h-3 mb-2">
					<div class="bg-indigo-600 h-3 rounded-full transition-all duration-500" style="width: ${heapPercent}%"></div>
				</div>
				<div class="text-right text-xs text-gray-500">${heapPercent}%</div>
			</div>

			<div class="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
				<h3 class="text-sm font-medium text-gray-400 mb-4">Memory Used</h3>
				<div class="flex justify-between text-sm mb-2">
					<span class="text-gray-500">${usedMem} MB used</span>
					<span class="text-gray-500">${status.os.totalMem} MB total</span>
				</div>
				<div class="bg-gray-800 rounded-full h-3 mb-2">
					<div class="bg-purple-600 h-3 rounded-full transition-all duration-500" style="width: ${memPercent}%"></div>
				</div>
				<div class="text-right text-xs text-gray-500">${memPercent}%</div>
			</div>
		</div>

		<div class="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
			<h3 class="text-sm font-medium text-gray-400 mb-4">System Information</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<div class="flex justify-between py-1.5 border-b border-gray-800">
						<span class="text-gray-500 text-sm">OS</span>
						<span class="text-gray-300 text-sm">${status.os.type}</span>
					</div>
					<div class="flex justify-between py-1.5 border-b border-gray-800">
						<span class="text-gray-500 text-sm">Release</span>
						<span class="text-gray-300 text-sm">${status.os.release}</span>
					</div>
					<div class="flex justify-between py-1.5 border-b border-gray-800">
						<span class="text-gray-500 text-sm">Architecture</span>
						<span class="text-gray-300 text-sm">${status.os.arch}</span>
					</div>
				</div>
				<div class="space-y-2">
					<div class="flex justify-between py-1.5 border-b border-gray-800">
						<span class="text-gray-500 text-sm">Node.js</span>
						<span class="text-gray-300 text-sm">${status.node}</span>
					</div>
					<div class="flex justify-between py-1.5 border-b border-gray-800">
						<span class="text-gray-500 text-sm">CPU</span>
						<span class="text-gray-300 text-sm truncate ml-4">${status.cpu}</span>
					</div>
					<div class="flex justify-between py-1.5 border-b border-gray-800">
						<span class="text-gray-500 text-sm">RSS Memory</span>
						<span class="text-gray-300 text-sm">${status.memory.rss} MB</span>
					</div>
				</div>
			</div>
		</div>
	`;

	return renderLayout('Status', content, i18n, lang, isAdmin, 'status');
}
