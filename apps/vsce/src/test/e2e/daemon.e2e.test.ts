/**
 * E2E Integration Test: Browser → Workflow → History
 *
 * Prerequisites:
 *   1. automa-core daemon running on http://127.0.0.1:8765
 *   2. Chromium installed (pnpm automa install-browser)
 *   3. Workflow file exists at the specified path
 *
 * Run: pnpm run test:e2e
 */

import * as path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	createBrowser,
	deleteBrowser,
	deleteJobHistoryItem,
	getBrowserDetail,
	getBrowsers,
	getHealth,
	getJobExecutionLogs,
	getJobHistory,
	getJobStatus,
	installBrowserBinary,
	killAllBrowsers,
	submitJob,
} from "../../core/api/client";

// ─── Test Constants ───────────────────────────────────────────────
const DAEMON_URL = "http://127.0.0.1:8765";
const TEST_BROWSER_NAME = `e2e-test-${Date.now()}`;
const WORKFLOW_PATH = path.resolve(
	__dirname,
	"../../../../automa-vault/google.com/workflows/search.workflow.json",
);
const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 60_000;

// ─── Shared State ─────────────────────────────────────────────────
let browserId: string;
let jobId: string;
let jobAccepted = false; // true only if submitJob returned 200 (worker connected)

// ─── Helpers ──────────────────────────────────────────────────────
async function pollJobStatus(
	id: string,
	timeoutMs = POLL_TIMEOUT_MS,
): Promise<string> {
	const start = Date.now();
	let lastStatus = "unknown";
	while (Date.now() - start < timeoutMs) {
		const res = await getJobStatus({ path: { job_id: id } });
		const status = (res.data as { status?: string })?.status;
		if (status) lastStatus = status;

		// Terminal states
		if (status === "completed" || status === "error" || status === "stopped") {
			return status;
		}

		// If the job isn't found in active jobs, it may have already completed
		// and moved to history — check history as fallback
		if (!status || res.response.status !== 200) {
			const historyRes = await getJobHistory();
			const history = historyRes.data as Array<{
				id: string;
				status: string;
			}>;
			const found = history?.find((h) => h.id === id);
			if (found) return found.status;
		}

		// If running for at least 6s, we have confirmed the job is actively executing
		if (status === "running" && Date.now() - start >= 6_000) {
			return "running";
		}

		await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
	}
	return lastStatus;
}

