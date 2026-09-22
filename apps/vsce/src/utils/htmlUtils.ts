/**
 * HTML sanitization and Webview error rendering utilities.
 */

export function escapeHtml(unsafe: string): string {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

export function renderErrorHtml(title: string, message: string): string {
	const escapedTitle = escapeHtml(title);
	const escapedMessage = escapeHtml(message);
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
		body {
			background-color: var(--vscode-editor-background);
			color: var(--vscode-editor-foreground);
			font-family: var(--vscode-font-family);
			padding: 20px;
		}
		h2 {
			color: var(--vscode-editor-foreground);
		}
		pre {
			color: var(--vscode-errorForeground);
			white-space: pre-wrap;
			word-break: break-word;
		}
	</style>
</head>
<body>
	<h2>${escapedTitle}</h2>
	<pre>${escapedMessage}</pre>
</body>
</html>`;
}
