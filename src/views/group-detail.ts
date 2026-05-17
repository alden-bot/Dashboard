import type { I18nManager } from '@/api';
import type { GroupInfo, GroupMember } from '../services/GroupService';
import { renderLayout } from './layout';
import { escapeHtml } from '../utils/html';

export function renderInviteCard(threadId: string, savedLink?: string): string {
	return `
		<div id="invite-card" class="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
			<h3 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Invite Link</h3>
			${
				savedLink
					? `
				<div class="p-3 bg-gray-800 rounded-lg mb-3">
					<p class="text-xs text-gray-400 mb-1">Current Link:</p>
					<p class="text-sm text-indigo-400 break-all">${escapeHtml(savedLink)}</p>
				</div>
			`
					: ''
			}
			<div class="flex gap-2">
				<button hx-post="/groups/${threadId}/link/enable" hx-swap="outerHTML" hx-target="#invite-card"
					class="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
					${savedLink ? 'New Link' : 'Enable'}
				</button>
				${
					savedLink
						? `
					<button hx-post="/groups/${threadId}/link/refresh" hx-swap="outerHTML" hx-target="#invite-card"
						class="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
						Refresh
					</button>
				`
						: ''
				}
				<button hx-post="/groups/${threadId}/link/disable" hx-swap="outerHTML" hx-target="#invite-card"
					class="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
					Disable
				</button>
			</div>
		</div>`;
}

export function renderGroupDetail(
	group: GroupInfo,
	members: GroupMember[],
	isAdmin: boolean,
	i18n: I18nManager,
	lang: string,
	savedLink?: string,
): string {
	const roleColors: Record<string, string> = {
		Leader: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
		Deputy: 'bg-red-500/20 text-red-400 border-red-500/30',
		vDeputy: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
		Bot: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
		Member: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
	};

	const memberRows = members
		.map((m) => {
			let role = 'Member';
			if (m.isCreator) role = 'Leader';
			else if (m.isAdmin) role = 'Deputy';
			else if (m.isDeputy) role = 'vDeputy';
			else if (m.isBot) role = 'Bot';

			const badgeClass = roleColors[role] || roleColors['Member'];
			const botTag = m.isBot
				? '<span class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">BOT</span>'
				: '';

			const isMember = role === 'Member';

			const actions = isMember
				? `
				<div class="flex gap-1">
					<button
						hx-post="/groups/${group.threadId}/deputies/${m.userId}/add"
						hx-confirm="Grant vDeputy to ${escapeHtml(m.displayName)}?"
						hx-swap="innerHTML"
						hx-target="#action-result"
						class="px-2 py-1 text-xs bg-indigo-900/50 hover:bg-indigo-900 text-indigo-400 rounded transition-colors"
					>Grant vDeputy</button>
					<button
						hx-post="/groups/${group.threadId}/members/${m.userId}/kick"
						hx-confirm="Kick ${escapeHtml(m.displayName)}?"
						hx-swap="innerHTML"
						hx-target="#action-result"
						class="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
					>Kick</button>
					<button
						hx-post="/groups/${group.threadId}/members/${m.userId}/ban"
						hx-confirm="Ban ${escapeHtml(m.displayName)}?"
						hx-swap="innerHTML"
						hx-target="#action-result"
						class="px-2 py-1 text-xs bg-red-900/50 hover:bg-red-900 text-red-400 rounded transition-colors"
					>Ban</button>
					<button
						hx-get="/groups/${group.threadId}/members/${m.userId}/detail"
						hx-swap="innerHTML"
						hx-target="#member-detail-${m.userId}"
						class="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
					>Details</button>
				</div>`
				: `
				<div class="flex gap-1">
					<button
						hx-get="/groups/${group.threadId}/members/${m.userId}/detail"
						hx-swap="innerHTML"
						hx-target="#member-detail-${m.userId}"
						class="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
					>Details</button>
				</div>`;

			const avatarHtml = m.avatar
				? `<img src="${escapeHtml(m.avatar)}" alt="" class="w-8 h-8 rounded-full object-cover flex-shrink-0">`
				: `<div class="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0">
					${m.isBot ? '🤖' : escapeHtml(m.displayName).charAt(0).toUpperCase()}
				</div>`;

			return `
			<tr class="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
				<td class="px-4 py-3">
					<div class="flex items-center gap-3">
						${avatarHtml}
						<div>
							<div class="flex items-center">
								<span class="text-gray-200 text-sm">${escapeHtml(m.displayName)}</span>
								${botTag}
							</div>
							<span class="text-gray-600 text-xs font-mono">${m.userId}</span>
						</div>
					</div>
				</td>
				<td class="px-4 py-3">
					<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badgeClass}">
						${escapeHtml(role)}
					</span>
				</td>
				<td class="px-4 py-3 text-right">${actions}</td>
			</tr>
			<tr>
				<td colspan="3" class="px-4 py-0">
					<div id="member-detail-${m.userId}" class="pb-2"></div>
				</td>
			</tr>`;
		})
		.join('');

	const content = `
		<div class="mb-6">
			<a href="/groups" class="text-sm text-gray-500 hover:text-gray-300 transition-colors">&larr; Back to groups</a>
			<h1 class="text-2xl font-bold text-white mt-2">${escapeHtml(group.name)}</h1>
			<p class="text-gray-500 text-sm mt-1">${group.memberCount} members</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
			<div class="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
				<h3 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Group Info</h3>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-gray-500">Thread ID</span>
						<span class="text-gray-300 font-mono text-xs">${group.threadId}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-500">Creator</span>
						<span class="text-gray-300 font-mono text-xs">${group.creatorId}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-500">Admins</span>
						<span class="text-gray-300">${group.adminIds.length}</span>
					</div>
				</div>
			</div>

			<div class="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
				<h3 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Change Name</h3>
				<form hx-post="/groups/${group.threadId}/name" hx-swap="innerHTML" hx-target="#name-result" class="flex gap-2">
					<input type="text" name="name" placeholder="New name" required
						class="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
					<button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
						Save
					</button>
				</form>
				<div id="name-result" class="mt-2"></div>
			</div>

			${renderInviteCard(group.threadId, savedLink)}
		</div>

		<div id="action-result" class="mb-4"></div>

		<div class="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
			<div class="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
				<h3 class="text-sm font-medium text-gray-400">Members</h3>
				<span class="text-xs text-gray-600">${members.length} total</span>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-gray-800 text-left">
							<th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
							<th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
							<th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						${memberRows || '<tr><td colspan="3" class="px-4 py-8 text-center text-gray-500">No members found</td></tr>'}
					</tbody>
				</table>
			</div>
		</div>
	`;

	return renderLayout(group.name, content, i18n, lang, isAdmin, 'groups');
}
