import type { I18nManager } from '@/utils/I18nManager';
import type { GroupInfo } from '../services/GroupService';
import { renderLayout } from './layout';

export function renderGroups(
	groups: GroupInfo[],
	isAdmin: boolean,
	i18n: I18nManager,
	lang: string,
): string {
	const rows = groups
		.map(
			(g) => `
		<tr class="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
			<td class="px-4 py-3">
				<a href="/groups/${g.threadId}" class="text-indigo-400 hover:text-indigo-300 font-medium">${escapeHtml(g.name)}</a>
			</td>
			<td class="px-4 py-3 text-gray-400">${g.memberCount}</td>
			<td class="px-4 py-3 text-gray-500 font-mono text-xs">${g.threadId}</td>
			<td class="px-4 py-3">
				<a href="/groups/${g.threadId}" class="text-sm text-gray-400 hover:text-white transition-colors">View &rarr;</a>
			</td>
		</tr>`,
		)
		.join('');

	const content = `
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-white">Groups</h1>
			<p class="text-gray-500 text-sm mt-1">${groups.length} group${groups.length !== 1 ? 's' : ''} tracked</p>
		</div>

		<div class="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-gray-800 text-left">
							<th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
							<th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Members</th>
							<th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Thread ID</th>
							<th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
						</tr>
					</thead>
					<tbody>
						${rows || '<tr><td colspan="4" class="px-4 py-8 text-center text-gray-500">No groups found</td></tr>'}
					</tbody>
				</table>
			</div>
		</div>
	`;

	return renderLayout('Groups', content, i18n, lang, isAdmin, 'groups');
}

function escapeHtml(str: string): string {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
