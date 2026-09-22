import { describe, expect, it } from "vitest";
import type {
	CampaignStorageItem,
	WorkflowStorageItem,
} from "../../../core/api/client";
import {
	buildFileItemDescription,
	buildFileItemTooltip,
	getFileItemIcon,
} from "../../../core/services/explorer/FileItemPresenter";
import {
	extractNamespace,
	extractNodesCount,
	parseCampaignElement,
	parseWorkflowElement,
} from "../../../core/services/explorer/FileMetadataParser";
import type { TreeElement } from "../../../providers/AutomaFilesProvider";

describe("FileMetadataParser", () => {
	describe("extractNamespace", () => {
		it("should extract bracketed namespace from name", () => {
			expect(extractNamespace("[my-org] workflow-a")).toBe("my-org");
			expect(extractNamespace("[google.com/fleets] campaign-1")).toBe(
				"google.com/fleets",
			);
		});

		it("should extract namespace from data.namespace if not in name", () => {
			expect(extractNamespace("workflow-a", { namespace: "custom-ns" })).toBe(
				"custom-ns",
			);
		});

		it("should return undefined if no namespace found", () => {
			expect(extractNamespace("regular-workflow")).toBeUndefined();
		});
	});

	describe("extractNodesCount", () => {
		it("should extract count from nodes array", () => {
			expect(extractNodesCount({ nodes: [1, 2, 3] })).toBe(3);
		});

		it("should extract count from drawflow nodes array", () => {
			expect(extractNodesCount({ drawflow: { nodes: [1, 2] } })).toBe(2);
		});

		it("should extract count from drawflow nodes object map", () => {
			expect(
				extractNodesCount({
					drawflow: { nodes: { n1: {}, n2: {}, n3: {}, n4: {} } },
				}),
			).toBe(4);
		});

		it("should return undefined if no nodes present", () => {
			expect(extractNodesCount({})).toBeUndefined();
		});
	});

	describe("parseCampaignElement", () => {
		it("should parse campaign storage item into TreeElement", () => {
			const item: CampaignStorageItem = {
				id: "camp_123",
				name: "[production] Daily Scrape",
				description: "Scrapes daily target",
				version: "1.2.0",
				cron: "0 9 * * *",
				createdAt: "2026-09-07T00:00:00Z",
				updatedAt: "2026-09-07T00:00:00Z",
				data: {
					browsers: ["b1", "b2"],
					settings: {
						concurrency_mode: "sequential",
					},
				},
			};

			const el = parseCampaignElement(item);
			expect(el.id).toBe("camp_123");
			expect(el.namespace).toBe("production");
			expect(el.metadata?.browsersCount).toBe(2);
			expect(el.metadata?.concurrencyMode).toBe("sequential");
			expect(el.metadata?.cron).toBe("0 9 * * *");
			expect(el.metadata?.version).toBe("1.2.0");
		});
	});

	describe("parseWorkflowElement", () => {
		it("should parse workflow storage item into TreeElement", () => {
			const item: WorkflowStorageItem = {
				id: "wf_456",
				name: "[ecommerce] Checkout Bot",
				description: "Automated checkout",
				version: "2.0.1",
				createdAt: "2026-09-07T00:00:00Z",
				updatedAt: "2026-09-07T00:00:00Z",
				data: {
					nodes: [{ id: "n1" }, { id: "n2" }],
					settings: { asBlock: false },
				},
			};

			const el = parseWorkflowElement(item);
			expect(el.id).toBe("wf_456");
			expect(el.namespace).toBe("ecommerce");
			expect(el.metadata?.nodesCount).toBe(2);
			expect(el.metadata?.isPackage).toBe(false);
		});

		it("should detect package workflow by name or settings", () => {
			const pkgItem: WorkflowStorageItem = {
				id: "wf_pkg",
				name: "utility.package",
				version: "1.0.0",
				createdAt: "2026-09-07T00:00:00Z",
				updatedAt: "2026-09-07T00:00:00Z",
				data: {
					inputs: ["arg1"],
					outputs: ["res1"],
				},
			};

			const el = parseWorkflowElement(pkgItem);
			expect(el.metadata?.isPackage).toBe(true);
		});
	});
});

describe("FileItemPresenter", () => {
	it("should determine appropriate icon for folder, campaign, package, and workflow", () => {
		const folderEl: TreeElement = {
			isFolder: true,
			name: "Folder",
			path: "f1",
		};
		expect(getFileItemIcon(folderEl, "workflow")).toBe("folder");

		const campaignEl: TreeElement = {
			isFolder: false,
			name: "Camp",
			path: "c1",
		};
		expect(getFileItemIcon(campaignEl, "campaign")).toBe("rocket");

		const pkgEl: TreeElement = {
			isFolder: false,
			name: "Pkg",
			path: "p1",
			metadata: { isPackage: true },
		};
		expect(getFileItemIcon(pkgEl, "workflow")).toBe("package");

		const wfEl: TreeElement = {
			isFolder: false,
			name: "Wf",
			path: "w1",
		};
		expect(getFileItemIcon(wfEl, "workflow")).toBe("play-circle");
	});

	it("should build description string with namespace, version, and blocks", () => {
		const el: TreeElement = {
			isFolder: false,
			name: "Wf",
			path: "w1",
			namespace: "sales",
			metadata: {
				version: "1.0.0",
				nodesCount: 5,
			},
		};

		const desc = buildFileItemDescription(el, "workflow");
		expect(desc).toContain("[sales]");
		expect(desc).toContain("v1.0.0");
		expect(desc).toContain("5 blocks");
	});

	it("should build markdown tooltip with metadata details", () => {
		const el: TreeElement = {
			isFolder: false,
			name: "Camp",
			path: "c1",
			id: "c1",
			namespace: "ops",
			metadata: {
				displayName: "Ops Campaign",
				description: "Runs operations",
				version: "1.1.0",
				browsersCount: 3,
				concurrencyMode: "parallel",
				cron: "0 * * * *",
			},
		};

		const tooltip = buildFileItemTooltip(el, "campaign");
		expect(tooltip.value).toContain("### 🚀 **Ops Campaign**");
		expect(tooltip.value).toContain("*Runs operations*");
		expect(tooltip.value).toContain("- **ID**: `c1`");
		expect(tooltip.value).toContain("- **Namespace**: `ops`");
		expect(tooltip.value).toContain("- **Browsers**: `3`");
		expect(tooltip.value).toContain("- **Execution Mode**: `parallel`");
		expect(tooltip.value).toContain("- **Schedule (Cron)**: `0 * * * *`");
	});
});
