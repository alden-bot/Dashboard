import type { I18nManager } from '@/api';

export function renderLogin(i18n: I18nManager, lang: string): string {
	return `<!DOCTYPE html>
<html lang="${lang}" class="h-full">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Login - Alden Bot Dashboard</title>
	<script src="https://cdn.tailwindcss.com"></script>
	<script>
		tailwind.config = {
			theme: {
				extend: {
					colors: {
						dark: {
							700: '#1f2937',
							800: '#111827',
							900: '#030712',
						}
					}
				}
			}
		}
	</script>
</head>
<body class="h-full bg-gray-950 flex items-center justify-center p-4">
	<div class="w-full max-w-sm">
		<div class="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
			<div class="text-center mb-8">
				<div class="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
					<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
					</svg>
				</div>
				<h1 class="text-2xl font-bold text-white">Alden Bot</h1>
				<p class="text-gray-500 text-sm mt-1">Dashboard Login</p>
			</div>

			<form action="/api/login" method="post" class="space-y-4">
				<div>
					<label for="otp" class="block text-sm font-medium text-gray-400 mb-2">OTP Code</label>
					<input
						type="text"
						id="otp"
						name="otp"
						placeholder="12345678"
						maxlength="8"
						pattern="[0-9]{8}"
						required
						autofocus
						class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-lg tracking-widest font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
					>
				</div>
				<p class="text-xs text-gray-500 text-center">
					Send <code class="bg-gray-800 px-1.5 py-0.5 rounded text-indigo-400">/dashboard</code> in DM to get your OTP
				</p>
				<button
					type="submit"
					class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
				>
					Login
				</button>
			</form>
			<div id="login-result" class="mt-4"></div>
		</div>
	</div>
</body>
</html>`;
}
