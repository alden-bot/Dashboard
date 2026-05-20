import type { Context, Next } from 'hono';
import type { Session } from './SessionManager';
import type Main from '../main';
import { Role } from '@/api';
import { getCookie, setCookie } from './cookies';

declare module 'hono' {
	interface ContextVariableMap {
		session: Session | undefined;
		csrfToken: string | undefined;
	}
}

export function createAuthMiddleware(plugin: Main) {
	return async (c: Context, next: Next): Promise<void> => {
		const token = getCookie(c, 'dashboard_session');

		if (token) {
			const session = plugin.sessionManager.validate(token);
			c.set('session', session);

			if (session) {
				c.set('csrfToken', session.csrfToken);
				setCsrfCookie(c, plugin, session.csrfToken);
			}
		} else {
			c.set('session', undefined);
		}

		await next();
	};
}

export async function csrfProtection(c: Context, next: Next): Promise<Response | void> {
	const method = c.req.method;
	if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
		const session = c.get('session');
		if (session) {
			const headerToken = c.req.header('X-CSRF-Token');

			if (!headerToken) {
				return c.text('CSRF token missing', 403);
			}

			if (session.csrfToken !== headerToken) {
				return c.text('CSRF token mismatch', 403);
			}
		}
	}
	await next();
}

export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
	const session = c.get('session');
	if (!session) {
		return c.redirect('/login');
	}
	await next();
}

export async function requireAdmin(c: Context, next: Next): Promise<Response | void> {
	const session = c.get('session');
	if (!session) {
		return c.redirect('/login');
	}
	if (session.role < Role.BotAdmin) {
		return c.html(renderForbidden(), 403);
	}
	await next();
}

function setCsrfCookie(c: Context, plugin: Main, token: string): void {
	const maxAge = Math.floor(plugin.config.get('sessionTTL') / 1000);
	setCookie(c, 'csrf_token', token, {
		maxAge,
		secure: shouldUseSecureCookie(c, plugin),
		sameSite: 'Strict',
	});
}

export function shouldUseSecureCookie(c: Context, plugin: Main): boolean {
	if (plugin.config.get('secureCookies')) return true;
	if (!plugin.config.get('trustProxy')) return false;
	return c.req.header('x-forwarded-proto') === 'https';
}

function renderForbidden(): string {
	return `<!DOCTYPE html>
<html class="h-full">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>403 - Forbidden</title>
	<link rel="stylesheet" href="/assets/dashboard.css">
</head>
<body class="center-page">
	<div class="login-card text-center">
		<h1>403</h1>
		<p>You don't have permission to access this page.</p>
		<a href="/dashboard" class="btn btn-primary">
			Back to Dashboard
		</a>
	</div>
</body>
</html>`;
}
