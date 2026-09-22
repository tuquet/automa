import { describe, expect, it } from "vitest";
import { formatApiError } from "../../utils/errorUtils";

describe("formatApiError", () => {
	it("returns 'Unknown error' for null and undefined", () => {
		expect(formatApiError(null)).toBe("Unknown error");
		expect(formatApiError(undefined)).toBe("Unknown error");
	});

	it("returns string as-is or fallback if empty", () => {
		expect(formatApiError("Database lock timeout")).toBe(
			"Database lock timeout",
		);
		expect(formatApiError("   ")).toBe("Unknown error");
	});

	it("extracts message from Error instances", () => {
		const err = new Error("Connection refused");
		expect(formatApiError(err)).toBe("Connection refused");
	});

	it("extracts message from ApiErrorResponse objects", () => {
		const apiErr = {
			message: "Campaign 'camp_1' not found in database",
			status: 404,
		};
		expect(formatApiError(apiErr)).toBe(
			"Campaign 'camp_1' not found in database",
		);
	});

	it("extracts error field if message is not present", () => {
		const apiErr = { error: "Validation failed: invalid cron expression" };
		expect(formatApiError(apiErr)).toBe(
			"Validation failed: invalid cron expression",
		);
	});

	it("extracts detail field if message and error are absent", () => {
		const apiErr = { detail: "SQLite disk I/O error" };
		expect(formatApiError(apiErr)).toBe("SQLite disk I/O error");
	});

	it("serializes generic object to JSON instead of [object Object]", () => {
		const arbitraryObj = { code: 500, flag: true };
		expect(formatApiError(arbitraryObj)).toBe(JSON.stringify(arbitraryObj));
		expect(formatApiError(arbitraryObj)).not.toBe("[object Object]");
	});
});
