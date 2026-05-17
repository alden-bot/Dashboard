import { readJsonFileAsync, writeJsonFileAsync } from '@/api';
import type Main from '../main';

interface GroupEntry {
	firstSeen: number;
	lastSeen: number;
}

interface GroupFile {
	groups: Record<string, GroupEntry>;
}

/**
 * Tracks all groups the bot is in.
 * Uses getAllGroups() API to discover groups on startup and periodically.
 */
export class GroupTracker {
	private readonly groups = new Map<string, GroupEntry>();
	private refreshTimer?: NodeJS.Timeout;

	public constructor(
		private readonly plugin: Main,
		private readonly dataPath: string,
	) {}

	public async load(): Promise<void> {
		// Load saved groups from disk
		const data = await readJsonFileAsync<GroupFile>(this.dataPath);
		if (data?.groups) {
			for (const [threadId, entry] of Object.entries(data.groups)) {
				this.groups.set(threadId, entry);
			}
		}

		// Fetch all groups from API
		await this.refreshGroups();

		// Refresh every 10 minutes
		this.refreshTimer = setInterval(
			() => {
				void this.refreshGroups();
			},
			10 * 60 * 1000,
		);
	}

	public async save(): Promise<void> {
		const groups: Record<string, GroupEntry> = {};
		for (const [threadId, entry] of this.groups) {
			groups[threadId] = entry;
		}
		await writeJsonFileAsync(this.dataPath, { groups });
	}

	public stop(): void {
		if (this.refreshTimer) {
			clearInterval(this.refreshTimer);
			this.refreshTimer = undefined;
		}
	}

	/**
	 * Fetch all groups from Zalo API and update tracked groups.
	 */
	public async refreshGroups(): Promise<void> {
		try {
			const response = await this.plugin.bot.api.getAllGroups();
			const groupIds = Object.keys(response.gridVerMap || {});
			const now = Date.now();
			let newCount = 0;

			for (const threadId of groupIds) {
				if (!this.groups.has(threadId)) {
					this.groups.set(threadId, { firstSeen: now, lastSeen: now });
					newCount++;
				} else {
					const entry = this.groups.get(threadId)!;
					entry.lastSeen = now;
				}
			}

			if (newCount > 0) {
				this.plugin.logger.info(`GroupTracker: Discovered ${newCount} new groups`);
				await this.save();
			} else {
				this.plugin.logger.debug(`GroupTracker: Refreshed ${groupIds.length} groups`);
			}
		} catch (error) {
			this.plugin.logger.error('GroupTracker: Failed to refresh groups', error);
		}
	}

	/**
	 * Get all tracked group IDs.
	 */
	public getAllGroupIds(): string[] {
		return Array.from(this.groups.keys());
	}

	/**
	 * Get group entry metadata.
	 */
	public getGroupEntry(threadId: string): GroupEntry | undefined {
		return this.groups.get(threadId);
	}

	/**
	 * Check if a user is the leader (creator) or admin of a group.
	 */
	public async isUserGroupLeader(userId: string, threadId: string): Promise<boolean> {
		try {
			const info = await this.plugin.bot.api.getGroupInfo(threadId);
			const group = info.gridInfoMap[threadId];
			if (!group) return false;

			if (group.creatorId === userId) return true;
			if (group.adminIds?.includes(userId)) return true;

			return false;
		} catch {
			return false;
		}
	}

	/**
	 * Get group IDs that a user manages (is creator or admin of).
	 */
	public async getGroupsForUser(userId: string): Promise<string[]> {
		const managedGroups: string[] = [];
		const threadIds = Array.from(this.groups.keys());
		if (threadIds.length === 0) return managedGroups;

		try {
			const info = await this.plugin.bot.api.getGroupInfo(threadIds);

			for (const threadId of threadIds) {
				const group = info.gridInfoMap[threadId];
				if (group) {
					if (group.creatorId === userId || group.adminIds?.includes(userId)) {
						managedGroups.push(threadId);
					}
				}
			}
		} catch (error) {
			this.plugin.logger.error('GroupTracker: Failed to get group info for user', error);
		}

		return managedGroups;
	}
}
