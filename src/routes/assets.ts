import { Hono } from 'hono';

const DASHBOARD_JS = `
(function () {
	function getCookie(name) {
		const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
		return match ? decodeURIComponent(match[1]) : '';
	}

	function findTarget(el) {
		const selector = el.getAttribute('hx-target');
		if (!selector) return null;
		return document.querySelector(selector);
	}

	function swap(target, html, mode) {
		if (!target) return;
		if (mode === 'outerHTML') {
			target.outerHTML = html;
			return;
		}
		target.innerHTML = html;
		if (target.id === 'action-result') {
			setTimeout(function () { location.reload(); }, 1200);
		}
	}

	async function request(el, method, url, body) {
		if (el.getAttribute('hx-confirm') && !confirm(el.getAttribute('hx-confirm'))) return;
		const target = findTarget(el);
		const token = getCookie('csrf_token');
		const headers = { 'X-Requested-With': 'alden-dashboard' };
		if (token) headers['X-CSRF-Token'] = token;
		if (!(body instanceof FormData) && body !== undefined) headers['Content-Type'] = 'application/x-www-form-urlencoded';

		el.setAttribute('aria-busy', 'true');
		el.disabled = true;
		try {
			const response = await fetch(url, { method, headers, body });
			const redirect = response.headers.get('HX-Redirect');
			if (redirect) {
				location.href = redirect;
				return;
			}
			const html = await response.text();
			swap(target, html, el.getAttribute('hx-swap') || 'innerHTML');
		} finally {
			el.removeAttribute('aria-busy');
			el.disabled = false;
		}
	}

	document.addEventListener('click', function (event) {
		const el = event.target.closest('[hx-get], [hx-post]');
		if (!el || el.tagName === 'FORM') return;
		const url = el.getAttribute('hx-get') || el.getAttribute('hx-post');
		if (!url) return;
		event.preventDefault();
		request(el, el.hasAttribute('hx-get') ? 'GET' : 'POST', url);
	});

	document.addEventListener('submit', function (event) {
		const form = event.target;
		if (!(form instanceof HTMLFormElement)) return;
		const url = form.getAttribute('hx-post') || form.getAttribute('hx-get');
		if (!url) return;
		event.preventDefault();
		request(form, form.hasAttribute('hx-get') ? 'GET' : 'POST', url, new FormData(form));
	});

	document.addEventListener('input', function (event) {
		const input = event.target;
		if (!(input instanceof HTMLInputElement)) return;
		const tableSelector = input.getAttribute('data-filter-table');
		if (!tableSelector) return;
		const query = input.value.trim().toLowerCase();
		document.querySelectorAll(tableSelector + ' tbody tr[data-filter-text]').forEach(function (row) {
			row.hidden = query.length > 0 && !row.getAttribute('data-filter-text').includes(query);
		});
	});

	window.toggleSidebar = function () {
		const sidebar = document.getElementById('sidebar');
		const overlay = document.getElementById('sidebar-overlay');
		if (!sidebar || !overlay) return;
		sidebar.classList.toggle('-translate-x-full');
		overlay.classList.toggle('hidden');
	};
})();
`;

