import * as child_process from "node:child_process";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DaemonService } from "../../core/daemon/DaemonService";

// Setup global fake timers for all tests in this file

vi.mock("node:child_process", () => {
	return {
		spawn: vi.fn(),
	};
});

vi.mock("../../core/daemon/CoreBinaryManager", () => {
	return {
		CoreBinaryManager: {
			ensureBinaryExists: vi.fn().mockResolvedValue("/path/to/binary"),
		},
	};
});

vi.mock("../../core/daemon/GlobalSseListener", () => {
	return {
		globalEvents: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
		startGlobalSseListener: vi.fn(),
		stopGlobalSseListener: vi.fn(),
	};
});

vi.mock("../../core/api/client", () => {
	return {
		health: vi.fn(),
	};
});

vi.mock("@hey-api/client-fetch", () => {
	return {
		createClient: vi.fn().mockReturnValue({}),
	};
});

describe("DaemonService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		DaemonService.stop(); // reset state
	});

	it("should start external daemon if health check passes", async () => {
		vi.spyOn(
			DaemonService as unknown as { checkHealth: () => Promise<boolean> },
			"checkHealth",
		).mockResolvedValue(true);

		await DaemonService.start();

		expect(DaemonService.isRunning()).toBe(true);
		expect(child_process.spawn).not.toHaveBeenCalled();
	});

	it("should spawn daemon if health check fails initially", async () => {
		let checkCount = 0;
		vi.spyOn(
			DaemonService as unknown as { checkHealth: () => Promise<boolean> },
			"checkHealth",
		).mockImplementation(() => {
			checkCount++;
			return Promise.resolve(checkCount > 1);
		});

		const mockProcess = {
			on: vi.fn(),
			stdout: { on: vi.fn() },
			stderr: { on: vi.fn() },
			kill: vi.fn(),
		} as unknown as child_process.ChildProcess;
		vi.mocked(child_process.spawn).mockReturnValue(mockProcess);

		await DaemonService.start();

		expect(child_process.spawn).toHaveBeenCalledWith(
			"/path/to/binary",
			["serve", "--port", "8765"],
			expect.any(Object),
		);
		expect(DaemonService.isRunning()).toBe(true);
	}, 15000);

	it("should throw error if daemon fails to become healthy after spawning", async () => {
		vi.spyOn(
			DaemonService as unknown as { checkHealth: () => Promise<boolean> },
			"checkHealth",
		).mockResolvedValue(false);
		const mockProcess = {
			on: vi.fn(),
			stdout: { on: vi.fn() },
			stderr: { on: vi.fn() },
			kill: vi.fn(),
		} as unknown as child_process.ChildProcess;
		vi.mocked(child_process.spawn).mockReturnValue(mockProcess);

		await expect(DaemonService.start()).rejects.toThrow(
			/Rust Daemon did not respond/,
		);
	}, 15000);
});
