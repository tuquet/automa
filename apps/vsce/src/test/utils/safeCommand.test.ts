import { beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import { Logger } from "../../core/Logger";
import { safeCommand } from "../../utils/safeCommand";

describe("safeCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should execute handler and return result on success", async () => {
		const handler = vi.fn().mockResolvedValue("success_data");
		const wrapped = safeCommand("Test Command", handler);

		const result = await wrapped("arg1", 42);

		expect(handler).toHaveBeenCalledWith("arg1", 42);
		expect(result).toBe("success_data");
		expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
	});

	it("should catch async errors, log via Logger, and show error toast", async () => {
		const loggerSpy = vi.spyOn(Logger, "error").mockImplementation(() => {});
		const handler = vi.fn().mockRejectedValue(new Error("Network failed"));
		const wrapped = safeCommand("Run Task", handler);

		const result = await wrapped();

		expect(result).toBeUndefined();
		expect(loggerSpy).toHaveBeenCalledWith("[Run Task] Failed: Network failed");
		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
			"Run Task failed: Network failed",
			"View Logs",
		);
	});

	it("should catch sync errors thrown inside handler", async () => {
		const loggerSpy = vi.spyOn(Logger, "error").mockImplementation(() => {});
		const handler = vi.fn().mockImplementation(() => {
			throw new Error("Synchronous crash");
		});
		const wrapped = safeCommand("Sync Task", handler);

		const result = await wrapped();

		expect(result).toBeUndefined();
		expect(loggerSpy).toHaveBeenCalledWith(
			"[Sync Task] Failed: Synchronous crash",
		);
		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
			"Sync Task failed: Synchronous crash",
			"View Logs",
		);
	});

	it("should open output channel when View Logs action is selected", async () => {
		const showSpy = vi.fn();
		vi.spyOn(Logger, "getOutputChannel").mockReturnValue({
			show: showSpy,
		} as unknown as vscode.OutputChannel);
		vi.mocked(vscode.window.showErrorMessage).mockResolvedValue(
			"View Logs" as unknown as never,
		);

		const handler = vi.fn().mockRejectedValue(new Error("Job execution error"));
		const wrapped = safeCommand("Execute Job", handler);

		await wrapped();

		expect(showSpy).toHaveBeenCalledWith(true);
	});

	it("should rethrow error if rethrow option is set to true", async () => {
		vi.spyOn(Logger, "error").mockImplementation(() => {});
		const error = new Error("Critical fatal error");
		const handler = vi.fn().mockRejectedValue(error);
		const wrapped = safeCommand("Critical Task", handler, { rethrow: true });

		await expect(wrapped()).rejects.toThrow("Critical fatal error");
		expect(vscode.window.showErrorMessage).toHaveBeenCalled();
	});

	it("should omit View Logs button if showLogsButton is set to false", async () => {
		vi.spyOn(Logger, "error").mockImplementation(() => {});
		const handler = vi.fn().mockRejectedValue(new Error("Simple error"));
		const wrapped = safeCommand("Simple Task", handler, {
			showLogsButton: false,
		});

		await wrapped();

		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
			"Simple Task failed: Simple error",
		);
	});
});
