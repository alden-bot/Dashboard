import { Hono } from 'hono';
import type { Context } from 'hono';
import type Main from '../main';
import { renderLogin } from '../views/login';
import { Role } from '@/api';
import { clearCookie, setCookie } from '../auth/cookies';
import { shouldUseSecureCookie } from '../auth/middleware';
import { toast } from '../utils/html';

export function createAuthRoutes(plugin: Main): Hono {
	const app = new Hono();

	app.get('/login', (c) => {
		return c.html(renderLogin(plugin.i18n!, plugin.bot.config.LANGUAGE));
	});

	app.post('/api/login', async (c) => {
		const ip = getClientIp(plugin, c);
		const retryAfter = plugin.loginRateLimiter.getRetryAfterSeconds(ip);
		if (retryAfter !== null) {
			c.header('Retry-After', String(retryAfter));
			return c.html(
				toast(
					'error',
					`Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes.`,
				),
				429,
			);
		}

		const body = await c.req.parseBody();
		const otp = body['otp'] as string;

		if (!otp) {
			plugin.loginRateLimiter.recordFailure(ip);
			return c.html(toast('error', 'OTP is required'), 400);
		}

		const userId = plugin.otpManager.verify(otp);
		if (!userId) {
			plugin.loginRateLimiter.recordFailure(ip);
			return c.html(toast('error', 'Invalid or expired OTP'), 401);
		}

		plugin.loginRateLimiter.clear(ip);

		const isAdmin = plugin.bot.config.ADMIN_IDS.includes(userId);
		const role = isAdmin ? Role.BotAdmin : Role.Member;
		const groupIds = isAdmin
			? plugin.groupTracker.getAllGroupIds()
			: await plugin.groupTracker.getManageableGroupsForUser(userId);

		if (!isAdmin && groupIds.length === 0) {
			return c.html(toast('error', 'This user does not manage any group.'), 403);
		}

		await plugin.sessionManager.revokeAllForUser(userId);

		const { token, csrfToken } = await plugin.sessionManager.create(userId, role, groupIds);

		const maxAge = Math.floor(plugin.config.get('sessionTTL') / 1000);
		const secure = shouldUseSecureCookie(c, plugin);
		setCookie(c, 'dashboard_session', token, {
			httpOnly: true,
			maxAge,
			secure,
			sameSite: 'Lax',
		});
		setCookie(c, 'csrf_token', csrfToken, {
			maxAge,
			secure,
			sameSite: 'Strict',
		});

		c.header('HX-Redirect', '/dashboard');
		if (c.req.header('X-Requested-With') === 'alden-dashboard') {
			return c.body(null);
		}
		return c.redirect('/dashboard');
	});

	app.post('/api/logout', async (c) => {
		const session = c.get('session');
		if (session) {
			await plugin.sessionManager.revoke(session.token);
		}
		const secure = shouldUseSecureCookie(c, plugin);
		clearCookie(c, 'dashboard_session', { httpOnly: true, secure, sameSite: 'Lax' });
		clearCookie(c, 'csrf_token', { secure, sameSite: 'Strict' });
		c.header('HX-Redirect', '/login');
		return c.body(null);
	});

	return app;
}

function getClientIp(plugin: Main, c: Context): string {
	if (plugin.config.get('trustProxy')) {
		const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
		if (forwarded) return forwarded;
	}

	return c.req.header('x-real-ip') ?? 'local';
}
