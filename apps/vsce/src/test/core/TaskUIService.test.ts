import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import { TaskUIService } from "../../core/ui/TaskUIService";

describe("TaskUIService", () => {
	let service: TaskUIService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new TaskUIService();
	});

	afterEach(() => {
		service.disposeStatusBar();
		vi.restoreAllMocks();
	});

	it("should show start message", () => {
		service.showStartMessage("Starting workflow...");
		expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
			"Starting workflow...",
		);
	});

	it("should show success message", () => {
		service.showSuccessMessage("Workflow succeeded!");
		expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
			"Workflow succeeded!",
		);
	});

	it("should show error message with prefix", () => {
		service.showErrorMessage("Workflow Error", "Something went wrong");
		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
			"Workflow Error: Something went wrong",
		);
	});

	it("should show error message without prefix", () => {
		service.showErrorMessage(undefined, "Direct error");
		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith("Direct error");
	});

	it("should initialize and update status bar item", () => {
		const mockStatusBarItem = {
			text: "",
			tooltip: "",
			command: "",
			show: vi.fn(),
			hide: vi.fn(),
			dispose: vi.fn(),
		} as unknown as vscode.StatusBarItem;
		vi.mocked(vscode.window.createStatusBarItem).mockReturnValue(
			mockStatusBarItem,
		);

		service.initStatusBar("Running Test");
		expect(vscode.window.createStatusBarItem).toHaveBeenCalledWith(
			vscode.StatusBarAlignment.Right,
			100,
		);
		expect(mockStatusBarItem.text).toBe("$(sync~spin) Running Test");
		expect(mockStatusBarItem.show).toHaveBeenCalled();

		// Test update status bar (normal length)
		service.updateStatusBar("Step 1", "Navigating to URL");
		expect(mockStatusBarItem.text).toBe(
			"$(sync~spin) Step 1: Navigating to URL",
		);

		// Test update status bar (long message truncated to 40 chars)
		service.updateStatusBar(
			"Step 2",
			"This is an extremely long log message that definitely exceeds forty characters in total length",
		);
		expect(mockStatusBarItem.text).toContain("...");

		// Test disposal
		service.disposeStatusBar();
		expect(mockStatusBarItem.hide).toHaveBeenCalled();
		expect(mockStatusBarItem.dispose).toHaveBeenCalled();
	});

	it("should strip ANSI color codes properly", () => {
		const raw = "\u001b[32mSuccess\u001b[0m and \u001b[31mError\u001b[0m";
		const cleaned = TaskUIService.stripAnsi(raw);
		expect(cleaned).toBe("Success and Error");
		expect(TaskUIService.stripAnsi("")).toBe("");
	});
});
