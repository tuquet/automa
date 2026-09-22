import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import { runWorkflowCommand } from "../../commands/runWorkflow";
import { TaskRunner } from "../../core/TaskRunner";
import * as targetResolver from "../../utils/targetResolver";

vi.mock("../../core/TaskRunner", () => ({
	TaskRunner: {
		submitJob: vi.fn().mockResolvedValue(undefined),
		telemetryEmitter: {
			emit: vi.fn(),
			on: vi.fn(),
		},
	},
}));

vi.mock("../../core/daemon/DaemonService", () => ({
	DaemonService: {
		isRunning: vi.fn().mockReturnValue(true),
		start: vi.fn().mockResolvedValue(undefined),
		getPort: vi.fn().mockReturnValue(8765),
	},
}));

vi.mock("node:fs", () => ({
	existsSync: vi.fn().mockReturnValue(true),
	readFileSync: vi.fn((p: string) => {
		if (p.includes("search")) {
			return JSON.stringify({ id: "search", name: "Search Workflow" });
		}
		return JSON.stringify({ id: "test", name: "Test Workflow" });
	}),
}));

vi.mock("../../utils/targetResolver", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("../../utils/targetResolver")>();
	return {
		...actual,
		resolveTarget: vi.fn(),
		resolveEntityTarget: vi.fn(actual.resolveEntityTarget),
	};
});

describe("runWorkflowCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should return early if resolveTarget returns null", async () => {
		vi.mocked(targetResolver.resolveTarget).mockResolvedValue(null);

		await runWorkflowCommand();

		expect(TaskRunner.submitJob).not.toHaveBeenCalled();
	});

	it("should submit job with default options when target is resolved", async () => {
		vi.mocked(targetResolver.resolveTarget).mockResolvedValue({
			targetPath: "/workspace/search.workflow.json",
			displayName: "search.workflow.json",
		});

		vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
			get: vi.fn((key: string, defaultValue?: unknown) => {
				if (key === "run.globalVariables") return { env: "test" };
				if (key === "run.headless") return true;
				if (key === "run.debug") return false;
				if (key === "run.closeBrowserOnFinish") return true;
				if (key === "run.useDefaultParameters") return true;
				if (key === "run.defaultBrowser") return "daemon_worker";
				return defaultValue;
			}),
		} as unknown as vscode.WorkspaceConfiguration);

		await runWorkflowCommand(undefined, { customVar: "123" });

		expect(TaskRunner.submitJob).toHaveBeenCalledWith(
			expect.objectContaining({
				workflowId: "search",
				options: expect.objectContaining({
					browserId: "daemon_worker",
					headless: true,
					debug: false,
					closeBrowserOnFinish: true,
					variables: {
						env: "test",
						customVar: "123",
					},
				}),
			}),
			expect.objectContaining({
				name: "Workflow: search.workflow.json",
			}),
		);
	});

	it("should respect explicit runOptions keepBrowserOpen", async () => {
		vi.mocked(targetResolver.resolveTarget).mockResolvedValue({
			targetPath: "/workspace/test.workflow.json",
			displayName: "test.workflow.json",
		});

		vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
			get: vi.fn((key: string, defaultValue?: unknown) => {
				if (key === "run.globalVariables") return {};
				if (key === "run.defaultBrowser") return "daemon_worker";
				return defaultValue;
			}),
		} as unknown as vscode.WorkspaceConfiguration);

		await runWorkflowCommand(undefined, undefined, { keepBrowserOpen: true });

		expect(TaskRunner.submitJob).toHaveBeenCalledWith(
			expect.objectContaining({
				options: expect.objectContaining({
					closeBrowserOnFinish: false,
				}),
			}),
			expect.anything(),
		);
	});

	it("should prompt user to select browser when no default is configured", async () => {
		vi.mocked(targetResolver.resolveTarget).mockResolvedValue({
			targetPath: "/workspace/test.workflow.json",
			displayName: "test.workflow.json",
		});

		vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
			get: vi.fn((key: string, defaultValue?: unknown) => {
				if (key === "run.defaultBrowser") return undefined;
				return defaultValue;
			}),
		} as unknown as vscode.WorkspaceConfiguration);

		vi.mocked(vscode.window.showQuickPick).mockResolvedValue({
			label: "Browser 1",
			description: "browser_1",
		} as unknown as vscode.QuickPickItem);

		await runWorkflowCommand();

		expect(vscode.window.showQuickPick).toHaveBeenCalled();
		expect(TaskRunner.submitJob).toHaveBeenCalledWith(
			expect.objectContaining({
				workflowId: "test",
				options: expect.objectContaining({
					browserId: "browser_1",
				}),
			}),
			expect.anything(),
		);
	});

	it("should cancel execution if user dismisses browser selection prompt", async () => {
		vi.mocked(targetResolver.resolveTarget).mockResolvedValue({
			targetPath: "/workspace/test.workflow.json",
			displayName: "test.workflow.json",
		});

		vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
			get: vi.fn((key: string, defaultValue?: unknown) => {
				if (key === "run.defaultBrowser") return undefined;
				return defaultValue;
			}),
		} as unknown as vscode.WorkspaceConfiguration);

		vi.mocked(vscode.window.showQuickPick).mockResolvedValue(undefined);

		await runWorkflowCommand();

		expect(vscode.window.showQuickPick).toHaveBeenCalled();
		expect(TaskRunner.submitJob).not.toHaveBeenCalled();
	});
});
