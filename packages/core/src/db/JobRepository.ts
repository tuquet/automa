import { eq, inArray, sql, desc, like } from "drizzle-orm";
import { historyDb } from "./index.js";

function getDb() {
    if (!historyDb) throw new Error("Database not initialized");
    return historyDb;
}
import { jobs, logs } from "./schema.js";

export class JobRepository {
	static async createJob(
		jobId: string,
		name: string,
		data: any,
		options: any,
		status: string,
	): Promise<boolean> {
		const db = getDb();
		try {
			await db.insert(jobs).values({
				id: jobId,
				name,
				data: JSON.stringify(data),
				options: JSON.stringify(options),
				status,
			});
			return true;
		} catch (dbErr: any) {
			console.warn(`[SQLite] Error: ${dbErr.message}`);
			return false;
		}
	}

	static async updateJobStatus(jobId: string, status: string): Promise<void> {
		const db = getDb();
		try {
			await db
				.update(jobs)
				.set({ status, updatedAt: sql`CURRENT_TIMESTAMP` })
				.where(eq(jobs.id, jobId));
		} catch (dbErr: any) {
			console.warn(`[SQLite] Error: ${dbErr.message}`);
		}
	}

	static async finishJob(
		jobId: string,
		status: string,
		results: any,
		duration: number,
	): Promise<void> {
		await JobRepository.flushLogs(); // Ensure pending logs are written
		const db = getDb();
		try {
			const rows = await db.select({ data: jobs.data }).from(jobs).where(eq(jobs.id, jobId));
			if (rows.length > 0) {
				const data = JSON.parse(rows[0].data);
				data.results = results;
				data.duration = duration;
				await db
					.update(jobs)
					.set({
						status,
						data: JSON.stringify(data),
						updatedAt: sql`CURRENT_TIMESTAMP`,
					})
					.where(eq(jobs.id, jobId));
			} else {
				await db
					.update(jobs)
					.set({ status, updatedAt: sql`CURRENT_TIMESTAMP` })
					.where(eq(jobs.id, jobId));
			}
		} catch (dbErr: any) {
			console.warn(`[SQLite] Error: ${dbErr.message}`);
		}
	}

	static async cleanupOldJobs(): Promise<void> {
		const db = getDb();
		try {
			// Select the newest 100 job IDs
			const latestJobs = await db
				.select({ id: jobs.id })
				.from(jobs)
				.orderBy(desc(jobs.createdAt))
				.limit(100);
			const latestJobIds = latestJobs.map(j => j.id);

			if (latestJobIds.length > 0) {
				await db.delete(logs).where(sql`${logs.jobId} NOT IN (${sql.join(latestJobIds, sql`, `)})`);
				await db.delete(jobs).where(sql`${jobs.id} NOT IN (${sql.join(latestJobIds, sql`, `)})`);
			}
		} catch (err: any) {
			console.warn(`[SQLite] Error: ${err.message}`);
		}
	}

	static async deleteJob(jobId: string): Promise<void> {
		const db = getDb();
		try {
			await db.delete(logs).where(eq(logs.jobId, jobId));
			await db.delete(jobs).where(eq(jobs.id, jobId));
		} catch (dbErr: any) {
			console.warn(`[SQLite] Error: ${dbErr.message}`);
			throw dbErr;
		}
	}

	static async clearAllJobs(): Promise<boolean> {
		const db = getDb();
		try {
			await db.delete(logs);
			await db.delete(jobs);
			return true;
		} catch (dbErr: any) {
			console.warn(`[SQLite] Error: ${dbErr.message}`);
			return false;
		}
	}

	private static logBuffer: { jobId: string; type: string; message: string }[] = [];
	private static flushTimeout: any = null;

	static insertLog(jobId: string, type: string, message: string) {
		JobRepository.logBuffer.push({ jobId, type, message });

		if (JobRepository.logBuffer.length >= 100) {
			JobRepository.flushLogs().catch(() => {});
		} else if (!JobRepository.flushTimeout) {
			JobRepository.flushTimeout = setTimeout(() => {
				JobRepository.flushLogs().catch(() => {});
			}, 1000);
			if (JobRepository.flushTimeout.unref) JobRepository.flushTimeout.unref();
		}
	}

	static async flushLogs(): Promise<void> {
		if (JobRepository.logBuffer.length === 0) return;
		if (JobRepository.flushTimeout) {
			clearTimeout(JobRepository.flushTimeout);
			JobRepository.flushTimeout = null;
		}
		const logsToAdd = [...JobRepository.logBuffer];
		JobRepository.logBuffer = [];

		const db = getDb();
		try {
			await db.insert(logs).values(logsToAdd);
		} catch (_e) {
			// Silently ignore log insert errors
		}
	}

	static async addLogs(newLogs: { jobId: string; type: string; message: string }[]): Promise<void> {
		JobRepository.logBuffer.push(...newLogs);
		await JobRepository.flushLogs();
	}

	static async getJobStatus(jobId: string): Promise<string | null> {
		const db = getDb();
		try {
			const rows = await db.select({ status: jobs.status }).from(jobs).where(eq(jobs.id, jobId));
			return rows.length > 0 ? rows[0].status : null;
		} catch (_dbErr: any) {
			return null;
		}
	}

	static async getJobLogs(jobId: string): Promise<any[]> {
		const db = getDb();
		try {
			return await db.select().from(logs).where(eq(logs.jobId, jobId)).orderBy(logs.id);
		} catch (_dbErr: any) {
			return [];
		}
	}

	static async getHistory(limit: number, taskId?: string): Promise<any[]> {
		const db = getDb();
		try {
			let query = db
				.select({
					id: jobs.id,
					name: jobs.name,
					status: jobs.status,
					created_at: jobs.createdAt,
					updated_at: jobs.updatedAt,
				})
				.from(jobs);

			if (taskId) {
				query = query.where(like(jobs.id, `%${taskId}%`)) as any;
			}

			return await query.orderBy(desc(jobs.createdAt)).limit(limit);
		} catch (_err: any) {
			return [];
		}
	}

	static async getJobDetails(jobId: string): Promise<{
		error?: string;
		job?: any;
		results?: any;
		logs?: any[];
	}> {
		const db = getDb();
		try {
			const rows = await db.select().from(jobs).where(eq(jobs.id, jobId));
			if (rows.length === 0) {
				return { error: "Job not found" };
			}

			const jobRow = rows[0];
			const data = JSON.parse(jobRow.data || "{}");
			const job = {
				name: jobRow.name,
				id: jobRow.id,
				workflow_id: data.workflowData?.id || jobRow.id,
				status: jobRow.status,
				created_at: jobRow.createdAt,
				ended_at: jobRow.updatedAt,
				duration: data.duration,
			};
			const results = data.results || { table: [], variables: {} };
			
			const dbLogs = await db.select().from(logs).where(eq(logs.jobId, jobId)).orderBy(logs.id);
			const parsedLogs = dbLogs.map((l: any) => {
				try {
					return { ...l, ...JSON.parse(l.message) };
				} catch (_e) {
					return l;
				}
			});

			return { job, results, logs: parsedLogs };
		} catch (err: any) {
			return { error: err.message };
		}
	}
}
