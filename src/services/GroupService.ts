import path from 'node:path';
import { readJsonFileAsync, Role, writeJsonFileAsync } from '@/api';
import type Main from '../main';

export interface GroupInfo {
	threadId: string;
	name: string;
	memberCount: number;
	memberIds: string[];
	creatorId: string;
	adminIds: string[];
	isTracked: boolean;
}

export interface GroupMember {
	userId: string;
	displayName: string;
	avatar: string;
	role: 'botAdmin' | 'leader' | 'deputy' | 'virtualDeputy' | 'bot' | 'member';
	roleLevel: Role;
	canBeModerated: boolean;
	isCreator: boolean;
	isZaloDeputy: boolean;
	isVirtualDeputy: boolean;
	isBotAdmin: boolean;
	isBot: boolean;
}

interface GroupLinksFile {
	links: Record<string, string>;
}

interface MemberProfile {
	displayName?: string;
	zaloName?: string;
	avatar?: string;
}

/**
 * Service for group management operations.
 * Bridges zca-js API to dashboard data.
 */
export class GroupService {
	private botUserId: string | null = null;
	private readonly linksPath: string;
	private groupLinks = new Map<string, string>();

	constructor(private readonly plugin: Main) {
		this.linksPath = path.join(plugin.dataFolder, 'group-links.json');
	}

	/**
	 * Load group links from disk.
	 */
	public async loadLinks(): Promise<void> {
		const data = await readJsonFileAsync<GroupLinksFile>(this.linksPath);
		if (data?.links) {
			for (const [threadId, link] of Object.entries(data.links)) {
				if (typeof link === 'string') {
					this.groupLinks.set(threadId, link);
				}
			}
		}
	}

	/**
	 * Save group links to disk.
	 */
	private async saveLinks(): Promise<void> {
		const links: Record<string, string> = {};
		for (const [threadId, link] of this.groupLinks) {
			links[threadId] = link;
		}
		await writeJsonFileAsync(this.linksPath, { links });
	}

	/**
	 * Get the bot's own user ID (cached after first fetch).
	 */
	public async getBotUserId(): Promise<string> {
		if (this.botUserId) return this.botUserId;

		try {
			const { profile } = await this.plugin.bot.api.fetchAccountInfo();
			this.botUserId = profile.userId ?? '';
			return this.botUserId;
		} catch (error) {
			this.plugin.logger.error('Failed to get bot own ID', error);
			return '';
		}
	}

	/**
	 * Map raw API group data to our GroupInfo shape.
	 */
	private mapGroupInfo(
		threadId: string,
		group: { name?: string; memVerList?: string[]; creatorId?: string; adminIds?: string[] },
	): GroupInfo {
		const memberIds =
			group.memVerList
				?.map((uid) => uid.split('_')[0])
				.filter((uid): uid is string => typeof uid === 'string' && uid.length > 0) ?? [];

		return {
			threadId,
			name: group.name || 'Unknown',
			memberCount: group.memVerList?.length || 0,
			memberIds,
			creatorId: group.creatorId || '',
			adminIds: group.adminIds || [],
			isTracked: true,
		};
	}

	/**
	 * Get group info for a single group.
	 */
	public async getGroupInfo(threadId: string): Promise<GroupInfo | undefined> {
		try {
			const info = await this.plugin.bot.api.getGroupInfo(threadId);
			const group = info.gridInfoMap[threadId];
			if (!group) return undefined;
			return this.mapGroupInfo(threadId, group);
		} catch (error) {
			this.plugin.logger.error(`Failed to get group info for ${threadId}`, error);
			return undefined;
		}
	}

	/**
	 * Get info for multiple groups (batch).
	 */
	public async getGroupsInfo(threadIds: string[]): Promise<GroupInfo[]> {
		if (threadIds.length === 0) return [];

		try {
			const info = await this.plugin.bot.api.getGroupInfo(threadIds);
			const groups: GroupInfo[] = [];

			for (const threadId of threadIds) {
				const group = info.gridInfoMap[threadId];
				if (group) {
					groups.push(this.mapGroupInfo(threadId, group));
				}
			}

			return groups;
		} catch (error) {
			this.plugin.logger.error('Failed to get groups info', error);
			return [];
		}
	}

