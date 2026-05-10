import type { I18nManager } from '@/utils/I18nManager';
import type { PermissionNode } from '../services/BotService';
import { renderLayout } from './layout';

export function renderPermissions(
	nodes: PermissionNode[],
	i18n: I18nManager,
	lang: string,
): string {
	const levelColors: Record<number, string> = {
		0: 'bg-gray-800 text-gray-400 border-gray-700',
		1: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
		2: 'bg-orange-900/50 text-orange-400 border-orange-800',
		3: 'bg-red-900/50 text-red-400 border-red-800',
	};

	const rows = nodes
		.map(
			(n) => `
		<tr class="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
			<td class="px-4 py-3">
				<code class="text-sm text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded">${escapeHtml(n.node)}</code>
			</td>
			<td class="px-4 py-3">
				<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${levelColors[n.level] || levelColors[0]}">
					${n.levelName}
				</span>
			</td>
		</tr>`,
		)
		.join('');

	const content = `
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-white">Permissions</h1>
			<p class="text-gray-500 text-sm mt-1">Manage permission nodes and user access</p>
		</div>

		<div id="perm-result"></div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
			<div class="bg-gray-900 border border-gray-800 rounded-xl p-5">
				<h3 class="text-sm font-medium text-gray-400 mb-4">Grant Permission</h3>
				<form hx-post="/permissions/grant" hx-swap="outerHTML" hx-target="#perm-result" class="space-y-3">
					<input type="text" name="userId" placeholder="User ID" required
						class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
					<input type="text" name="node" placeholder="Permission node (e.g. dashboard.admin)" required
						class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
					<button type="submit" class="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
						Grant
					</button>
				</form>
			</div>

			<div class="bg-gray-900 border border-gray-800 rounded-xl p-5">
				<h3 class="text-sm font-medium text-gray-400 mb-4">Revoke Permission</h3>
				<form hx-post="/permissions/revoke" hx-swap="outerHTML" hx-target="#perm-result" class="space-y-3">
					<input type="text" name="userId" placeholder="User ID" required
						class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
					<input type="text" name="node" placeholder="Permission node" required
						class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
					<button type="submit" class="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
						Revoke
					</button>
				</form>
			</div>

			<div class="bg-gray-900 border border-gray-800 rounded-xl p-5">
				<h3 class="text-sm font-medium text-gray-400 mb-4">Add Virtual Deputy</h3>
				<form hx-post="/permissions/deputy/add" hx-swap="outerHTML" hx-target="#perm-result" class="space-y-3">
					<input type="text" name="threadId" placeholder="Group Thread ID" required
						class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
					<input type="text" name="userId" placeholder="User ID" required
						class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
					<button type="submit" class="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
						Add Deputy
					</button>
				</form>
			</div>

			<div class="bg-gray-900 border border-gray-800 rounded-xl p-5">
				<h3 class="text-sm font-medium text-gray-400 mb-4">Remove Virtual Deputy</h3>
				<form hx-post="/permissions/deputy/remove" hx-swap="outerHTML" hx-target="#perm-result" class="space-y-3">
					<input type="text" name="threadId" placeholder="Group Thread ID" required
						class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
					<input type="text" name="userId" placeholder="User ID" required
						class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
					<button type="submit" class="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
						Remove Deputy
					</button>
				</form>
			</div>
		</div>

		<div class="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
			<div class="px-4 py-3 border-b border-gray-800">
				<h3 class="text-sm font-medium text-gray-400">Permission Nodes (${nodes.length})</h3>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-gray-800 text-left">
							<th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Node</th>
							<th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Required Level</th>
						</tr>
					</thead>
					<tbody>
						${rows || '<tr><td colspan="2" class="px-4 py-8 text-center text-gray-500">No permission nodes</td></tr>'}
					</tbody>
				</table>
			</div>
		</div>
	`;

	return renderLayout('Permissions', content, i18n, lang, true, 'permissions');
}

function escapeHtml(str: string): string {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
