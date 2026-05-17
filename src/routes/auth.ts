import { Hono } from 'hono';
import type Main from '../main';
import { renderLogin } from '../views/login';
import { Role } from '@/api';

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;

export function createAuthRoutes(plugin: Main): Hono {
	const app = new Hono();

	app.get('/login', (c) => {
		return c.html(renderLogin(plugin.i18n!, plugin.bot.config.LANGUAGE));
	});

	app.post('/api/login', async (c) => {
		const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown';
		const now = Date.now();
		const entry = loginAttempts.get(ip);

		if (entry) {
			if (now > entry.resetAt) {
				loginAttempts.delete(ip);
			} else if (entry.count >= MAX_ATTEMPTS) {
				const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
				c.header('Retry-After', String(retryAfter));
				return c.html(
					`<div class="p-3 rounded-lg text-sm toast-error">Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes.</div>`,
					429,
				);
			}
		}

		const body = await c.req.parseBody();
		const otp = body['otp'] as string;

		if (!otp) {
			return c.html(`<div class="p-3 rounded-lg text-sm toast-error">OTP is required</div>`);
		}

		const current = loginAttempts.get(ip);
		if (current && now <= current.resetAt) {
			current.count++;
		} else {
			loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
		}

		const userId = plugin.otpManager.verify(otp);
		if (!userId) {
			return c.html(
				`<div class="p-3 rounded-lg text-sm toast-error">Invalid or expired OTP</div>`,
			);
		}

		loginAttempts.delete(ip);

		// Determine role
		const isAdmin = plugin.bot.config.ADMIN_IDS.includes(userId);
		const role = isAdmin ? Role.BotAdmin : Role.Member;

		// Get groups user manages
		const groupIds = isAdmin
			? plugin.groupTracker.getAllGroupIds()
			: await plugin.groupTracker.getGroupsForUser(userId);

		// Revoke any existing sessions for this user before creating new one
		await plugin.sessionManager.revokeAllForUser(userId);

		const { token, csrfToken } = await plugin.sessionManager.create(userId, role, groupIds);

		// Set session cookie with Max-Age for persistence across browser restarts
		const maxAge = Math.floor(plugin.config.get('sessionTTL') / 1000);
		c.header(
			'Set-Cookie',
			`dashboard_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`,
		);
		// Set CSRF cookie (not HttpOnly so JS can read it for HTMX headers)
		c.header(
			'Set-Cookie',
			`csrf_token=${csrfToken}; Path=/; SameSite=Strict; Max-Age=${maxAge}`,
			{ append: true },
		);
		return c.redirect('/dashboard');
	});

	app.post('/api/logout', async (c) => {
		const session = c.get('session');
		if (session) {
			await plugin.sessionManager.revoke(session.token);
		}
		c.header('Set-Cookie', 'dashboard_session=; Path=/; HttpOnly; Max-Age=0');
		c.header('Set-Cookie', 'csrf_token=; Path=/; Max-Age=0', { append: true });
		return c.redirect('/login');
	});

	return app;
}