	/**
	 * Get members of a group with user info.
	 */
	public async getGroupMembers(threadId: string, groupInfo?: GroupInfo): Promise<GroupMember[]> {
		try {
			let uids: string[];
			let creatorId: string;
			let adminIds: string[];

			if (groupInfo) {
				uids = groupInfo.memberIds;
				creatorId = groupInfo.creatorId;
				adminIds = groupInfo.adminIds;
			} else {
				const info = await this.plugin.bot.api.getGroupInfo(threadId);
				const group = info.gridInfoMap[threadId];
				if (!group?.memVerList) return [];

				uids = group.memVerList
					.map((uid) => uid.split('_')[0])
					.filter((uid): uid is string => typeof uid === 'string' && uid.length > 0);
				creatorId = group.creatorId || '';
				adminIds = group.adminIds || [];
			}

			if (uids.length === 0) return [];

			const botId = await this.getBotUserId();

			// Use getGroupMembersInfo for accurate member data
			let profiles: Record<string, MemberProfile> = {};
			try {
				const membersInfo = await this.plugin.bot.api.getGroupMembersInfo(uids);
				profiles = membersInfo.profiles as Record<string, MemberProfile>;
			} catch (error) {
				this.plugin.logger.warn(
					'Failed to fetch group members info, using fallback names',
					error,
				);
			}

			return uids.map((uid) => {
				const profile = profiles[uid];
				const isBot = uid === botId;
				const isBotAdmin = this.plugin.bot.config.ADMIN_IDS.includes(uid);
				const isCreator = creatorId === uid;
				const isZaloDeputy = adminIds.includes(uid);
				const isVirtualDeputy = this.plugin.bot.permissionManager.isVirtualDeputy(
					threadId,
					uid,
				);
				const role = getMemberRole({
					isBot,
					isBotAdmin,
					isCreator,
					isZaloDeputy,
					isVirtualDeputy,
				});

				return {
					userId: uid,
					displayName:
						profile?.displayName || profile?.zaloName || `User ${uid.slice(-6)}`,
					avatar: profile?.avatar || '',
					role,
					roleLevel: getMemberRoleLevel(role),
					canBeModerated: role === 'member',
					isCreator,
					isZaloDeputy,
					isVirtualDeputy,
					isBotAdmin,
					isBot,
				};
			});
		} catch (error) {
			this.plugin.logger.error(`Failed to get group members for ${threadId}`, error);
			return [];
		}
	}

	public async getGroupMember(
		threadId: string,
		userId: string,
		groupInfo?: GroupInfo,
	): Promise<GroupMember | undefined> {
		const members = await this.getGroupMembers(threadId, groupInfo);
		return members.find((member) => member.userId === userId);
	}

	/**
	 * Kick a member from a group.
	 */
	public async kickMember(threadId: string, userId: string): Promise<boolean> {
		try {
			await this.plugin.bot.api.removeUserFromGroup(userId, threadId);
			return true;
		} catch (error) {
			this.plugin.logger.error(`Failed to kick ${userId} from ${threadId}`, error);
			return false;
		}
	}

	/**
	 * Ban a member from a group.
	 */
	public async banMember(threadId: string, userId: string): Promise<boolean> {
		try {
			await this.plugin.bot.api.addGroupBlockedMember(userId, threadId);
			return true;
		} catch (error) {
			this.plugin.logger.error(`Failed to ban ${userId} from ${threadId}`, error);
			return false;
		}
	}

	/**
	 * Unban a member from a group.
	 */
	public async unbanMember(threadId: string, userId: string): Promise<boolean> {
		try {
			await this.plugin.bot.api.removeGroupBlockedMember(userId, threadId);
			return true;
		} catch (error) {
			this.plugin.logger.error(`Failed to unban ${userId} from ${threadId}`, error);
			return false;
		}
	}

	/**
	 * Change group name.
	 */
	public async changeName(threadId: string, name: string): Promise<boolean> {
		try {
			await this.plugin.bot.api.changeGroupName(name, threadId);
			return true;
		} catch (error) {
			this.plugin.logger.error(`Failed to change name for ${threadId}`, error);
			return false;
		}
	}

	/**
	 * Get saved invite link for a group.
	 */
	public getSavedLink(threadId: string): string | undefined {
		return this.groupLinks.get(threadId);
	}

	/**
	 * Enable group invite link and save it.
	 */
	public async enableLink(threadId: string): Promise<string | undefined> {
		try {
			const result = await this.plugin.bot.api.enableGroupLink(threadId);
			if (result?.link) {
				this.groupLinks.set(threadId, result.link);
				await this.saveLinks();
			}
			return result?.link;
		} catch (error) {
			this.plugin.logger.error(`Failed to enable link for ${threadId}`, error);
			return undefined;
		}
	}

	/**
	 * Disable group invite link.
	 */
	public async disableLink(threadId: string): Promise<boolean> {
		try {
			await this.plugin.bot.api.disableGroupLink(threadId);
			this.groupLinks.delete(threadId);
			await this.saveLinks();
			return true;
		} catch (error) {
			this.plugin.logger.error(`Failed to disable link for ${threadId}`, error);
			return false;
		}
	}
}

function getMemberRole(flags: {
	isBot: boolean;
	isBotAdmin: boolean;
	isCreator: boolean;
	isZaloDeputy: boolean;
	isVirtualDeputy: boolean;
}): GroupMember['role'] {
	if (flags.isBot) return 'bot';
	if (flags.isBotAdmin) return 'botAdmin';
	if (flags.isCreator) return 'leader';
	if (flags.isZaloDeputy) return 'deputy';
	if (flags.isVirtualDeputy) return 'virtualDeputy';
	return 'member';
}

function getMemberRoleLevel(role: GroupMember['role']): Role {
	switch (role) {
		case 'botAdmin':
			return Role.BotAdmin;
		case 'leader':
			return Role.Leader;
		case 'deputy':
		case 'virtualDeputy':
			return Role.Deputy;
		case 'bot':
		case 'member':
			return Role.Member;
	}
}
