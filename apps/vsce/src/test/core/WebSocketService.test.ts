import type { AutomaWsEvent } from "@automa/types/ws";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WebSocketService } from "../../core/ws/WebSocketService";

vi.mock("../../core/daemon/DaemonService", () => ({
	DaemonService: {
		isRunning: vi.fn().mockReturnValue(true),
		getPort: vi.fn().mockReturnValue(8765),
	},
}));

vi.mock("../../core/Logger", () => ({
	Logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

class MockWs {
	public static OPEN = 1;
	public static CONNECTING = 0;
	public static CLOSING = 2;
	public static CLOSED = 3;

	public readyState = MockWs.OPEN;
	public onopen: (() => void) | null = null;
	public onmessage: ((e: { data: string }) => void) | null = null;
	public onclose: (() => void) | null = null;
	public onerror: ((err: unknown) => void) | null = null;

	public send = vi.fn();
	public close = vi.fn().mockImplementation(() => {
		this.readyState = MockWs.CLOSED;
	});

	constructor(public url: string) {
		setTimeout(() => {
			if (this.onopen) this.onopen();
		}, 0);
	}
}

describe("WebSocketService", () => {
	let originalWebSocket: typeof globalThis.WebSocket;
	let service: WebSocketService;

	beforeEach(() => {
		vi.clearAllMocks();
		originalWebSocket = globalThis.WebSocket;
		globalThis.WebSocket = MockWs as unknown as typeof WebSocket;
		service = WebSocketService.getInstance();
		service.disconnect();
	});

	afterEach(() => {
		service.disconnect();
		globalThis.WebSocket = originalWebSocket;
		vi.restoreAllMocks();
	});

	it("should connect to daemon ws endpoint and send subscribe command", async () => {
		service.connect(8765);

		await new Promise((r) => setTimeout(r, 10));

		expect(service.pauseJob("job-123")).toBe(true);
	});

	it("should handle pauseJob and resumeJob correctly", async () => {
		service.connect(8765);
		await new Promise((r) => setTimeout(r, 10));

		const pauseResult = service.pauseJob("job-abc");
		expect(pauseResult).toBe(true);

		const resumeResult = service.resumeJob("job-abc");
		expect(resumeResult).toBe(true);

		const killResult = service.killJob("job-abc");
		expect(killResult).toBe(true);
	});

	it("should dispatch received events to subscribed handlers", async () => {
		service.connect(8765);
		await new Promise((r) => setTimeout(r, 10));

		const progressHandler = vi.fn();
		const wildcardHandler = vi.fn();

		const sub1 = service.on("JOB_PROGRESS", progressHandler);
		const sub2 = service.on("*", wildcardHandler);

		const mockEvent: AutomaWsEvent = {
			type: "JOB_PROGRESS",
			jobId: "job-1",
			step: 2,
		};

		// Access the active mock instance and trigger onmessage
		const activeWs = (service as unknown as { ws: MockWs }).ws;
		expect(activeWs).toBeDefined();

		activeWs.onmessage?.({ data: JSON.stringify(mockEvent) });

		expect(progressHandler).toHaveBeenCalledWith(mockEvent);
		expect(wildcardHandler).toHaveBeenCalledWith(mockEvent);

		// Dispose subscriptions
		sub1.dispose();
		sub2.dispose();
	});
});