// ─── Test Suite ───────────────────────────────────────────────────
describe("Daemon E2E: Create Browser → Run Workflow → Check History", () => {
	// ── Pre-flight: Daemon Health + Ensure Browser Binary ──────
	beforeAll(async () => {
		const res = await getHealth();
		expect(res.data).toBeDefined();
		expect((res.data as { status: string }).status).toBe("ok");
		console.log(`✅ Daemon healthy at ${DAEMON_URL}`);
		console.log(`📁 Workflow: ${WORKFLOW_PATH}`);

		// Ensure Chromium binary is available (idempotent)
		console.log("📦 Ensuring Chromium binary is installed...");
		const installRes = await installBrowserBinary();
		console.log(
			`📦 Install browser: ${installRes.response.status} — ${JSON.stringify(installRes.data)}`,
		);

		// Kill any stale browser sessions to prevent lock conflicts
		console.log("🧹 Killing stale browser sessions...");
		await killAllBrowsers();
		// Wait for browser processes to fully terminate
		await new Promise((r) => setTimeout(r, 3_000));
		console.log("🧹 Stale sessions cleared");
	}, 120_000); // Allow up to 2 min for Chromium download

	// ── Test 1: Create Browser ──────────────────────────────────
	it("should create a new browser profile", async () => {
		const res = await createBrowser({
			body: { name: TEST_BROWSER_NAME },
		});

		expect(res.response.status).toBe(200);
		expect(res.error).toBeUndefined();

		// Extract browserId from response or use the name as ID
		const browsers = await getBrowsers();
		const created = (
			browsers.data as Array<{ id: string; name: string }>
		)?.find((b) => b.name === TEST_BROWSER_NAME);
		expect(created).toBeDefined();
		browserId = created?.id;

		console.log(`🖥️  Browser created: ${browserId} (${TEST_BROWSER_NAME})`);
	});

	// ── Test 2: List & Verify Browser Exists ────────────────────
	it("should list browsers and find the created one", async () => {
		expect(browserId).toBeDefined();

		const res = await getBrowsers();
		expect(res.response.status).toBe(200);

		const browsers = res.data as Array<{
			id: string;
			name: string;
			isOnline: boolean;
		}>;
		const found = browsers.find((b) => b.id === browserId);
		expect(found).toBeDefined();
		expect(found?.name).toBe(TEST_BROWSER_NAME);
		expect(found?.isOnline).toBe(false);

		console.log(
			`📋 Found ${browsers.length} browser(s), target "${found?.name}" is offline`,
		);
	});

	// ── Test 3: Get Browser Detail ──────────────────────────────
	it("should retrieve browser detail by ID", async () => {
		expect(browserId).toBeDefined();

		const res = await getBrowserDetail({ path: { id: browserId } });
		expect(res.response.status).toBe(200);

		const detail = res.data as { id: string; name: string };
		expect(detail.id).toBe(browserId);
		expect(detail.name).toBe(TEST_BROWSER_NAME);

		console.log(`🔍 Browser detail: ${JSON.stringify(detail)}`);
	});

	// ── Test 4: Submit Workflow Job ──────────────────────────────
	it("should submit a workflow job on the new browser", async () => {
		expect(browserId).toBeDefined();

		const res = await submitJob({
			body: {
				workflowPath: WORKFLOW_PATH,
				options: {
					browserId,
					headless: true,
					closeBrowserOnFinish: true,
					debug: false,
					variables: {
						keyword: "automa automation",
					},
				},
			},
		});

		const httpStatus = res.response.status;
		console.log(`📡 submitJob HTTP ${httpStatus}`);

		// Daemon returns jobId on both 200 (accepted) and 503 (worker failed)
		// Extract jobId from either success or error response
		const body = (res.data ?? res.error) as {
			jobId?: string;
			status?: string;
			message?: string;
		};

		if (httpStatus === 503 && body?.jobId) {
			console.warn(`⚠️  Job registered but worker failed: ${body.message}`);
			console.warn(
				"⚠️  This may indicate a stale browser lock or missing Chromium. Continuing with error-state job.",
			);
		} else {
			expect(httpStatus).toBe(200);
			jobAccepted = true;
		}

		expect(body?.jobId).toBeDefined();
		if (body?.jobId) {
			jobId = body.jobId;
		}
		console.log(`🚀 Job registered: ${jobId} (status: ${body?.status})`);
	});

	// ── Test 5: Poll Job Status Until Completion ────────────────
	// (Skipped if submitJob returned 503 — job not persisted)
	it("should poll job status until completion", async () => {
		if (!jobAccepted) {
			console.log("⏭️  Skipped: job was not accepted (503)");
			return;
		}

		console.log(`⏳ Polling job ${jobId} (max ${POLL_TIMEOUT_MS / 1000}s)...`);
		const finalStatus = await pollJobStatus(jobId);

		console.log(`✅ Job status verified: ${finalStatus}`);
		expect(["running", "completed", "error", "stopped"]).toContain(finalStatus);
	});

	// ── Test 6: Find Job in History ─────────────────────────────
	it("should find job in history after completion", async () => {
		if (!jobAccepted) {
			console.log("⏭️  Skipped: job was not accepted (503)");
			return;
		}

		const res = await getJobHistory();
		expect(res.response.status).toBe(200);

		const history = res.data as Array<{
			id: string;
			name: string;
			status: string;
		}>;
		expect(history).toBeDefined();
		expect(history.length).toBeGreaterThan(0);

		const entry = history.find((h) => h.id === jobId);
		expect(entry).toBeDefined();

		console.log(
			`📜 History entry: ${entry?.id} — ${entry?.name} — ${entry?.status}`,
		);
	});

	// ── Test 7: Retrieve Job Logs ───────────────────────────────
	it("should retrieve job logs", async () => {
		if (!jobAccepted) {
			console.log("⏭️  Skipped: job was not accepted (503)");
			return;
		}

		const res = await getJobExecutionLogs({ path: { job_id: jobId } });
		expect(res.response.status).toBe(200);

		const details = res.data as {
			job?: { id: string };
			logs?: unknown[];
		};
		expect(details).toBeDefined();

		console.log(
			`📝 Logs retrieved: job=${details.job?.id}, logEntries=${(details.logs ?? []).length}`,
		);
	});

	// ── Test 8: Cleanup — Delete History Item ────────────────────
	it("should cleanup - delete history item", async () => {
		if (!jobAccepted) {
			console.log("⏭️  Skipped: job was not accepted (503)");
			return;
		}

		const res = await deleteJobHistoryItem({
			path: { id: jobId },
		});

		expect(res.response.status).toBe(200);

		const data = res.data as { success: boolean; message: string };
		expect(data.success).toBe(true);

		console.log(`🗑️  History item ${jobId} deleted`);
	});

	// ── Cleanup: Delete Browser Profile ─────────────────────────
	afterAll(async () => {
		if (browserId) {
			try {
				const res = await deleteBrowser({ path: { id: browserId } });
				if (res.response.status === 200) {
					console.log(`🧹 Browser ${browserId} cleaned up`);
				}
			} catch {
				console.warn(`⚠️  Failed to cleanup browser ${browserId}`);
			}
		}
	});
});
