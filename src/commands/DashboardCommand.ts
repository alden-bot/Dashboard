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
		const otp = this.plugin.otpManager.generate(userId);
		const port = this.plugin.config.get('port');

		await this.bot.sendMessage(
			{
				msg: this.t(
					'dashboard.otp.message',
					{ otp, url: `http://localhost:${port}` },
					lang,
				),
			},
			message.threadId,
			message.type,
		);
	}
}
