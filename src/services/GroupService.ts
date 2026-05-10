import path from 'node:path';
import { readJsonFileAsync, writeJsonFileAsync } from '@/utils/file';
import type { GroupMemberProfile } from 'zca-js';
import type Main from '../main';

export interface GroupInfo {
	threadId: string;
	name: string;
	memberCount: number;
	creatorId: string;
	adminIds: string[];
	isTracked: boolean;
}

export interface GroupMember {
	userId: string;
	displayName: string;
	avatar: string;
	isCreator: boolean;
	isAdmin: boolean;
	isDeputy: boolean;
	isBot: boolean;
}

interface GroupLinksFile {
	links: Record<string, string>;
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
				this.groupLinks.set(threadId, link);
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
			this.botUserId = profile.userId;
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
		return {
			threadId,
			name: group.name || 'Unknown',
			memberCount: group.memVerList?.length || 0,
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
	public async getGroupMembers(threadId: string): Promise<GroupMember[]> {
		try {
			const info = await this.plugin.bot.api.getGroupInfo(threadId);
			const group = info.gridInfoMap[threadId];
			if (!group?.memVerList) return [];

			// memVerList return an array of uids + "_0" at the ends
			// so we need to map its
			const uids = group.memVerList
				.map((uid) => uid.split('_')[0])
				.filter((uid): uid is string => uid !== undefined);

			const botId = await this.getBotUserId();

			// Use getGroupMembersInfo for accurate member data
			let profiles: Record<string, GroupMemberProfile> = {};
			try {
				const membersInfo = await this.plugin.bot.api.getGroupMembersInfo(uids);
				profiles = membersInfo.profiles;
			} catch (error) {
				this.plugin.logger.warn(
					'Failed to fetch group members info, using fallback names',
					error,
				);
			}

			return uids.map((uid) => {
				const profile = profiles[uid];
				const isBot = uid === botId;

				return {
					userId: uid,
					displayName:
						profile?.displayName || profile?.zaloName || `User ${uid.slice(-6)}`,
					avatar: profile?.avatar || '',
					isCreator: group.creatorId === uid,
					isAdmin: group.adminIds?.includes(uid) || false,
					isDeputy: false,
					isBot,
				};
			});
		} catch (error) {
			this.plugin.logger.error(`Failed to get group members for ${threadId}`, error);
			return [];
		}
	}

	/**
	 * Kick a member from a group.
	 */
	public async kickMember(threadId: string, userId: string): Promise<boolean> {
		try {
			await this.plugin.bot.api.removeUserFromGroup(userId, threadId);
			return true;
		} catch {
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
		} catch {
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
		} catch {
			return false;
		}
	}

	/**
	 * Add a deputy to a group.
	 */
	public async addDeputy(threadId: string, userId: string): Promise<boolean> {
		try {
			await this.plugin.bot.api.addGroupDeputy(userId, threadId);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Remove a deputy from a group.
	 */
	public async removeDeputy(threadId: string, userId: string): Promise<boolean> {
		try {
			await this.plugin.bot.api.removeGroupDeputy(userId, threadId);
			return true;
		} catch {
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
		} catch {
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
		} catch {
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
		} catch {
			return false;
		}
	}
}
