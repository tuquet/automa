import { describe, it, expect, vi } from "vitest";
import WorkflowEngine from "../src/WorkflowEngine";
import WorkflowWorker from "../src/WorkflowWorker";
import { BackwardCompatibilityFacade } from "../src/BackwardCompatibilityFacade";
import { IBrowserAdapter } from "../src/interfaces/IBrowserAdapter";
import { IEngineLoggerAdapter } from "../src/interfaces/IEngineLoggerAdapter";
import { IEngineStateAdapter } from "../src/interfaces/IEngineStateAdapter";

describe("Core Engine - Execution and Backward Compatibility", () => {
	it("should execute legacy block handlers via Facade and adapters", async () => {
		// Mock adapter simulating the browser extension environment
		const mockBrowserAdapter: IBrowserAdapter = {
			sendMessageToTab: vi.fn().mockResolvedValue("Success"),
			activeTab: { id: 101, url: "https://example.com" },
			executeScript: vi.fn().mockResolvedValue(true),
		};

		const mockLoggerAdapter: IEngineLoggerAdapter = {
			addLog: vi.fn().mockResolvedValue(undefined),
			addHistory: vi.fn().mockResolvedValue(undefined),
		};

		const mockStateAdapter: IEngineStateAdapter = {
			saveState: vi.fn().mockResolvedValue(undefined),
			getState: vi.fn().mockResolvedValue(null),
			getAllStates: vi.fn().mockResolvedValue(new Map()),
			deleteState: vi.fn().mockResolvedValue(undefined),
		};

		// Mock blocksHandler map mimicking automa-ext
		const mockBlocksHandler = {
			"activeTab": async function (this: any, blockData: any) {
				const tabId = this.activeTab.id;
				await this._sendMessageToTab({ action: "DO_SOMETHING", data: blockData });
				
				const connections = this.getBlockConnections("node_1");
				this.setVariable("testVar", 123);

				return { nextBlockId: connections ? connections[0]?.id : null, data: { tabId, var: this.getVariable("testVar") } };
			}
		};

		// Workflow data simulating a simple workflow
		const workflowData = {
			id: "wf_1",
			name: "Test Workflow",
			drawflow: {
				nodes: [
					{ id: "node_0", label: "trigger", data: {} },
					{ id: "node_1", label: "activeTab", data: { someData: true } },
					{ id: "node_2", label: "end", data: {} }
				],
				edges: [
					{ source: "node_0", target: "node_1", sourceHandle: "node_0-output-1", targetHandle: "node_1-input-1" },
					{ source: "node_1", target: "node_2", sourceHandle: "node_1-output-1", targetHandle: "node_2-input-1" }
				],
			},
			settings: {
				debugMode: false,
			}
		};

		const engine = new WorkflowEngine({
			browserAdapter: mockBrowserAdapter,
			loggerAdapter: mockLoggerAdapter,
			stateAdapter: mockStateAdapter,
			blocksHandler: mockBlocksHandler,
			workflowData: workflowData,
		});

		engine.connectionsMap = {
			"node_1-output-1": new Map([
				["node_2", { id: "node_2", targetHandle: "node_2-input-1", sourceHandle: "node_1-output-1" }]
			])
		};
		engine.referenceData = { variables: {} };
		engine.isDestroyed = false;

		const worker = new WorkflowWorker("w_1", engine, {});
		worker.activeTab = mockBrowserAdapter.activeTab;
		worker.currentBlock = workflowData.drawflow.nodes[0];
		
		const facade = new BackwardCompatibilityFacade(worker);

		// Bind the legacy handler to the Facade context
		const boundHandler = facade.bind(mockBlocksHandler["activeTab"]);

		// Execute it
		const result = await boundHandler({ someData: true });

		expect(result.data.tabId).toBe(101);
		expect(mockBrowserAdapter.sendMessageToTab).toHaveBeenCalledWith(101, expect.objectContaining({ action: "DO_SOMETHING" }));
		expect(result.nextBlockId).toBe("node_2");
		expect(result.data.var).toBe(123);
	});
});
