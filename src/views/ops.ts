import type { I18nManager } from '@/api';
import type { BotStatus } from '../services/BotService';
import { renderLayout } from './layout';
import { escapeHtml } from '../utils/html';

export function renderOps(
	status: BotStatus,
	logs: readonly string[],
	i18n: I18nManager,
	lang: string,
): string {
	const content = `
		<div class="page-heading">
			<h1>Ops</h1>
			<p>BotAdmin controls for alden-bot runtime operations</p>
		</div>

		<div id="ops-result"></div>

		<div class="grid grid-3">
			<div class="panel">
				<h3>Runtime</h3>
				<div class="kv"><span>Version</span><strong>v${escapeHtml(status.version)}</strong></div>
				<div class="kv"><span>Uptime</span><strong>${escapeHtml(status.uptimeFormatted)}</strong></div>
				<div class="kv"><span>Node.js</span><strong>${escapeHtml(status.node)}</strong></div>
			</div>

			<div class="panel">
				<h3>Update</h3>
				<div class="action-row">
					<button hx-post="/ops/update-check" hx-target="#ops-result" hx-swap="innerHTML" class="btn btn-secondary">Check</button>
					<button hx-post="/ops/update-apply" hx-target="#ops-result" hx-swap="innerHTML" hx-confirm="Apply update and restart alden-bot?" class="btn btn-primary">Apply</button>
				</div>
			</div>

			<div class="panel">
				<h3>Restart</h3>
				<button hx-post="/ops/restart" hx-target="#ops-result" hx-swap="innerHTML" hx-confirm="Restart alden-bot now?" class="btn btn-warning">Restart</button>
			</div>
		</div>

		<div class="panel">
			<div class="panel-header">
				<div>
					<h3>Recent Logs</h3>
					<p>${logs.length} lines</p>
				</div>
				<button hx-get="/ops/logs" hx-target="#log-tail" hx-swap="innerHTML" class="btn btn-secondary">Refresh</button>
			</div>
			<div id="log-tail">${renderLogTail(logs)}</div>
		</div>
	`;

	return renderLayout('Ops', content, i18n, lang, true, 'ops');
}

export function renderLogTail(logs: readonly string[]): string {
	if (logs.length === 0) {
		return '<p class="muted">No log lines found for today.</p>';
	}

	return `<pre>${logs.map((line) => escapeHtml(line)).join('\n')}</pre>`;
}
