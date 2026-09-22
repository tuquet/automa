import { beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import { VsCodeWindowAdapter } from "../../../core/adapters/VsCodeWindowAdapter";
import { VsCodeWorkspaceAdapter } from "../../../core/adapters/VsCodeWorkspaceAdapter";

describe("VS Code Port Adapters", () => {
	let windowAdapter: VsCodeWindowAdapter;
	let workspaceAdapter: VsCodeWorkspaceAdapter;

	beforeEach(() => {
		vi.clearAllMocks();
		windowAdapter = new VsCodeWindowAdapter();
		workspaceAdapter = new VsCodeWorkspaceAdapter();
	});

	describe("VsCodeWindowAdapter", () => {
		it("when showInformation is called, delegates to vscode.window.showInformationMessage", async () => {
			// Arrange
			vi.mocked(vscode.window.showInformationMessage).mockResolvedValue(
				"OK" as never,
			);

			// Act
			const result = await windowAdapter.showInformation("Hello World", "OK");

			// Assert
			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
				"Hello World",
				"OK",
			);
			expect(result).toBe("OK");
		});

		it("when showWarning is called with string option, delegates to vscode.window.showWarningMessage", async () => {
			// Arrange
			vi.mocked(vscode.window.showWarningMessage).mockResolvedValue(
				"Proceed" as never,
			);

			// Act
			const result = await windowAdapter.showWarning(
				"Warning message",
				"Proceed",
			);

			// Assert
			expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
				"Warning message",
				"Proceed",
			);
			expect(result).toBe("Proceed");
		});

		it("when showError is called with message, delegates to vscode.window.showErrorMessage", async () => {
			// Arrange
			vi.mocked(vscode.window.showErrorMessage).mockResolvedValue(
				undefined as never,
			);

			// Act
			await windowAdapter.showError("Critical failure");

			// Assert
			expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
				"Critical failure",
			);
		});

		it("when showQuickPick is called, delegates to vscode.window.showQuickPick", async () => {
			// Arrange
			const items = [{ label: "Choice A" }];
			vi.mocked(vscode.window.showQuickPick).mockResolvedValue(
				items[0] as never,
			);

			// Act
			const selected = await windowAdapter.showQuickPick(items);

			// Assert
			expect(vscode.window.showQuickPick).toHaveBeenCalledWith(
				items,
				undefined,
				undefined,
			);
			expect(selected).toEqual(items[0]);
		});
	});

	describe("VsCodeWorkspaceAdapter", () => {
		it("when getConfiguration is called, delegates to vscode.workspace.getConfiguration", () => {
			// Arrange
			const mockConfig = {
				get: vi.fn(),
			} as unknown as vscode.WorkspaceConfiguration;
			vi.mocked(vscode.workspace.getConfiguration).mockReturnValue(mockConfig);

			// Act
			const config = workspaceAdapter.getConfiguration("automa");

			// Assert
			expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith(
				"automa",
				undefined,
			);
			expect(config).toBe(mockConfig);
		});
	});
});
