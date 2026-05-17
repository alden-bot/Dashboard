import os from 'node:os';
import path from 'node:path';
import type Main from '../main';
import { formatUptime, Role } from '@/api';

export interface PluginInfo {
	name: string;
	version: string;
	description: string;
	author: string;
	enabled: boolean;
}

export interface PermissionNode {
	node: string;
	level: Role;
	levelName: string;
}

export interface UserPermission {
	userId: string;
	permissions: string[];
}

export interface BotStatus {
	version: string;
	uptime: number;
	uptimeFormatted: string;
	memory: {
		rss: number;
		heapTotal: number;
		heapUsed: number;
	};
	os: {
		type: string;
		release: string;
		arch: string;
		freeMem: number;
		totalMem: number;
	};
	node: string;
	cpu: string;
	pluginCount: number;
	groupCount: number;
}

export interface BotConfigData {
	prefix: string;
	adminIds: string[];
	language: string;
	replyUnknownCommand: boolean;
	version: string;
}

/**
 * Service for bot management operations.
 * Bridges AldenBot managers to dashboard data.
 */
export class BotService {
	constructor(private readonly plugin: Main) {}

	/**
	 * Get all loaded plugins info.
	 */
	public getPlugins(): PluginInfo[] {
		const plugins = this.plugin.bot.pluginManager.getPlugins();
		const result: PluginInfo[] = [];

		for (const [name, plugin] of plugins) {
			result.push({
				name,
				version: plugin.description.version,
				description: plugin.description.description,
				author: plugin.description.author,
				enabled: this.plugin.bot.pluginManager.isPluginEnabled(name),
			});
		}

		return result;
	}

	/**
	 * Reload all plugins.
	 */
	public async reloadAll(): Promise<boolean> {
		try {
			const pm = this.plugin.bot.pluginManager;
			await pm.unloadAll();
			await pm.loadAll(path.dirname(this.plugin.pluginPath));
			await pm.enableAll();
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Get all permission nodes with their levels.
	 */
	public getPermissionNodes(): PermissionNode[] {
		const permissions = this.plugin.bot.permissionManager.getAllPermissions();

		return permissions.map((permission: string) => ({
			node: permission,
			level: this.plugin.bot.permissionManager.getPermissionRole(permission),
			levelName:
				Role[this.plugin.bot.permissionManager.getPermissionRole(permission)] ?? 'Unknown',
		}));
	}

	/**
	 * Grant a permission to a user.
	 */
	public async grantPermission(userId: string, permission: string): Promise<boolean> {
		return await this.plugin.bot.permissionManager.grant(userId, permission);
	}

	/**
	 * Revoke a permission from a user.
	 */
	public async revokePermission(userId: string, permission: string): Promise<boolean> {
		return await this.plugin.bot.permissionManager.revoke(userId, permission);
	}

	/**
	 * Get permissions for a specific user.
	 */
	public getUserPermissions(userId: string): string[] {
		return this.plugin.bot.permissionManager.getUserPermissions(userId);
	}

	/**
	 * Add a virtual deputy to a group.
	 */
	public async addVirtualDeputy(threadId: string, userId: string): Promise<boolean> {
		return await this.plugin.bot.permissionManager.addVirtualDeputy(threadId, userId);
	}

	/**
	 * Remove a virtual deputy from a group.
	 */
	public async removeVirtualDeputy(threadId: string, userId: string): Promise<boolean> {
		return await this.plugin.bot.permissionManager.removeVirtualDeputy(threadId, userId);
	}

	/**
	 * Get bot status information.
	 */
	public getStatus(): BotStatus {
		const mem = process.memoryUsage();
		const uptimeSec = process.uptime();

		return {
			version: this.plugin.bot.config.version,
			uptime: uptimeSec,
			uptimeFormatted: formatUptime(uptimeSec),
			memory: {
				rss: Math.round(mem.rss / 1024 / 1024),
				heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
				heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
			},
			os: {
				type: os.type(),
				release: os.release(),
				arch: os.arch(),
				freeMem: Math.round(os.freemem() / 1024 / 1024),
				totalMem: Math.round(os.totalmem() / 1024 / 1024),
			},
			node: process.version,
			cpu: os.cpus()[0]?.model || 'Unknown',
			pluginCount: this.plugin.bot.pluginManager.getPlugins().size,
			groupCount: this.plugin.groupTracker.getAllGroupIds().length,
		};
	}

	/**
	 * Get current bot config.
	 */
	public getConfig(): BotConfigData {
		return {
			prefix: this.plugin.bot.config.PREFIX,
			adminIds: [...this.plugin.bot.config.ADMIN_IDS],
			language: this.plugin.bot.config.LANGUAGE,
			replyUnknownCommand: this.plugin.bot.config.REPLY_UNKNOWN_COMMAND,
			version: this.plugin.bot.config.version,
		};
	}
}
