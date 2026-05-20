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
	--bg: #090d12;
	--surface: #0d131b;
	--panel: #111922;
	--panel-2: #182232;
	--panel-3: #202b3a;
	--border: #2a3645;
	--text: #f5f7fb;
	--muted: #a4afbf;
	--dim: #768294;
	--primary: #5b6ee1;
	--primary-hover: #4b5dcc;
	--accent: #14b8a6;
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
svg { display: block; width: 1.25rem; height: 1.25rem; flex: none; }
input {
	width: 100%;
	background: #0c121b;
	color: var(--text);
	border: 1px solid var(--border);
	border-radius: 8px;
	padding: 10px 12px;
	outline: none;
}
input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79, 70, 229, .25); }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px 16px; border-bottom: 1px solid rgba(47, 58, 74, .65); text-align: left; vertical-align: middle; }
th { color: var(--dim); font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
tr:hover td { background: rgba(32, 43, 58, .28); }
code, .font-mono { font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace; }
pre {
	white-space: pre-wrap;
	word-break: break-word;
	background: #070b11;
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
	box-shadow: 0 12px 32px rgba(0, 0, 0, .2);
}
.login-card { padding: 32px; }
.panel, .bg-gray-900 { padding: 18px; margin-bottom: 16px; }
.panel h3, .bg-gray-900 h3 { margin: 0 0 12px; color: #d1d5db; font-size: 14px; }
.panel-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
.panel-header h3, .panel-header p { margin: 0; }
.panel-header input { max-width: 320px; }
.page-heading { margin-bottom: 24px; }
.page-heading h1 { margin: 6px 0; font-size: 26px; line-height: 1.18; }
.page-heading p, .muted, .text-gray-500 { color: var(--muted); }
.muted-link { color: var(--muted); font-size: 13px; }
.grid { display: grid; gap: 16px; }
.grid-cols-1 { grid-template-columns: minmax(0, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
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
	white-space: nowrap;
}
.btn:hover, button:hover { background: var(--panel-3); }
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-hover); }
.btn-secondary { background: var(--panel-2); border-color: #334156; color: #d1d5db; }
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
.block { display: block; }
.inline-flex { display: inline-flex; }
.h-full { min-height: 100vh; }
.h-2 { height: .5rem; }
.h-2\\.5 { height: .625rem; }
.h-3 { height: .75rem; }
.h-4 { height: 1rem; }
.h-5 { height: 1.25rem; }
.h-8 { height: 2rem; }
.h-10 { height: 2.5rem; }
.h-16 { height: 4rem; }
.flex { display: flex; }
.flex-1 { flex: 1 1 0%; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.flex-shrink-0 { flex-shrink: 0; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.space-y-1 > * + * { margin-top: 4px; }
.space-y-2 > * + * { margin-top: 8px; }
.space-y-3 > * + * { margin-top: 12px; }
.space-y-4 > * + * { margin-top: 16px; }
.space-y-0 > * + * { margin-top: 0; }
.mt-0\\.5 { margin-top: 2px; }
.mt-1 { margin-top: 4px; }
.mt-4 { margin-top: 16px; }
.mb-1 { margin-bottom: 4px; }
.mb-1\\.5 { margin-bottom: 6px; }
.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 16px; }
.mb-6 { margin-bottom: 24px; }
.mb-8 { margin-bottom: 32px; }
.ml-4 { margin-left: 16px; }
.ml-auto { margin-left: auto; }
.fixed { position: fixed; }
.inset-0 { inset: 0; }
.inset-y-0 { top: 0; bottom: 0; }
.left-0 { left: 0; }
.right-0 { right: 0; }
.top-0 { top: 0; }
.z-40 { z-index: 40; }
.z-50 { z-index: 50; }
.hidden { display: none !important; }
.w-2 { width: .5rem; }
.w-4 { width: 1rem; }
.w-5 { width: 1.25rem; }
.w-8 { width: 2rem; }
.w-10 { width: 2.5rem; }
.w-16 { width: 4rem; }
.w-64 { width: 16rem; }
.w-full { width: 100%; }
.max-w-2xl { max-width: 42rem; }
.max-w-7xl { max-width: 80rem; }
.max-h-\\[70vh\\] { max-height: 70vh; }
.min-w-0 { min-width: 0; }
.mx-auto { margin-left: auto; margin-right: auto; }
.overflow-hidden { overflow: hidden; }
.overflow-y-auto { overflow-y: auto; }
.overflow-x-auto { overflow-x: auto; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.p-3 { padding: 12px; }
.p-4 { padding: 16px; }
.p-5 { padding: 20px; }
.p-6 { padding: 24px; }
.p-1\\.5 { padding: 6px; }
.px-3 { padding-left: 12px; padding-right: 12px; }
.px-1\\.5 { padding-left: 6px; padding-right: 6px; }
.px-2 { padding-left: 8px; padding-right: 8px; }
.px-4 { padding-left: 16px; padding-right: 16px; }
.px-5 { padding-left: 20px; padding-right: 20px; }
.py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
.py-1 { padding-top: 4px; padding-bottom: 4px; }
.py-1\\.5 { padding-top: 6px; padding-bottom: 6px; }
.py-2 { padding-top: 8px; padding-bottom: 8px; }
.py-2\\.5 { padding-top: 10px; padding-bottom: 10px; }
.py-3 { padding-top: 12px; padding-bottom: 12px; }
.py-4 { padding-top: 16px; padding-bottom: 16px; }
.py-8 { padding-top: 32px; padding-bottom: 32px; }
.pt-20 { padding-top: 80px; }
.border-r { border-right: 1px solid var(--border); }
.border-b { border-bottom: 1px solid var(--border); }
.border-t { border-top: 1px solid var(--border); }
.border { border: 1px solid var(--border); }
.border-gray-700, .border-gray-800, .border-indigo-800 { border-color: var(--border); }
.bg-gray-950, .from-gray-900, .to-gray-950 { background: var(--bg); }
.bg-gray-900\\/95, .bg-gray-900 { background: var(--panel); }
.bg-gray-900\\/50, .hover\\:bg-gray-900\\/50:hover { background: rgba(17, 25, 34, .5); }
.bg-gray-900\\/80, .hover\\:bg-gray-900\\/80:hover { background: rgba(17, 25, 34, .8); }
.bg-gray-800 { background: var(--panel-2); }
.bg-gray-800\\/60, .hover\\:bg-gray-800\\/60:hover { background: rgba(24, 34, 50, .6); }
.bg-indigo-600 { background: var(--primary); }
.bg-indigo-600\\/10 { background: rgba(91, 110, 225, .12); }
.bg-indigo-600\\/20 { background: rgba(91, 110, 225, .2); }
.bg-indigo-900\\/30 { background: rgba(49, 46, 129, .3); }
.bg-indigo-900\\/50 { background: rgba(49, 46, 129, .5); }
.bg-green-500 { background: #22c55e; }
.bg-green-900\\/50 { background: rgba(20, 83, 45, .5); }
.bg-purple-600 { background: #7c3aed; }
.bg-black\\/60 { background: rgba(0, 0, 0, .6); }
.text-white { color: #fff; }
.text-gray-100 { color: var(--text); }
.text-gray-300, .text-gray-400 { color: #d1d5db; }
.text-gray-500, .text-gray-600 { color: var(--muted); }
.text-indigo-400 { color: #a5b4fc; }
.text-green-400 { color: #4ade80; }
.text-red-400 { color: #f87171; }
.text-transparent { color: transparent; }
.bg-clip-text.text-transparent { color: var(--text); }
.text-sm { font-size: 14px; }
.text-xs { font-size: 12px; }
.text-base { font-size: 16px; }
.text-lg { font-size: 18px; }
.text-2xl { font-size: 24px; }
.text-\\[10px\\] { font-size: 10px; }
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }
.uppercase { text-transform: uppercase; }
.whitespace-nowrap { white-space: nowrap; }
.font-medium { font-weight: 500; }
.font-semibold, .font-bold { font-weight: 700; }
.rounded, .rounded-lg, .rounded-xl, .rounded-2xl { border-radius: 8px; }
.rounded-full { border-radius: 999px; }
.shadow-lg { box-shadow: 0 12px 32px rgba(0, 0, 0, .2); }
.transition-colors, .transition-all, .transition-transform { transition: background .15s ease, border-color .15s ease, color .15s ease, transform .18s ease; }
.sidebar-link {
	display: flex;
	align-items: center;
	gap: 10px;
	min-height: 38px;
	padding: 0 10px;
	border: 1px solid transparent;
	border-radius: 8px;
	color: #c7d0df;
}
.sidebar-link svg { width: 18px; height: 18px; }
.sidebar-link:hover { background: rgba(32, 43, 58, .72); color: #fff; }
.sidebar-link.bg-gradient-to-r {
	background: #172033;
	border-color: #2f415d;
	color: #fff;
	box-shadow: inset 3px 0 0 var(--accent);
}
main { min-width: 0; }
aside { background: #080d14; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 999px; }
@media (min-width: 640px) {
	.sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
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
@media (min-width: 1024px) {
	.lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	.lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	.lg\\:grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
}
@media (min-width: 1280px) {
	.xl\\:grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
}
@media (max-width: 767px) {
	.-translate-x-full { transform: translateX(-100%); }
	.grid-3, .grid-cols-2, .grid-cols-3, .grid-cols-4, .grid-cols-5 { grid-template-columns: 1fr; }
	.panel-header { align-items: stretch; flex-direction: column; }
	.inline-form { flex-direction: column; align-items: stretch; }
	.table-wrap table { min-width: 680px; }
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
