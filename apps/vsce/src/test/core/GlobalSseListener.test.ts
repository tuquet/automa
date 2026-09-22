import { beforeEach, describe, expect, it, vi } from "vitest";
import * as client from "../../core/api/client";
import {
	globalEvents,
	startGlobalSseListener,
	stopGlobalSseListener,
} from "../../core/daemon/GlobalSseListener";

vi.mock("../../core/daemon/DaemonService", () => {
	return {
		DaemonService: {
			getPort: vi.fn().mockReturnValue(8765),
			isRunning: vi.fn().mockReturnValue(true),
		},
	};
});

vi.mock("../../core/api/client", () => {
	return {
		subscribeEventsSse: vi.fn(),
	};
});

// Since GlobalSseListener uses dynamic import, let's mock it using doMock
vi.doMock("../../core/api/client", () => {
	return { subscribeEventsSse: client.subscribeEventsSse };
});

vi.mock("../../core/Logger", () => {
	return {
		Logger: {
			info: vi.fn(),
			error: vi.fn(),
		},
	};
});

describe("GlobalSseListener", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		stopGlobalSseListener();
	});

	it("should start listening and process events", async () => {
		const mockStream = {
			[Symbol.asyncIterator]: async function* () {
				yield JSON.stringify({ type: "test_event", data: "test" });
				yield { data: JSON.stringify({ type: "test_event_2", data: "test2" }) };
				// Omit data to avoid JSON.parse and just use event itself
				yield { type: "test_event_3" };
			},
		};

		vi.mocked(client.subscribeEventsSse).mockResolvedValue({
			stream: mockStream,
		} as unknown as Awaited<ReturnType<typeof client.subscribeEventsSse>>);

		const listener = vi.fn();
		globalEvents.on("test_event", listener);
		globalEvents.on("test_event_2", listener);
		globalEvents.on("test_event_3", listener);

		await startGlobalSseListener();

		expect(client.subscribeEventsSse).toHaveBeenCalledWith(
			expect.objectContaining({
				baseUrl: "http://127.0.0.1:8765",
			}),
		);

		// Note: The async iterator processing is happening asynchronously.
		// wait a tick
		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(listener).toHaveBeenCalledTimes(3);
		expect(listener).toHaveBeenCalledWith({ type: "test_event", data: "test" });
		expect(listener).toHaveBeenCalledWith({
			type: "test_event_2",
			data: "test2",
		});
		expect(listener).toHaveBeenCalledWith({
			type: "test_event_3",
		});

		globalEvents.off("test_event", listener);
		globalEvents.off("test_event_2", listener);
		globalEvents.off("test_event_3", listener);
	});

	it("should not start if already listening", async () => {
		vi.mocked(client.subscribeEventsSse).mockResolvedValue({
			stream: {
				[Symbol.asyncIterator]: async function* () {
					// hang forever
					await new Promise(() => {});
				},
			},
		} as unknown as Awaited<ReturnType<typeof client.subscribeEventsSse>>);

		// Call start twice but don't await because it loops
		const _startPromise = startGlobalSseListener();
		await startGlobalSseListener();

		// wait a tick for the first call to reach subscribeEventsSse()
		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(client.subscribeEventsSse).toHaveBeenCalledTimes(1);

		stopGlobalSseListener();
	});
});
