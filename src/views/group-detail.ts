import type { I18nManager } from '@/api';
import { Role } from '@/api';
import type { GroupInfo, GroupMember } from '../services/GroupService';
import { renderLayout } from './layout';
import { escapeAttr, escapeHtml, escapeUrl } from '../utils/html';

export interface GroupDetailAccess {
	isBotAdmin: boolean;
	actorRole: Role;
	canManageSettings: boolean;
	canManageVirtualDeputies: boolean;
}

export function renderInviteCard(
	threadId: string,
	savedLink?: string,
	canManageSettings = true,
): string {
	const controls = canManageSettings
		? `
			<div class="action-row">
				<button hx-post="/groups/${escapeAttr(threadId)}/link/enable" hx-swap="outerHTML" hx-target="#invite-card" class="btn btn-secondary">
					${savedLink ? 'New Link' : 'Enable'}
				</button>
				${
					savedLink
						? `
					<button hx-post="/groups/${escapeAttr(threadId)}/link/refresh" hx-swap="outerHTML" hx-target="#invite-card" class="btn btn-secondary">
						Refresh
					</button>`
						: ''
				}
				<button hx-post="/groups/${escapeAttr(threadId)}/link/disable" hx-swap="outerHTML" hx-target="#invite-card" class="btn btn-secondary">
					Disable
				</button>
			</div>`
		: `<p class="muted">You can view this group but cannot change invite links.</p>`;

	return `
		<div id="invite-card" class="panel">
			<h3>Invite Link</h3>
			${
				savedLink
					? `
				<div class="code-block">
					<p class="muted">Current Link</p>
					<p class="break-all">${escapeHtml(savedLink)}</p>
				</div>`
					: `<p class="muted">No saved invite link.</p>`
			}
			${controls}
		</div>`;
}

export function renderGroupDetail(
	group: GroupInfo,
	members: GroupMember[],
	access: GroupDetailAccess,
	i18n: I18nManager,
	lang: string,
	savedLink?: string,
): string {
	const memberRows = members.map((member) => renderMemberRows(group, member, access)).join('');
	const actorRole = getRoleLabelFromLevel(access.actorRole);

	const content = `
		<div class="page-heading">
			<a href="/groups" class="muted-link">&larr; Back to groups</a>
			<h1>${escapeHtml(group.name)}</h1>
			<p>${group.memberCount} members · Your access: ${escapeHtml(actorRole)}</p>
		</div>

		<div class="grid grid-3">
			<div class="panel">
				<h3>Group Info</h3>
				<div class="kv"><span>Thread ID</span><code>${escapeHtml(group.threadId)}</code></div>
				<div class="kv"><span>Creator</span><code>${escapeHtml(group.creatorId)}</code></div>
				<div class="kv"><span>Deputies</span><strong>${group.adminIds.length}</strong></div>
			</div>

			<div class="panel">
				<h3>Change Name</h3>
				${
					access.canManageSettings
						? `
					<form hx-post="/groups/${escapeAttr(group.threadId)}/name" hx-swap="innerHTML" hx-target="#name-result" class="inline-form">
						<input type="text" name="name" placeholder="New name" required>
						<button type="submit" class="btn btn-primary">Save</button>
					</form>
					<div id="name-result"></div>`
						: `<p class="muted">You cannot change this group.</p>`
				}
			</div>

			${renderInviteCard(group.threadId, savedLink, access.canManageSettings)}
		</div>

		<div id="action-result"></div>

		<div class="panel">
			<div class="panel-header">
				<div>
					<h3>Members</h3>
					<p>${members.length} total</p>
				</div>
				<input id="member-filter" type="search" placeholder="Search members" data-filter-table="#members-table">
			</div>
			<div class="table-wrap">
				<table id="members-table">
					<thead>
						<tr>
							<th>User</th>
							<th>Role</th>
							<th class="align-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						${memberRows || '<tr><td colspan="3" class="empty">No members found</td></tr>'}
					</tbody>
				</table>
			</div>
		</div>
	`;

	return renderLayout(group.name, content, i18n, lang, access.isBotAdmin, 'groups');
}

