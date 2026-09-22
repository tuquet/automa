import { describe, expect, it } from "vitest";
import {
	createCategoryItem,
	createCredentialItem,
	createErrorItem,
	createInfoItem,
	createTableItem,
	createVariableItem,
} from "../../../core/services/storage/StorageItemPresenter";

describe("StorageItemPresenter", () => {
	it("should create a category item with correct properties", () => {
		const item = createCategoryItem("Secrets", "lock", "Category-Secrets");
		expect(item.label).toBe("Secrets");
		expect(item.contextValue).toBe("Category-Secrets");
		expect(item.type).toBe("Category");
	});

	it("should create info and error items", () => {
		const info = createInfoItem("No tables found");
		expect(info.label).toBe("No tables found");
		expect(info.type).toBe("Info");

		const error = createErrorItem("Database unreachable");
		expect(error.label).toBe("Database unreachable");
		expect(error.type).toBe("Error");
	});

	it("should create variable item with formatted value and tooltip", () => {
		const item = createVariableItem({
			id: "var_1",
			name: "apiKey",
			key: "apiKey",
			value: { val: "secret_123" },
		});
		expect(item.label).toBe("apiKey");
		expect(item.type).toBe("Variable");
		expect(item.description).toBe('= {"val":"secret_123"}');
		expect(item.itemId).toBe("var_1");
		expect(item.tooltip).toBeDefined();
	});

	it("should create credential item with encrypted badge", () => {
		const item = createCredentialItem({
			id: "cred_1",
			name: "masterToken",
			key: "masterToken",
			value: "ciphertext...",
		});
		expect(item.label).toBe("masterToken");
		expect(item.type).toBe("Credential");
		expect(item.description).toBe("Encrypted");
		expect(item.itemId).toBe("cred_1");
		expect(item.tooltip).toBeDefined();
	});

	it("should create table item with openTable command", () => {
		const item = createTableItem({
			id: "tbl_1",
			name: "users",
		});
		expect(item.label).toBe("users");
		expect(item.type).toBe("Table");
		expect(item.description).toBe("ID: tbl_1");
		expect(item.command?.command).toBe("automa.openTable");
	});
});
