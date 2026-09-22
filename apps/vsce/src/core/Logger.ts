import * as vscode from "vscode";

let outputChannel: vscode.OutputChannel | null = null;

function getLocalTimestamp(date = new Date()): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	const padMs = (n: number) => String(n).padStart(3, "0");

	const year = date.getFullYear();
	const month = pad(date.getMonth() + 1);
	const day = pad(date.getDate());
	const hours = pad(date.getHours());
	const minutes = pad(date.getMinutes());
	const seconds = pad(date.getSeconds());
	const ms = padMs(date.getMilliseconds());

	const offsetMinutes = -date.getTimezoneOffset();
	const sign = offsetMinutes >= 0 ? "+" : "-";
	const absOffsetHours = pad(Math.floor(Math.abs(offsetMinutes) / 60));
	const absOffsetMinutes = pad(Math.abs(offsetMinutes) % 60);

	return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}${sign}${absOffsetHours}:${absOffsetMinutes}`;
}

function log(level: string, message: string) {
	const timestamp = getLocalTimestamp();
	if (outputChannel) {
		outputChannel.appendLine(`[${timestamp}] [${level}] ${message}`);
	} else {
		console.log(`[${timestamp}] [${level}] ${message}`);
	}
}

export const Logger = {
	initialize(context: vscode.ExtensionContext) {
		if (!outputChannel) {
			outputChannel = vscode.window.createOutputChannel("Automa");
			context.subscriptions.push(outputChannel);
		}
	},

	getOutputChannel(): vscode.OutputChannel | null {
		return outputChannel;
	},

	info(message: string) {
		log("INFO", message);
	},

	warn(message: string) {
		log("WARN", message);
	},

	error(message: string) {
		log("ERROR", message);
	},
};
