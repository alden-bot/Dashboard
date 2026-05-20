import type { I18nManager } from '@/api';
import type { BotStatus } from '../services/BotService';
import { renderLayout } from './layout';
import { escapeHtml } from '../utils/html';

export function renderDashboard(
	status: BotStatus,
	groupCount: number,
	i18n: I18nManager,
	lang: string,
	isAdmin = false,
): string {
	const usedMem = status.os.totalMem - status.os.freeMem;
	const memPercent = Math.round((usedMem / status.os.totalMem) * 100);
	const heapPercent = Math.round((status.memory.heapUsed / status.memory.heapTotal) * 100);

	const stats = [
		{
			label: 'Version',
			value: `v${escapeHtml(status.version)}`,
			icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
		},
		{
			label: 'Uptime',
			value: escapeHtml(status.uptimeFormatted),
			icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
		},
		{
			label: 'Groups',
			value: String(groupCount),
			icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
		},
	];

	if (isAdmin) {
		stats.splice(2, 0, {
			label: 'Memory',
			value: `${escapeHtml(status.memory.heapUsed)} MB`,
			icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
		});
		stats.push({
			label: 'Plugins',
			value: String(status.pluginCount),
			icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
		});
	}

	const statCards = stats
		.map(
			(s) => `
		<div class="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg hover:border-gray-700 transition-colors">
			<div class="flex items-center gap-3 mb-2">
				<div class="w-10 h-10 bg-indigo-600/10 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="${s.icon}"/>
					</svg>
				</div>
			</div>
			<div class="text-2xl font-bold text-white">${s.value}</div>
			<div class="text-sm text-gray-500 mt-1">${escapeHtml(s.label)}</div>
		</div>`,
		)
		.join('');

	const quickActions = [
		{
			href: '/groups',
			label: 'Groups',
			desc: 'Manage group chats',
			icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
		},
	];

	const adminActions = [
		{
			href: '/plugins',
			label: 'Plugins',
			desc: 'View loaded plugins',
			icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
		},
		{
			href: '/permissions',
			label: 'Permissions',
			desc: 'Manage access control',
			icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
		},
		{
			href: '/feed',
			label: 'Live Feed',
			desc: 'View message activity',
			icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
		},
		{
			href: '/config',
			label: 'Config',
			desc: 'View bot settings',
			icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
		},
	];

	const allActions = isAdmin ? [...quickActions, ...adminActions] : quickActions;

	const actionCards = allActions
		.map(
			(a) => `
		<a href="${a.href}" class="group bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg hover:border-indigo-500/50 hover:bg-gray-900/80 transition-all duration-200 block h-full">
			<div class="flex items-center gap-3 h-full">
				<div class="w-10 h-10 bg-gray-800 group-hover:bg-indigo-600/20 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
					<svg class="w-5 h-5 text-gray-400 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="${a.icon}"/>
					</svg>
				</div>
				<div class="min-w-0">
					<div class="text-sm font-medium text-white">${a.label}</div>
					<div class="text-xs text-gray-500 truncate">${a.desc}</div>
				</div>
				<svg class="w-4 h-4 text-gray-600 group-hover:text-indigo-400 ml-auto flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
				</svg>
			</div>
		</a>`,
		)
		.join('');

	const content = `
		<div class="mb-8">
			<h1 class="text-2xl font-bold text-white">Overview</h1>
			<p class="text-gray-500 text-sm mt-1">Bot dashboard and system status</p>
		</div>

		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
			${statCards}
		</div>

		${
			isAdmin
				? `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
			<div class="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
				<h3 class="text-sm font-medium text-gray-400 mb-4">System</h3>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between py-1.5 border-b border-gray-800/60">
						<span class="text-gray-500">OS</span>
						<span class="text-gray-300">${escapeHtml(status.os.type)} ${escapeHtml(status.os.arch)}</span>
					</div>
					<div class="flex justify-between py-1.5 border-b border-gray-800/60">
						<span class="text-gray-500">Node.js</span>
						<span class="text-gray-300">${escapeHtml(status.node)}</span>
					</div>
					<div class="flex justify-between py-1.5">
						<span class="text-gray-500">CPU</span>
						<span class="text-gray-300 truncate ml-4">${escapeHtml(status.cpu)}</span>
					</div>
				</div>
			</div>

			<div class="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
				<h3 class="text-sm font-medium text-gray-400 mb-4">Memory Usage</h3>
				<div class="space-y-4">
					<div>
						<div class="flex justify-between text-sm mb-1.5">
							<span class="text-gray-500">Heap</span>
							<span class="text-gray-400">${status.memory.heapUsed} / ${status.memory.heapTotal} MB</span>
						</div>
						<div class="bg-gray-800 rounded-full h-2.5 mb-1">
							<div class="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style="width: ${heapPercent}%"></div>
						</div>
						<div class="text-right text-xs text-gray-500">${heapPercent}%</div>
					</div>
					<div>
						<div class="flex justify-between text-sm mb-1.5">
							<span class="text-gray-500">System</span>
							<span class="text-gray-400">${usedMem} / ${status.os.totalMem} MB</span>
						</div>
						<div class="bg-gray-800 rounded-full h-2.5 mb-1">
							<div class="bg-purple-600 h-2.5 rounded-full transition-all duration-500" style="width: ${memPercent}%"></div>
						</div>
						<div class="text-right text-xs text-gray-500">${memPercent}%</div>
					</div>
				</div>
			</div>
		</div>`
				: ''
		}

		<div class="mb-4">
			<h3 class="text-sm font-medium text-gray-400 mb-4">Quick Actions</h3>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
			${actionCards}
		</div>
	`;

	return renderLayout('Overview', content, i18n, lang, isAdmin, 'dashboard');
}