const DASHBOARD_CSS = `
:root {
	color-scheme: dark;
	--bg: #070a0f;
	--panel: #111827;
	--panel-2: #1f2937;
	--border: #2f3a4a;
	--text: #f3f4f6;
	--muted: #9ca3af;
	--dim: #6b7280;
	--primary: #4f46e5;
	--primary-hover: #4338ca;
	--danger: #dc2626;
	--warning: #b45309;
	--success: #047857;
}
* { box-sizing: border-box; }
html, body { min-height: 100%; margin: 0; }
body {
	background: var(--bg);
	color: var(--text);
	font: 14px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
a { color: #a5b4fc; text-decoration: none; }
a:hover { color: #c7d2fe; }
button, input { font: inherit; }
input {
	width: 100%;
	background: #0f172a;
	color: var(--text);
	border: 1px solid var(--border);
	border-radius: 8px;
	padding: 10px 12px;
	outline: none;
}
input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79, 70, 229, .25); }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px 16px; border-bottom: 1px solid rgba(47, 58, 74, .65); text-align: left; vertical-align: top; }
th { color: var(--dim); font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
tr:hover td { background: rgba(31, 41, 55, .35); }
code, .font-mono { font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace; }
pre {
	white-space: pre-wrap;
	word-break: break-word;
	background: #020617;
	border: 1px solid var(--border);
	border-radius: 8px;
	padding: 16px;
	max-height: 520px;
	overflow: auto;
}
.center-page { min-height: 100vh; display: grid; place-items: center; padding: 16px; }
.login-shell { width: min(100%, 420px); }
.login-card, .panel, .bg-gray-900 {
	background: var(--panel);
	border: 1px solid var(--border);
	border-radius: 8px;
	box-shadow: 0 16px 40px rgba(0, 0, 0, .22);
}
.login-card { padding: 32px; }
.panel, .bg-gray-900 { padding: 20px; margin-bottom: 16px; }
.panel h3, .bg-gray-900 h3 { margin: 0 0 12px; color: #d1d5db; font-size: 14px; }
.panel-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
.panel-header h3, .panel-header p { margin: 0; }
.panel-header input { max-width: 320px; }
.page-heading { margin-bottom: 24px; }
.page-heading h1 { margin: 4px 0; font-size: 26px; }
.page-heading p, .muted, .text-gray-500 { color: var(--muted); }
.muted-link { color: var(--muted); font-size: 13px; }
.grid { display: grid; gap: 16px; }
.grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.table-wrap { overflow-x: auto; margin: 0 -20px -20px; }
.table-wrap table { min-width: 760px; }
.align-right { text-align: right; }
.align-end { justify-content: flex-end; }
.action-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.inline-form { display: flex; gap: 8px; align-items: center; }
.inline-form input { min-width: 0; }
.btn, button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border: 1px solid transparent;
	border-radius: 8px;
	padding: 9px 13px;
	background: var(--panel-2);
	color: var(--text);
	cursor: pointer;
	transition: background .15s ease, border-color .15s ease, opacity .15s ease;
}
.btn:hover, button:hover { background: #374151; }
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-hover); }
.btn-secondary { background: #1f2937; border-color: #374151; color: #d1d5db; }
.btn-danger { background: rgba(220, 38, 38, .16); border-color: rgba(220, 38, 38, .45); color: #fca5a5; }
.btn-warning { background: rgba(180, 83, 9, .16); border-color: rgba(180, 83, 9, .45); color: #fcd34d; }
.btn-small { padding: 6px 9px; font-size: 12px; }
[aria-busy="true"] { opacity: .65; cursor: wait; }
.toast {
	padding: 12px 14px;
	border-radius: 8px;
	margin: 0 0 12px;
	border: 1px solid var(--border);
}
.toast-success { background: rgba(4, 120, 87, .22); border-color: #10b981; color: #d1fae5; }
.toast-error { background: rgba(127, 29, 29, .35); border-color: #ef4444; color: #fecaca; }
.toast-warning { background: rgba(120, 53, 15, .35); border-color: #f59e0b; color: #fde68a; }
.toast-info { background: rgba(30, 64, 175, .3); border-color: #60a5fa; color: #dbeafe; }
.kv { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid rgba(47, 58, 74, .5); }
.kv:last-child { border-bottom: 0; }
.code-block { background: #0f172a; border: 1px solid var(--border); border-radius: 8px; padding: 12px; }
.break-all { word-break: break-all; }
.identity { display: flex; gap: 12px; align-items: center; }
.identity-name { color: #f9fafb; font-weight: 600; }
.avatar { width: 32px; height: 32px; border-radius: 999px; object-fit: cover; flex: none; }
.avatar-fallback { display: grid; place-items: center; background: #374151; color: #e5e7eb; font-weight: 700; }
.badge { display: inline-flex; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--border); font-size: 12px; }
.badge-botAdmin { color: #fecaca; border-color: #991b1b; background: rgba(127, 29, 29, .35); }
.badge-leader { color: #ddd6fe; border-color: #7c3aed; background: rgba(91, 33, 182, .32); }
.badge-deputy, .badge-virtualDeputy { color: #fde68a; border-color: #b45309; background: rgba(120, 53, 15, .3); }
.badge-bot { color: #bfdbfe; border-color: #2563eb; background: rgba(30, 64, 175, .3); }
.badge-member { color: #d1d5db; border-color: #4b5563; background: rgba(75, 85, 99, .25); }
.member-detail { display: grid; gap: 6px; margin: 0 0 12px 44px; padding: 12px; border: 1px solid var(--border); border-radius: 8px; background: #0f172a; }
.member-detail div { display: flex; justify-content: space-between; gap: 16px; }
.empty { text-align: center; color: var(--muted); padding: 32px; }
.h-full { min-height: 100vh; }
.flex { display: flex; }
.flex-1 { flex: 1 1 0%; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.space-y-1 > * + * { margin-top: 4px; }
.space-y-2 > * + * { margin-top: 8px; }
.space-y-3 > * + * { margin-top: 12px; }
.space-y-4 > * + * { margin-top: 16px; }
.fixed { position: fixed; }
.inset-0 { inset: 0; }
.inset-y-0 { top: 0; bottom: 0; }
.left-0 { left: 0; }
.right-0 { right: 0; }
.top-0 { top: 0; }
.z-40 { z-index: 40; }
.z-50 { z-index: 50; }
.hidden { display: none !important; }
.w-64 { width: 16rem; }
.w-full { width: 100%; }
.max-w-7xl { max-width: 80rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.overflow-hidden { overflow: hidden; }
.overflow-y-auto { overflow-y: auto; }
.overflow-x-auto { overflow-x: auto; }
.p-3 { padding: 12px; }
.p-4 { padding: 16px; }
.p-5 { padding: 20px; }
.p-6 { padding: 24px; }
.px-3 { padding-left: 12px; padding-right: 12px; }
.py-2\\.5 { padding-top: 10px; padding-bottom: 10px; }
.pt-20 { padding-top: 80px; }
.border-r { border-right: 1px solid var(--border); }
.border-b { border-bottom: 1px solid var(--border); }
.border-t { border-top: 1px solid var(--border); }
.bg-gray-950, .from-gray-900, .to-gray-950 { background: var(--bg); }
.bg-gray-900\\/95, .bg-gray-900 { background: var(--panel); }
.bg-black\\/60 { background: rgba(0, 0, 0, .6); }
.text-white { color: #fff; }
.text-gray-100 { color: var(--text); }
.text-gray-300, .text-gray-400 { color: #d1d5db; }
.text-gray-500, .text-gray-600 { color: var(--muted); }
.text-indigo-400 { color: #a5b4fc; }
.text-red-400 { color: #f87171; }
.text-sm { font-size: 14px; }
.text-xs { font-size: 12px; }
.text-base { font-size: 16px; }
.text-lg { font-size: 18px; }
.text-2xl { font-size: 24px; }
.font-medium { font-weight: 500; }
.font-semibold, .font-bold { font-weight: 700; }
.rounded-lg, .rounded-xl, .rounded-2xl { border-radius: 8px; }
.sidebar-link { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 8px; color: #d1d5db; }
.sidebar-link:hover { background: #1f2937; color: #fff; }
.sidebar-link.bg-gradient-to-r { background: var(--primary); color: #fff; }
main { min-width: 0; }
aside { background: #0b1120; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 999px; }
@media (min-width: 768px) {
	.md\\:static { position: static; }
	.md\\:hidden { display: none !important; }
	.md\\:translate-x-0 { transform: translateX(0) !important; }
	.md\\:pt-6 { padding-top: 24px; }
	.md\\:p-6 { padding: 24px; }
	.md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	.md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	.md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
@media (max-width: 767px) {
	.-translate-x-full { transform: translateX(-100%); }
	.grid-3 { grid-template-columns: 1fr; }
	.panel-header { align-items: stretch; flex-direction: column; }
	.inline-form { flex-direction: column; align-items: stretch; }
}
`;

export function createAssetRoutes(): Hono {
	const app = new Hono();

	app.get('/assets/dashboard.js', (c) => {
		return new Response(DASHBOARD_JS, {
			headers: {
				'Content-Type': 'application/javascript; charset=utf-8',
				'Cache-Control': 'no-store',
			},
		});
	});

	app.get('/assets/dashboard.css', (c) => {
		return new Response(DASHBOARD_CSS, {
			headers: {
				'Content-Type': 'text/css; charset=utf-8',
				'Cache-Control': 'no-store',
			},
		});
	});

	return app;
}
