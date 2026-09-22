import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createStorageCampaign,
	createStorageWorkflow,
	deleteStorageWorkflow,
	getStorageCampaign,
	getStorageWorkflow,
	updateStorageCampaign,
	updateStorageWorkflow,
} from "../../core/api/client";
import { AutomaDbFileSystemProvider } from "../../core/services/AutomaDbFileSystemProvider";

vi.mock("../../core/api/client", () => ({
	getStorageWorkflow: vi.fn(),
	getStorageWorkflows: vi.fn(),
	updateStorageWorkflow: vi.fn(),
	createStorageWorkflow: vi.fn(),
	deleteStorageWorkflow: vi.fn(),
	getStorageCampaign: vi.fn(),
	getStorageCampaigns: vi.fn(),
	updateStorageCampaign: vi.fn(),
	createStorageCampaign: vi.fn(),
	deleteStorageCampaign: vi.fn(),
}));

vi.mock("../../core/daemon/DaemonService", () => ({
	DaemonService: {
		isRunning: vi.fn().mockReturnValue(true),
		start: vi.fn().mockResolvedValue(undefined),
	},
}));

describe("AutomaDbFileSystemProvider", () => {
	let provider: AutomaDbFileSystemProvider;

	beforeEach(() => {
		vi.clearAllMocks();
		provider = new AutomaDbFileSystemProvider();
	});

	it("should create valid workflow and campaign URIs", () => {
		const wfUri = AutomaDbFileSystemProvider.createWorkflowUri(
			"wf_1",
			"Test Workflow",
		);
		expect(wfUri.scheme).toBe("automa-db");
		expect(wfUri.path).toBe("/workflows/wf_1/test_workflow.workflow.json");

		const cUri = AutomaDbFileSystemProvider.createCampaignUri(
			"c_1",
			"Fleet Campaign",
		);
		expect(cUri.scheme).toBe("automa-db");
		expect(cUri.path).toBe("/campaigns/c_1/fleet_campaign.campaign.json");
	});

	it("should read workflow content from storage API", async () => {
		const mockData = { id: "wf_1", name: "Test Workflow", drawflow: {} };
		vi.mocked(getStorageWorkflow).mockResolvedValue({
			data: { id: "wf_1", name: "Test Workflow", data: mockData },
		} as never);

		const uri = AutomaDbFileSystemProvider.createWorkflowUri("wf_1", "Test");
		const bytes = await provider.readFile(uri);
		const parsed = JSON.parse(Buffer.from(bytes).toString("utf8"));

		expect(getStorageWorkflow).toHaveBeenCalledWith({ path: { id: "wf_1" } });
		expect(parsed.id).toBe("wf_1");
		expect(parsed.name).toBe("Test Workflow");
	});

	it("should write workflow content to storage API", async () => {
		const mockData = { id: "wf_1", name: "Updated Workflow", drawflow: {} };
		vi.mocked(updateStorageWorkflow).mockResolvedValue({
			data: { id: "wf_1", name: "Updated Workflow" },
		} as never);

		const uri = AutomaDbFileSystemProvider.createWorkflowUri("wf_1", "Updated");
		const content = Buffer.from(JSON.stringify(mockData), "utf8");

		await provider.writeFile(uri, content, { create: false, overwrite: true });

		expect(updateStorageWorkflow).toHaveBeenCalledWith({
			path: { id: "wf_1" },
			body: {
				name: "Updated Workflow",
				description: undefined,
				data: mockData,
			},
		});
	});

	it("should delete workflow via storage API", async () => {
		vi.mocked(deleteStorageWorkflow).mockResolvedValue({} as never);

		const uri = AutomaDbFileSystemProvider.createWorkflowUri(
			"wf_1",
			"DeleteMe",
		);
		await provider.delete(uri, { recursive: false });

		expect(deleteStorageWorkflow).toHaveBeenCalledWith({
			path: { id: "wf_1" },
		});
	});

	it("should read campaign content from storage API", async () => {
		const mockData = { id: "c_1", name: "Fleet Campaign", tasks: [] };
		vi.mocked(getStorageCampaign).mockResolvedValue({
			data: { id: "c_1", name: "Fleet Campaign", data: mockData },
		} as never);

		const uri = AutomaDbFileSystemProvider.createCampaignUri("c_1", "Fleet");
		const bytes = await provider.readFile(uri);
		const parsed = JSON.parse(Buffer.from(bytes).toString("utf8"));

		expect(getStorageCampaign).toHaveBeenCalledWith({ path: { id: "c_1" } });
		expect(parsed.id).toBe("c_1");
	});

	it("should fallback to createStorageWorkflow when updateStorageWorkflow fails", async () => {
		const mockData = { id: "wf_new", name: "New Workflow", drawflow: {} };
		vi.mocked(updateStorageWorkflow).mockResolvedValue({
			error: { status: 404, error: "Not found in database" },
		} as never);
		vi.mocked(createStorageWorkflow).mockResolvedValue({
			data: { id: "wf_new", name: "New Workflow" },
		} as never);

		const uri = AutomaDbFileSystemProvider.createWorkflowUri("wf_new", "New");
		const content = Buffer.from(JSON.stringify(mockData), "utf8");

		await provider.writeFile(uri, content, { create: true, overwrite: true });

		expect(updateStorageWorkflow).toHaveBeenCalledWith({
			path: { id: "wf_new" },
			body: {
				name: "New Workflow",
				description: undefined,
				data: mockData,
			},
		});
		expect(createStorageWorkflow).toHaveBeenCalledWith({
			body: {
				id: "wf_new",
				name: "New Workflow",
				description: undefined,
				data: mockData,
			},
		});
	});

	it("should fallback to createStorageCampaign when updateStorageCampaign fails", async () => {
		const mockData = { id: "c_new", name: "New Campaign", tasks: [] };
		vi.mocked(updateStorageCampaign).mockResolvedValue({
			error: { status: 404, error: "Not found in database" },
		} as never);
		vi.mocked(createStorageCampaign).mockResolvedValue({
			data: { id: "c_new", name: "New Campaign" },
		} as never);

		const uri = AutomaDbFileSystemProvider.createCampaignUri("c_new", "New");
		const content = Buffer.from(JSON.stringify(mockData), "utf8");

		await provider.writeFile(uri, content, { create: true, overwrite: true });

		expect(updateStorageCampaign).toHaveBeenCalledWith({
			path: { id: "c_new" },
			body: {
				name: "New Campaign",
				description: undefined,
				data: mockData,
			},
		});
		expect(createStorageCampaign).toHaveBeenCalledWith({
			body: {
				id: "c_new",
				name: "New Campaign",
				description: undefined,
				data: mockData,
				cron: undefined,
			},
		});
	});
});
