import { beforeEach, describe, expect, it, vi } from "vitest";
import * as client from "../../core/api/client";
import { globalEvents } from "../../core/daemon/GlobalSseListener";
import { TaskRunner } from "../../core/TaskRunner";
import type { TaskUIService } from "../../core/ui/TaskUIService";

vi.mock("../../core/api/client", () => {
	return {
		submitJob: vi.fn(),
		killJob: vi.fn().mockResolvedValue({ data: { success: true } }),
	};
});

vi.mock("../../core/daemon/DaemonService", () => {
	return {
		DaemonService: {
			isRunning: vi.fn().mockReturnValue(true),
			start: vi.fn().mockResolvedValue(undefined),
			getPort: vi.fn().mockReturnValue(8765),
		},
	};
});

vi.mock("../../core/Logger", () => {
	return {
		Logger: {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			getOutputChannel: vi.fn().mockReturnValue({ show: vi.fn() }),
		},
	};
});

describe("TaskRunner", () => {
	let mockUiService: TaskUIService;

	beforeEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();

		mockUiService = {
			showStartMessage: vi.fn(),
			initStatusBar: vi.fn(),
			disposeStatusBar: vi.fn(),
			updateStatusBar: vi.fn(),
			showSuccessMessage: vi.fn(),
		} as unknown as TaskUIService;
	});

	it("should submit job and listen to logs successfully", async () => {
		vi.mocked(client.submitJob).mockResolvedValue({
			data: { jobId: "job-123" },
		} as unknown as Awaited<ReturnType<typeof client.submitJob>>);

		const options = {
			id: "test-task",
			name: "Test Task",
			startMessage: "Starting test",
			successMessage: "Finished test",
		};

		// Mock listenJobLogs to resolve immediately or simulate events
		const listenJobLogsSpy = vi
			.spyOn(TaskRunner, "listenJobLogs")
			.mockResolvedValue(undefined);

		await TaskRunner.submitJob(
			{ workflowPath: "/path/to/wf" },
			options,
			mockUiService,
		);

		expect(client.submitJob).toHaveBeenCalledWith({
			baseUrl: "http://127.0.0.1:8765",
			body: { workflowPath: "/path/to/wf" },
		});

		expect(mockUiService.showStartMessage).toHaveBeenCalledWith(
			"Starting test",
		);
		expect(listenJobLogsSpy).toHaveBeenCalledWith(
			8765,
			"job-123",
			options,
			mockUiService,
			expect.any(Object), // progress
			expect.any(Object), // token
		);
	});

	it("should handle listenJobLogs and receive completed event", async () => {
		const options = { id: "test", name: "test", successMessage: "Yay" };
		const progress = { report: vi.fn() };
		const token = {
			isCancellationRequested: false,
			onCancellationRequested: vi.fn().mockReturnValue({ dispose: vi.fn() }),
		} as unknown as import("vscode").CancellationToken;

		const listenPromise = TaskRunner.listenJobLogs(
			8765,
			"job-1",
			options,
			mockUiService,
			progress,
			token,
		);

		// Let event listeners register
		await new Promise((r) => setTimeout(r, 10));

		globalEvents.emit("job_status_changed", {
			type: "job_status_changed",
			jobId: "job-1",
			status: "completed",
		});

		await listenPromise;

		expect(mockUiService.showSuccessMessage).toHaveBeenCalledWith("Yay");
	});

	it("should handle logs during listenJobLogs", async () => {
		const options = { id: "test", name: "test", statusBarText: "Running" };
		const progress = { report: vi.fn() };
		const token = {
			isCancellationRequested: false,
			onCancellationRequested: vi.fn().mockReturnValue({ dispose: vi.fn() }),
		} as unknown as import("vscode").CancellationToken;

		const listenPromise = TaskRunner.listenJobLogs(
			8765,
			"job-2",
			options,
			mockUiService,
			progress,
			token,
		);

		// Let event listeners register
		await new Promise((r) => setTimeout(r, 10));

		globalEvents.emit("log", {
			type: "log",
			jobId: "job-2",
			data: "Some log message",
		});

		globalEvents.emit("workflow_finished", {
			type: "workflow_finished",
			jobId: "job-2",
		});

		await listenPromise;

		expect(progress.report).toHaveBeenCalledWith({
			message: "Some log message",
		});
	});

	it("should call killJob when cancellation is requested by user", async () => {
		const options = { id: "test", name: "test" };
		const progress = { report: vi.fn() };
		let cancelHandler: (() => Promise<void>) | undefined;
		const token = {
			isCancellationRequested: false,
			onCancellationRequested: vi.fn((cb) => {
				cancelHandler = cb;
				return { dispose: vi.fn() };
			}),
		} as unknown as import("vscode").CancellationToken;

		const listenPromise = TaskRunner.listenJobLogs(
			8765,
			"job-cancel-test",
			options,
			mockUiService,
			progress,
			token,
		);

		// Trigger cancellation
		expect(cancelHandler).toBeDefined();
		if (cancelHandler) {
			await cancelHandler();
		}

		await listenPromise;

		expect(client.killJob).toHaveBeenCalledWith({
			baseUrl: "http://127.0.0.1:8765",
			path: { job_id: "job-cancel-test" },
		});
	});
});
