import * as vscode from "vscode";
import { DAEMON_EVENTS } from "../constants/events.constants";
import { DaemonService } from "../daemon/DaemonService";
import { globalEvents } from "../daemon/GlobalSseListener";
import {
	CampaignDbStrategy,
	type DbResourceStrategy,
	WorkflowDbStrategy,
} from "./storage/DbResourceStrategies";

export class AutomaDbFileSystemProvider
	implements vscode.FileSystemProvider, vscode.Disposable
{
	public static readonly scheme = "automa-db";

	private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
	readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> =
		this._emitter.event;

	private readonly strategies: Record<string, DbResourceStrategy> = {
		workflows: new WorkflowDbStrategy(),
		campaigns: new CampaignDbStrategy(),
	};

	public dispose(): void {
		this._emitter.dispose();
	}

	public static register(
		context: vscode.ExtensionContext,
	): AutomaDbFileSystemProvider {
		const provider = new AutomaDbFileSystemProvider();
		context.subscriptions.push(provider);
		context.subscriptions.push(
			vscode.workspace.registerFileSystemProvider(
				AutomaDbFileSystemProvider.scheme,
				provider,
				{ isCaseSensitive: true },
			),
		);
		return provider;
	}

	public static createWorkflowUri(id: string, name?: string): vscode.Uri {
		const cleanName = (name || id)
			.toLowerCase()
			.replace(/[^a-z0-9_-]/g, "_")
			.replace(/_+/g, "_");
		return vscode.Uri.from({
			scheme: AutomaDbFileSystemProvider.scheme,
			path: `/workflows/${id}/${cleanName}.workflow.json`,
		});
	}

	public static createCampaignUri(id: string, name?: string): vscode.Uri {
		const cleanName = (name || id)
			.toLowerCase()
			.replace(/[^a-z0-9_-]/g, "_")
			.replace(/_+/g, "_");
		return vscode.Uri.from({
			scheme: AutomaDbFileSystemProvider.scheme,
			path: `/campaigns/${id}/${cleanName}.campaign.json`,
		});
	}

	private parseUri(uri: vscode.Uri): {
		category: "workflows" | "campaigns" | "unknown";
		id?: string;
	} {
		const parts = uri.path.split("/").filter(Boolean);
		if (parts.length === 0) return { category: "unknown" };

		const category =
			parts[0] === "workflows"
				? "workflows"
				: parts[0] === "campaigns"
					? "campaigns"
					: "unknown";

		const id = parts.length > 1 ? parts[1] : undefined;
		return { category, id };
	}

	private async ensureDaemon(): Promise<void> {
		if (!DaemonService.isRunning()) {
			await DaemonService.start();
		}
	}

	watch(
		_uri: vscode.Uri,
		_options: { recursive: boolean; excludes: string[] },
	): vscode.Disposable {
		return new vscode.Disposable(() => {});
	}

	async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
		const { category, id } = this.parseUri(uri);
		if (!id) {
			return {
				type: vscode.FileType.Directory,
				ctime: Date.now(),
				mtime: Date.now(),
				size: 0,
			};
		}

		const strategy = this.strategies[category];
		if (!strategy) {
			throw vscode.FileSystemError.FileNotFound(uri);
		}

		await this.ensureDaemon();
		try {
			const data = await strategy.read(id);
			const json = JSON.stringify(data, null, 2);
			return {
				type: vscode.FileType.File,
				ctime: Date.now(),
				mtime: Date.now(),
				size: Buffer.byteLength(json, "utf8"),
			};
		} catch {
			throw vscode.FileSystemError.FileNotFound(uri);
		}
	}

	async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
		const { category, id } = this.parseUri(uri);
		if (id) {
			return [];
		}

		await this.ensureDaemon();
		const strategy = this.strategies[category];
		if (strategy) {
			const items = await strategy.list();
			return items.map((name) => [name, vscode.FileType.File]);
		}

		return [
			["workflows", vscode.FileType.Directory],
			["campaigns", vscode.FileType.Directory],
		];
	}

	createDirectory(_uri: vscode.Uri): void {}

	async readFile(uri: vscode.Uri): Promise<Uint8Array> {
		const { category, id } = this.parseUri(uri);
		if (!id) {
			throw vscode.FileSystemError.FileIsADirectory(uri);
		}

		const strategy = this.strategies[category];
		if (!strategy) {
			throw vscode.FileSystemError.FileNotFound(uri);
		}

		await this.ensureDaemon();
		try {
			const data = await strategy.read(id);
			return Buffer.from(JSON.stringify(data, null, 2), "utf8");
		} catch {
			throw vscode.FileSystemError.FileNotFound(uri);
		}
	}

	async writeFile(
		uri: vscode.Uri,
		content: Uint8Array,
		_options: { create: boolean; overwrite: boolean },
	): Promise<void> {
		const { category, id } = this.parseUri(uri);
		if (!id) {
			throw vscode.FileSystemError.FileIsADirectory(uri);
		}

		const strategy = this.strategies[category];
		if (!strategy) {
			throw vscode.FileSystemError.FileNotFound(uri);
		}

		await this.ensureDaemon();
		const parsed = this.parseContent(content);
		await strategy.write(id, parsed);

		this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
		globalEvents.emit(DAEMON_EVENTS.STORAGE_CHANGED);
	}

	async delete(
		uri: vscode.Uri,
		_options: { recursive: boolean },
	): Promise<void> {
		const { category, id } = this.parseUri(uri);
		if (!id) {
			throw vscode.FileSystemError.FileIsADirectory(uri);
		}

		const strategy = this.strategies[category];
		if (!strategy) {
			throw vscode.FileSystemError.FileNotFound(uri);
		}

		await this.ensureDaemon();
		await strategy.delete(id);

		this._emitter.fire([{ type: vscode.FileChangeType.Deleted, uri }]);
		globalEvents.emit(DAEMON_EVENTS.STORAGE_CHANGED);
	}

	rename(
		_oldUri: vscode.Uri,
		_newUri: vscode.Uri,
		_options: { overwrite: boolean },
	): void {
		throw new Error("Rename is not supported on automa-db virtual files.");
	}

	private parseContent(content: Uint8Array): Record<string, unknown> {
		const jsonStr = Buffer.from(content).toString("utf8");
		try {
			return JSON.parse(jsonStr) as Record<string, unknown>;
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			throw new Error(`Invalid JSON syntax: ${msg}`);
		}
	}
}
