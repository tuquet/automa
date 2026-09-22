/**
 * Utility for formatting API errors, response payloads, and exceptions into user-friendly strings.
 * Guarantees that errors never display as "[object Object]".
 */

export function formatApiError(err: unknown): string {
	if (err === null || err === undefined) {
		return "Unknown error";
	}

	if (typeof err === "string") {
		const trimmed = err.trim();
		return trimmed.length > 0 ? trimmed : "Unknown error";
	}

	if (err instanceof Error) {
		return err.message;
	}

	if (typeof err === "object") {
		const obj = err as Record<string, unknown>;

		if (typeof obj.message === "string" && obj.message.trim().length > 0) {
			return obj.message;
		}

		if (typeof obj.error === "string" && obj.error.trim().length > 0) {
			return obj.error;
		}

		if (typeof obj.detail === "string" && obj.detail.trim().length > 0) {
			return obj.detail;
		}

		if (obj.details && typeof obj.details === "object") {
			try {
				return JSON.stringify(obj.details);
			} catch {
				// Fallthrough
			}
		}

		try {
			return JSON.stringify(err);
		} catch {
			return String(err);
		}
	}

	return String(err);
}
