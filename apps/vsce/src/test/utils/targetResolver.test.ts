import * as fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import { resolveTarget } from "../../utils/targetResolver";

vi.mock("node:fs", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:fs")>();
	return {
		...actual,
		accessSync: vi.fn(),
	};
});

describe("resolveTarget", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(fs.accessSync).mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should resolve target from vscode.Uri", async () => {
		const uri = vscode.Uri.file("/workspace/flow.json");
		const result = await resolveTarget(uri, ".json");

		expect(result).toEqual({
			targetPath: "/workspace/flow.json",
			displayName: "flow.json",
		});
	});

	it("should resolve target from object with fsPath", async () => {
		const node = { fsPath: "/workspace/flow.workflow.json" };
		const result = await resolveTarget(node, ".workflow.json");

		expect(result).toEqual({
			targetPath: "/workspace/flow.workflow.json",
			displayName: "flow.workflow.json",
		});
	});

	it("should resolve target from object with fullPath and label", async () => {
		const node = { fullPath: "/workspace/campaign.json", label: "My Campaign" };
		const result = await resolveTarget(node, ".json");

		expect(result).toEqual({
			targetPath: "/workspace/campaign.json",
			displayName: "My Campaign",
		});
	});

	it("should resolve target from object with resourceUri", async () => {
		const node = {
			resourceUri: vscode.Uri.file("/workspace/test.json"),
		};
		const result = await resolveTarget(node, ".json");

		expect(result).toEqual({
			targetPath: "/workspace/test.json",
			displayName: "test.json",
		});
	});

	it("should fallback to active editor if document matches extension", async () => {
		(
			vscode.window as unknown as { activeTextEditor?: vscode.TextEditor }
		).activeTextEditor = {
			document: { uri: vscode.Uri.file("/workspace/active.json") },
		} as unknown as vscode.TextEditor;

		const result = await resolveTarget(undefined, ".json");
		expect(result).toEqual({
			targetPath: "/workspace/active.json",
			displayName: "active.json",
		});

		(
			vscode.window as unknown as { activeTextEditor?: vscode.TextEditor }
		).activeTextEditor = undefined;
	});

	it("should fallback to showOpenDialog if no active editor", async () => {
		vi.mocked(vscode.window.showOpenDialog).mockResolvedValue([
			vscode.Uri.file("/workspace/selected.json"),
		]);

		const result = await resolveTarget(undefined, ".json", "Select File");
		expect(result).toEqual({
			targetPath: "/workspace/selected.json",
			displayName: "selected.json",
		});
	});

	it("should return null if showOpenDialog is cancelled", async () => {
		vi.mocked(vscode.window.showOpenDialog).mockResolvedValue(undefined);

		const result = await resolveTarget(undefined, ".json");
		expect(result).toBeNull();
	});

	it("should return null and show error if file extension does not match", async () => {
		const uri = vscode.Uri.file("/workspace/invalid.txt");
		const result = await resolveTarget(uri, ".json");

		expect(result).toBeNull();
		expect(vscode.window.showErrorMessage).toHaveBeenCalled();
	});

	it("should return null and show error if fs.accessSync throws", async () => {
		vi.mocked(fs.accessSync).mockImplementation(() => {
			throw new Error("EACCES: permission denied");
		});

		const uri = vscode.Uri.file("/workspace/unreadable.json");
		const result = await resolveTarget(uri, ".json");

		expect(result).toBeNull();
		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
			expect.stringContaining("Failed to access file"),
		);
	});
});

describe("resolveEntityTarget", () => {
	it("should return null for null or undefined input", async () => {
		const { resolveEntityTarget } = await import("../../utils/targetResolver");
		expect(resolveEntityTarget(null)).toBeNull();
		expect(resolveEntityTarget(undefined)).toBeNull();
	});

	it("should resolve from string id", async () => {
		const { resolveEntityTarget } = await import("../../utils/targetResolver");
		const target = resolveEntityTarget("my_entity_id");
		expect(target).toEqual({
			id: "my_entity_id",
			name: "my_entity_id",
		});
	});

	it("should resolve from file URI", async () => {
		const { resolveEntityTarget } = await import("../../utils/targetResolver");
		const uri = vscode.Uri.file("/workspace/google_search.workflow.json");
		const target = resolveEntityTarget(uri);
		expect(target).toEqual({
			id: "google_search",
			name: "google_search.workflow.json",
			uri,
			targetPath: uri.fsPath,
		});
	});

	it("should resolve from automa-db URI", async () => {
		const { resolveEntityTarget } = await import("../../utils/targetResolver");
		const uri = vscode.Uri.parse(
			"automa-db:/workflows/wf_test123/search.workflow.json",
		);
		const target = resolveEntityTarget(uri);
		expect(target).toEqual({
			id: "wf_test123",
			name: "wf_test123",
			uri,
		});
	});

	it("should resolve from tree item element with rawData", async () => {
		const { resolveEntityTarget } = await import("../../utils/targetResolver");
		const treeItem = {
			element: {
				id: "wf_elem",
				name: "Element Workflow",
				rawData: { nodes: [] },
			},
		};
		const target = resolveEntityTarget(treeItem);
		expect(target).toEqual({
			id: "wf_elem",
			name: "Element Workflow",
			rawData: { nodes: [] },
		});
	});

	it("should resolve from tree item with metadata displayName and id", async () => {
		const { resolveEntityTarget } = await import("../../utils/targetResolver");
		const treeItem = {
			element: {
				metadata: {
					id: "meta_id",
					displayName: "Display Name",
				},
			},
		};
		const target = resolveEntityTarget(treeItem);
		expect(target).toEqual({
			id: "meta_id",
			name: "Display Name",
		});
	});

	it("should resolve from resourceUri with automa-db scheme", async () => {
		const { resolveEntityTarget } = await import("../../utils/targetResolver");
		const uri = vscode.Uri.parse(
			"automa-db:/campaigns/cp_matrix99/camp.campaign.json",
		);
		const treeItem = { resourceUri: uri };
		const target = resolveEntityTarget(treeItem);
		expect(target).toEqual({
			id: "cp_matrix99",
			name: "cp_matrix99",
			uri,
		});
	});
});