function renderMemberRows(
	group: GroupInfo,
	member: GroupMember,
	access: GroupDetailAccess,
): string {
	const role = getRoleLabel(member);
	const actions = renderMemberActions(group.threadId, member, access);
	const avatar = renderAvatar(member);
	const searchText = `${member.displayName} ${member.userId} ${role}`.toLowerCase();

	return `
		<tr data-filter-text="${escapeAttr(searchText)}">
			<td>
				<div class="identity">
					${avatar}
					<div>
						<div class="identity-name">${escapeHtml(member.displayName)}</div>
						<code>${escapeHtml(member.userId)}</code>
					</div>
				</div>
			</td>
			<td><span class="badge badge-${escapeAttr(member.role)}">${escapeHtml(role)}</span></td>
			<td class="align-right">${actions}</td>
		</tr>
		<tr data-filter-text="${escapeAttr(searchText)}">
			<td colspan="3"><div id="member-detail-${escapeAttr(member.userId)}"></div></td>
		</tr>`;
}

function renderMemberActions(
	threadId: string,
	member: GroupMember,
	access: GroupDetailAccess,
): string {
	const detailsButton = `
		<button
			hx-get="/groups/${escapeAttr(threadId)}/members/${escapeAttr(member.userId)}/detail"
			hx-swap="innerHTML"
			hx-target="#member-detail-${escapeAttr(member.userId)}"
			class="btn btn-secondary btn-small"
		>Details</button>`;

	const actionButtons: string[] = [detailsButton];

	if (member.role === 'member' && access.canManageVirtualDeputies) {
		actionButtons.unshift(`
			<button
				hx-post="/groups/${escapeAttr(threadId)}/deputies/${escapeAttr(member.userId)}/add"
				hx-confirm="Grant vDeputy to ${escapeAttr(member.displayName)}?"
				hx-swap="innerHTML"
				hx-target="#action-result"
				class="btn btn-primary btn-small"
			>Grant vDeputy</button>`);
	}

	if (member.role === 'virtualDeputy' && access.canManageVirtualDeputies) {
		actionButtons.unshift(`
			<button
				hx-post="/groups/${escapeAttr(threadId)}/deputies/${escapeAttr(member.userId)}/remove"
				hx-confirm="Remove vDeputy from ${escapeAttr(member.displayName)}?"
				hx-swap="innerHTML"
				hx-target="#action-result"
				class="btn btn-warning btn-small"
			>Remove vDeputy</button>`);
	}

	if (member.canBeModerated && access.canManageSettings) {
		actionButtons.splice(
			1,
			0,
			`
			<button
				hx-post="/groups/${escapeAttr(threadId)}/members/${escapeAttr(member.userId)}/kick"
				hx-confirm="Kick ${escapeAttr(member.displayName)}?"
				hx-swap="innerHTML"
				hx-target="#action-result"
				class="btn btn-secondary btn-small"
			>Kick</button>
			<button
				hx-post="/groups/${escapeAttr(threadId)}/members/${escapeAttr(member.userId)}/ban"
				hx-confirm="Ban ${escapeAttr(member.displayName)}?"
				hx-swap="innerHTML"
				hx-target="#action-result"
				class="btn btn-danger btn-small"
			>Ban</button>`,
		);
	}

	return `<div class="action-row align-end">${actionButtons.join('')}</div>`;
}

function renderAvatar(member: GroupMember): string {
	if (member.avatar) {
		return `<img src="${escapeUrl(member.avatar)}" alt="" class="avatar">`;
	}

	const label = member.isBot ? 'B' : member.displayName.charAt(0).toUpperCase();
	return `<div class="avatar avatar-fallback">${escapeHtml(label)}</div>`;
}

function getRoleLabel(member: GroupMember): string {
	switch (member.role) {
		case 'botAdmin':
			return 'BotAdmin';
		case 'leader':
			return 'Leader';
		case 'deputy':
			return 'Deputy';
		case 'virtualDeputy':
			return 'vDeputy';
		case 'bot':
			return 'Bot';
		case 'member':
			return 'Member';
	}
}

function getRoleLabelFromLevel(role: Role): string {
	return Role[role] ?? 'Member';
}
