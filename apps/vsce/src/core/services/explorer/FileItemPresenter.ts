import * as vscode from "vscode";
import type { TreeElement } from "../../../providers/AutomaFilesProvider";

export function getFileItemIcon(
	element: TreeElement,
	filterType: string,
): string {
	if (element.isFolder) return "folder";
	if (filterType === "campaign") return "rocket";
	if (element.metadata?.isPackage || filterType === "package") return "package";
	return "play-circle";
}

export function buildFileItemDescription(
	element: TreeElement,
	filterType: string,
): string {
	const nsTag = element.namespace ? `[${element.namespace}] ` : "";

	if (filterType === "campaign") {
		const bCount = element.metadata?.browsersCount ?? 0;
		const mode = element.metadata?.concurrencyMode || "parallel";
		const cronStr = element.metadata?.cron
			? ` • ⏰ ${element.metadata.cron}`
			: "";
		return `${nsTag}• ${bCount} browsers • ${mode}${cronStr}`;
	}

	const isPkg = element.metadata?.isPackage || filterType === "package";
	const ver = element.metadata?.version
		? ` • v${element.metadata.version}`
		: "";

	if (isPkg) {
		return `${nsTag}${ver} • Package`;
	}

	const blocks =
		element.metadata?.nodesCount !== undefined
			? ` • ${element.metadata.nodesCount} blocks`
			: "";
	return `${nsTag}${ver}${blocks}`;
}

export function buildFileItemTooltip(
	element: TreeElement,
	filterType: string,
): vscode.MarkdownString {
	const isCampaign = filterType === "campaign";
	const isPkg = element.metadata?.isPackage || filterType === "package";
	const headerIcon = isCampaign ? "🚀" : isPkg ? "📦" : "⚡";

	const md = new vscode.MarkdownString();

	md.appendMarkdown(
		`### ${headerIcon} **${element.metadata?.displayName || element.name}**\n\n`,
	);
	if (element.metadata?.description) {
		md.appendMarkdown(`*${element.metadata.description}*\n\n`);
	}
	md.appendMarkdown(`---\n`);
	md.appendMarkdown(`- **ID**: \`${element.id || element.name}\`\n`);
	if (element.namespace)
		md.appendMarkdown(`- **Namespace**: \`${element.namespace}\`\n`);
	if (element.metadata?.version)
		md.appendMarkdown(`- **Version**: \`v${element.metadata.version}\`\n`);
	if (element.metadata?.nodesCount !== undefined)
		md.appendMarkdown(
			`- **Blocks/Nodes**: \`${element.metadata.nodesCount}\`\n`,
		);
	if (element.metadata?.browsersCount !== undefined)
		md.appendMarkdown(
			`- **Browsers**: \`${element.metadata.browsersCount}\`\n`,
		);
	if (element.metadata?.concurrencyMode)
		md.appendMarkdown(
			`- **Execution Mode**: \`${element.metadata.concurrencyMode}\`\n`,
		);
	if (element.metadata?.cron)
		md.appendMarkdown(`- **Schedule (Cron)**: \`${element.metadata.cron}\`\n`);

	return md;
}
