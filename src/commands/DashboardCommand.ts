import { CommandBase, type CommandContext } from '@/api';
import { ThreadType } from 'zca-js';
import type Main from '../main';

export class DashboardCommand extends CommandBase {
	public constructor(private readonly plugin: Main) {
		super({
			name: 'dashboard',
			description: 'dashboard.desc',
			aliases: ['dash'],
			cooldown: 30,
			usage: 'dashboard.usage',
			permission: 'dashboard.access',
		});
	}

	public async execute({ message, lang }: CommandContext): Promise<void> {
		// Only work in DM
		if (message.type !== ThreadType.User) {
			await this.bot.sendMessage(
				{ msg: this.t('dashboard.otp.dm_only', {}, lang) },
				message.threadId,
				message.type,
			);
			return;
		}

		const userId = message.data.uidFrom;
		const isAdmin = this.plugin.bot.config.ADMIN_IDS.includes(userId);
		const groupIds = isAdmin
			? this.plugin.groupTracker.getAllGroupIds()
			: await this.plugin.groupTracker.getManageableGroupsForUser(userId);

		if (!isAdmin && groupIds.length === 0) {
			await this.bot.sendMessage(
				{ msg: this.t('dashboard.otp.no_access', {}, lang) },
				message.threadId,
				message.type,
			);
			return;
		}

		const otp = this.plugin.otpManager.generate(userId);
		const url = getDashboardUrl(this.plugin);

		await this.bot.sendMessage(
			{
				msg: this.t('dashboard.otp.message', { otp, url }, lang),
			},
			message.threadId,
			message.type,
		);
	}
}

function getDashboardUrl(plugin: Main): string {
	const publicUrl = plugin.config.get('publicUrl').trim();
	if (publicUrl) return publicUrl.replace(/\/+$/, '');

	const host = plugin.config.get('host');
	const displayHost = host === '0.0.0.0' || host === '::' ? 'localhost' : host;
	return `http://${displayHost}:${plugin.config.get('port')}`;
}
