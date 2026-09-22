import { vi } from "vitest";

class MockUri {
	constructor(
		public readonly fsPath: string = "",
		public readonly scheme: string = "file",
		public readonly path: string = "",
	) {}
	public static file(f: string) {
		return new MockUri(f, "file", f);
	}
	public static parse(s: string) {
		const match = s.match(/^([a-zA-Z0-9+.-]+):(.*)$/);
		if (match?.[1] && match[2]) {
			return new MockUri(s, match[1], match[2]);
		}
		return new MockUri(s, "file", s);
	}
	public static from(components: { scheme: string; path: string }) {
		return new MockUri(components.path, components.scheme, components.path);
	}
}

class MockTreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState?: number,
	) {}
}

class MockMarkdownString {
	public isTrusted = false;
	public value = "";
	constructor(val = "") {
		this.value = val;
	}
	public appendMarkdown(str: string) {
		this.value += str;
		return this;
	}
}

class MockThemeIcon {
	constructor(public id: string) {}
}

class MockThemeColor {
	constructor(public id: string) {}
}

class MockPosition {
	constructor(
		public readonly line: number,
		public readonly character: number,
	) {}
}

class MockRange {
	public readonly start: MockPosition;
	public readonly end: MockPosition;
	constructor(
		startLine: number,
		startCharacter: number,
		endLine: number,
		endCharacter: number,
	) {
		this.start = new MockPosition(startLine, startCharacter);
		this.end = new MockPosition(endLine, endCharacter);
	}
}

class MockCodeLens {
	constructor(
		public range: MockRange,
		public command?: {
			title: string;
			command: string;
			arguments?: unknown[];
			tooltip?: string;
		},
	) {}
}

class MockEventEmitter<T = unknown> {
	private listeners: ((e: T) => unknown)[] = [];
	public event = (listener: (e: T) => unknown) => {
		this.listeners.push(listener);
		return {
			dispose: () => {
				this.listeners = this.listeners.filter((l) => l !== listener);
			},
		};
	};
	public fire(data: T) {
		for (const listener of this.listeners) {
			listener(data);
		}
	}
	public dispose() {
		this.listeners = [];
	}
}

vi.mock("vscode", () => {
	return {
		window: {
			showErrorMessage: vi.fn().mockResolvedValue(undefined),
			showWarningMessage: vi.fn().mockResolvedValue(undefined),
			showInformationMessage: vi.fn().mockResolvedValue(undefined),
			setStatusBarMessage: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			showInputBox: vi.fn().mockResolvedValue(undefined),
			showQuickPick: vi.fn().mockResolvedValue(undefined),
			showOpenDialog: vi.fn().mockResolvedValue(undefined),
			showSaveDialog: vi.fn().mockResolvedValue(undefined),
			createWebviewPanel: vi.fn().mockReturnValue({
				webview: {
					html: "",
					postMessage: vi.fn(),
					onDidReceiveMessage: vi.fn(),
				},
				reveal: vi.fn(),
				onDidDispose: vi.fn(),
				dispose: vi.fn(),
			}),
			createStatusBarItem: vi.fn().mockReturnValue({
				text: "",
				tooltip: "",
				show: vi.fn(),
				hide: vi.fn(),
				dispose: vi.fn(),
			}),
			createTreeView: vi.fn().mockReturnValue({
				dispose: vi.fn(),
			}),
			registerWebviewViewProvider: vi.fn().mockReturnValue({
				dispose: vi.fn(),
			}),
			registerCustomEditorProvider: vi.fn().mockReturnValue({
				dispose: vi.fn(),
			}),
			withProgress: vi.fn().mockImplementation(async (_options, task) => {
				const progress = { report: vi.fn() };
				const token = {
					onCancellationRequested: vi
						.fn()
						.mockReturnValue({ dispose: vi.fn() }),
				};
				return task(progress, token);
			}),
		},
		workspace: {
			getConfiguration: vi.fn().mockReturnValue({
				get: vi.fn((_key, defaultValue) => defaultValue),
				update: vi.fn().mockResolvedValue(undefined),
			}),
			onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			createFileSystemWatcher: vi.fn().mockReturnValue({
				onDidCreate: vi.fn(),
				onDidChange: vi.fn(),
				onDidDelete: vi.fn(),
				dispose: vi.fn(),
			}),
			registerFileSystemProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			findFiles: vi.fn().mockResolvedValue([]),
			workspaceFolders: [
				{
					uri: new MockUri("/mock/workspace/path"),
				},
			],
			onDidSaveTextDocument: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			onDidCloseTextDocument: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			fs: {
				readFile: vi.fn(),
				writeFile: vi.fn(),
			},
		},
		languages: {
			registerCodeLensProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			createDiagnosticCollection: vi.fn().mockReturnValue({
				set: vi.fn(),
				delete: vi.fn(),
				clear: vi.fn(),
				dispose: vi.fn(),
			}),
		},
		FileType: {
			Unknown: 0,
			File: 1,
			Directory: 2,
			SymbolicLink: 64,
		},
		FileChangeType: {
			Changed: 1,
			Created: 2,
			Deleted: 3,
		},
		FileSystemError: {
			FileNotFound: vi.fn((_uri) => new Error("FileNotFound")),
			FileIsADirectory: vi.fn((_uri) => new Error("FileIsADirectory")),
			FileExists: vi.fn((_uri) => new Error("FileExists")),
		},
		ProgressLocation: {
			Notification: 15,
		},
		ViewColumn: {
			Active: -1,
			Beside: -2,
			One: 1,
			Two: 2,
			Three: 3,
		},
		StatusBarAlignment: {
			Right: 2,
			Left: 1,
		},
		ConfigurationTarget: {
			Global: 1,
			Workspace: 2,
			WorkspaceFolder: 3,
		},
		TreeItemCollapsibleState: {
			None: 0,
			Collapsed: 1,
			Expanded: 2,
		},
		commands: {
			registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			executeCommand: vi.fn().mockResolvedValue(undefined),
			getCommands: vi.fn().mockResolvedValue([]),
		},
		extensions: {
			getExtension: vi.fn(),
		},
		EventEmitter: MockEventEmitter,
		Uri: MockUri,
		TreeItem: MockTreeItem,
		ThemeIcon: MockThemeIcon,
		ThemeColor: MockThemeColor,
		MarkdownString: MockMarkdownString,
		Range: MockRange,
		Position: MockPosition,
		CodeLens: MockCodeLens,
	};
});
