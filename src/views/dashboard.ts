import type { I18nManager } from '@/utils/I18nManager';
import type { BotStatus } from '../services/BotService';
import { renderLayout } from './layout';

export function renderDashboard(
	status: BotStatus,
	groupCount: number,
	i18n: I18nManager,
	lang: string,
	isAdmin = false,
): string {
	const stats = [
		{ label: 'Version', value: status.version, icon: '&#x1F4E6;' },
		{ label: 'Uptime', value: status.uptimeFormatted, icon: '&#x23F1;' },
		{ label: 'Memory', value: `${status.memory.heapUsed} MB`, icon: '&#x1F4BB;' },
		{ label: 'Groups', value: String(groupCount), icon: '&#x1F465;' },
		{ label: 'Plugins', value: String(status.pluginCount), icon: '&#x1F9E9;' },
	];

	const statCards = stats
		.map(
			(s) => `
		<div class="bg-gray-900 border border-gray-800 rounded-xl p-5">
			<div class="text-2xl mb-2">${s.icon}</div>
			<div class="text-2xl font-bold text-white">${s.value}</div>
			<div class="text-sm text-gray-500 mt-1">${s.label}</div>
		</div>`,
		)
		.join('');

	const content = `
		<div class="mb-8">
			<h1 class="text-2xl font-bold text-white">Dashboard</h1>
			<p class="text-gray-500 text-sm mt-1">Overview of your bot</p>
		</div>

		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
			${statCards}
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="bg-gray-900 border border-gray-800 rounded-xl p-5">
				<h3 class="text-sm font-medium text-gray-400 mb-3">System</h3>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-gray-500">OS</span>
						<span class="text-gray-300">${status.os.type} ${status.os.arch}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-500">Node.js</span>
						<span class="text-gray-300">${status.node}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-500">CPU</span>
						<span class="text-gray-300 truncate ml-4">${status.cpu}</span>
					</div>
				</div>
			</div>

			<div class="bg-gray-900 border border-gray-800 rounded-xl p-5">
				<h3 class="text-sm font-medium text-gray-400 mb-3">Memory</h3>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-gray-500">RSS</span>
						<span class="text-gray-300">${status.memory.rss} MB</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-500">Heap Used</span>
						<span class="text-gray-300">${status.memory.heapUsed} / ${status.memory.heapTotal} MB</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-500">OS Free</span>
						<span class="text-gray-300">${status.os.freeMem} / ${status.os.totalMem} MB</span>
					</div>
				</div>
				<div class="mt-3 bg-gray-800 rounded-full h-2">
					<div class="bg-indigo-600 h-2 rounded-full" style="width: ${Math.round((status.memory.heapUsed / status.memory.heapTotal) * 100)}%"></div>
				</div>
			</div>
		</div>
	`;

	return renderLayout('Dashboard', content, i18n, lang, isAdmin, 'dashboard');
}
