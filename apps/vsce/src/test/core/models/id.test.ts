import { describe, expect, it } from "vitest";
import {
	BrowserId,
	CampaignId,
	CredentialKey,
	JobId,
	TableId,
	VariableKey,
	WorkflowId,
} from "../../../core/models/id";

describe("Domain ID Value Objects", () => {
	describe("WorkflowId", () => {
		it("when valid string provided, creates branded WorkflowId", () => {
			// Arrange
			const raw = "my-workflow";

			// Act
			const id = WorkflowId.create(raw);

			// Assert
			expect(id).toBe("my-workflow");
		});

		it("when empty string provided, throws validation error", () => {
			// Arrange
			const raw = "   ";

			// Act & Assert
			expect(() => WorkflowId.create(raw)).toThrow(
				"WorkflowId cannot be empty",
			);
		});

		it("when file path provided, extracts clean WorkflowId", () => {
			// Arrange
			const filePath = "/path/to/automation.workflow.json";

			// Act
			const id = WorkflowId.fromPath(filePath);

			// Assert
			expect(id).toBe("automation");
		});
	});

	describe("BrowserId", () => {
		it("when valid string provided, normalizes to lowercase and valid characters", () => {
			// Arrange
			const raw = "Chrome Worker #1";

			// Act
			const id = BrowserId.create(raw);

			// Assert
			expect(id).toBe("chrome_worker__1");
		});

		it("when empty string provided, throws validation error", () => {
			// Arrange
			const raw = "  ";

			// Act & Assert
			expect(() => BrowserId.create(raw)).toThrow("BrowserId cannot be empty");
		});
	});

	describe("JobId", () => {
		it("when generate called, produces prefixed timestamp JobId", () => {
			// Arrange & Act
			const id = JobId.generate();

			// Assert
			expect(id).toMatch(/^job_\d+$/);
		});

		it("when empty string provided, throws validation error", () => {
			// Arrange
			const raw = "";

			// Act & Assert
			expect(() => JobId.create(raw)).toThrow("JobId cannot be empty");
		});
	});

	describe("CampaignId", () => {
		it("when file path provided, extracts clean CampaignId", () => {
			// Arrange
			const filePath = "c:\\campaigns\\daily-run.campaign.json";

			// Act
			const id = CampaignId.fromPath(filePath);

			// Assert
			expect(id).toBe("daily-run");
		});
	});

	describe("TableId, VariableKey, CredentialKey", () => {
		it("when valid strings provided, creates branded instances", () => {
			// Arrange & Act
			const tableId = TableId.create("users_table");
			const varKey = VariableKey.create("API_URL");
			const credKey = CredentialKey.create("SECRET_TOKEN");

			// Assert
			expect(tableId).toBe("users_table");
			expect(varKey).toBe("API_URL");
			expect(credKey).toBe("SECRET_TOKEN");
		});
	});
});
