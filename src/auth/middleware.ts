import { randomBytes } from 'node:crypto';
import type { Context, Next } from 'hono';
import type { Session } from './SessionManager';
import type Main from '../main';
import { Role } from '@/core/permission/PermissionManager';

declare module 'hono' {
	interface ContextVariableMap {
		session: Session | undefined;
		csrfToken: string | undefined;
	}
}

/**
 * Auth middleware: validates session cookie and attaches session to context.
 * Also generates a CSRF token for authenticated sessions.
 */
export function createAuthMiddleware(plugin: Main) {
	return async (c: Context, next: Next): Promise<void> => {
		const token = getCookie(c, 'dashboard_session');

		if (token) {
			const session = plugin.sessionManager.validate(token);
			c.set('session', session);

			if (session) {
				// Generate CSRF token and attach to context + cookie
				const csrfToken = randomBytes(32).toString('hex');
				c.set('csrfToken', csrfToken);
				c.header(
					'Set-Cookie',
					`csrf_token=${csrfToken}; Path=/; HttpOnly; SameSite=Strict`,
				);
			}
		} else {
			c.set('session', undefined);
		}

		await next();
	};
}

/**
 * CSRF protection middleware for POST requests.
 * Validates the `X-CSRF-Token` header against the `csrf_token` cookie.
 * Only applies to authenticated sessions (login POST is exempt).
 */
export async function csrfProtection(c: Context, next: Next): Promise<Response | void> {
	if (c.req.method === 'POST') {
		const session = c.get('session');
		if (session) {
			const cookieToken = getCookie(c, 'csrf_token');
			const headerToken = c.req.header('X-CSRF-Token');

			if (!cookieToken || !headerToken || cookieToken !== headerToken) {
				return c.text('CSRF token mismatch', 403);
			}
		}
	}
	await next();
}

/**
 * Require authentication. Redirects to /login if not authenticated.
 */
export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
	const session = c.get('session');
	if (!session) {
		return c.redirect('/login');
	}
	await next();
}

/**
 * Require BotAdmin role.
 */
export async function requireAdmin(c: Context, next: Next): Promise<Response | void> {
	const session = c.get('session');
	if (!session) {
		return c.redirect('/login');
	}
	if (session.role < Role.BotAdmin) {
		return c.html(
			renderForbidden(),
			403,
		);
	}
	await next();
}

function renderForbidden(): string {
	return `<!DOCTYPE html>
<html class="h-full">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>403 - Forbidden</title>
	<script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="h-full bg-gray-950 flex items-center justify-center">
	<div class="text-center">
		<h1 class="text-6xl font-bold text-gray-600">403</h1>
		<p class="text-gray-400 mt-4">You don't have permission to access this page.</p>
		<a href="/dashboard" class="inline-block mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
			Back to Dashboard
		</a>
	</div>
</body>
</html>`;
}

/**
 * Get cookie value by name.
 */
function getCookie(c: Context, name: string): string | undefined {
	const cookies = c.req.header('cookie');
	if (!cookies) return undefined;

	for (const cookie of cookies.split(';')) {
		const [key, value] = cookie.trim().split('=');
		if (key === name) return value;
	}

	return undefined;
}
