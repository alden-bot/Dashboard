import type { I18nManager } from '@/api';
import { escapeAttr, escapeHtml } from '../utils/html';

export function renderLayout(
	title: string,
	content: string,
	i18n: I18nManager,
	lang: string,
	isAdmin = false,
	activePage = '',
): string {
	const navItems = [
		{
			href: '/dashboard',
			label: 'Overview',
			id: 'dashboard',
			icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
		},
		{
			href: '/groups',
			label: 'Groups',
			id: 'groups',
			icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
		},
	];

	const adminItems = [
		{
			href: '/plugins',
			label: 'Plugins',
			id: 'plugins',
			icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
		},
		{
			href: '/permissions',
			label: 'Permissions',
			id: 'permissions',
			icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
		},
		{
			href: '/config',
			label: 'Config',
			id: 'config',
			icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
		},
		{
			href: '/feed',
			label: 'Live Feed',
			id: 'feed',
			icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
		},
		{
			href: '/ops',
			label: 'Ops',
			id: 'ops',
			icon: 'M13 10V3L4 14h7v7l9-11h-7z',
		},
	];

	const allItems = isAdmin ? [...navItems, ...adminItems] : navItems;

	const navLinks = allItems
		.map(
			(item) => `
			<a href="${item.href}" class="sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
				activePage === item.id
					? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/25'
					: 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
			}">
				<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="${item.icon}"/>
				</svg>
				<span class="sidebar-label">${item.label}</span>
			</a>`,
		)
		.join('');

	return `<!DOCTYPE html>
<html lang="${escapeAttr(lang)}" class="h-full">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapeHtml(title)} - alden-bot Dashboard</title>
	<link rel="stylesheet" href="/assets/dashboard.css">
	<script defer src="/assets/dashboard.js"></script>
</head>
<body class="h-full bg-gray-950 text-gray-100 overflow-hidden">
	<div class="flex h-full">
		<div class="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<button id="menu-toggle" class="p-1.5 hover:bg-gray-800 rounded-lg transition-colors" onclick="toggleSidebar()">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
					</svg>
				</button>
				<h1 class="text-base font-semibold text-white">alden-bot</h1>
			</div>
			<button hx-post="/api/logout" class="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
				</svg>
			</button>
		</div>

		<div id="sidebar-overlay" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onclick="toggleSidebar()"></div>

		<aside id="sidebar" class="fixed md:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 flex flex-col transform -translate-x-full md:translate-x-0 transition-transform duration-200">
			<div class="p-5 border-b border-gray-800/80">
				<h1 class="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">alden-bot</h1>
				<p class="text-xs text-gray-500 mt-0.5">Dashboard</p>
			</div>
			<nav class="flex-1 p-3 space-y-1 overflow-y-auto">
				${navLinks}
			</nav>
			<div class="p-3 border-t border-gray-800/80">
				<button hx-post="/api/logout" class="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/60 rounded-lg transition-colors">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
					</svg>
					<span class="sidebar-label">Logout</span>
				</button>
			</div>
		</aside>

		<main class="flex-1 overflow-y-auto">
			<div class="pt-20 md:pt-6 p-4 md:p-6 max-w-7xl mx-auto">
				${content}
			</div>
		</main>
	</div>

</body>
</html>`;
}
