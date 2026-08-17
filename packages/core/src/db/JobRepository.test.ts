import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { JobRepository } from './JobRepository';
import { initCoreDatabases, historyDbClient, assetsDbClient } from './index';
import * as schema from './schema';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

describe('JobRepository', () => {
  let dbPath = 'file:test_history.sqlite';
  
  beforeEach(async () => {
    // Clear out modules
    const { initCoreDatabases } = await import('./index');
    await initCoreDatabases({
      historyDbPath: dbPath,
      assetsDbPath: 'file:test_assets.sqlite',
    });
    
    // We need to create tables in SQLite since we don't have migrations in this test env
    // Actually we can just run raw SQL to create tables for tests
    const db = (await import('./index')).historyDb!;
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data TEXT NOT NULL,
        options TEXT,
        status TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
      )
    `);
    
    await db.run(sql`DELETE FROM logs`);
    await db.run(sql`DELETE FROM jobs`);
  });

  afterEach(async () => {
    await JobRepository.clearAllJobs();
  });

  it('should create a job successfully', async () => {
    const success = await JobRepository.createJob('job-1', 'Test Job', { some: 'data' }, { opt: 1 }, 'running');
    expect(success).toBe(true);

    const status = await JobRepository.getJobStatus('job-1');
    expect(status).toBe('running');
  });

  it('should update job status', async () => {
    await JobRepository.createJob('job-2', 'Test Job 2', {}, {}, 'running');
    await JobRepository.updateJobStatus('job-2', 'success');

    const status = await JobRepository.getJobStatus('job-2');
    expect(status).toBe('success');
  });

  it('should finish job with results and duration', async () => {
    await JobRepository.createJob('job-3', 'Test Job 3', { initial: true }, {}, 'running');
    await JobRepository.finishJob('job-3', 'success', { table: [] }, 1500);

    const details = await JobRepository.getJobDetails('job-3');
    expect(details.error).toBeUndefined();
    expect(details.job?.status).toBe('success');
    expect(details.job?.duration).toBe(1500);
    expect(details.results).toEqual({ table: [] });
  });
  
  it('should handle finishing a non-existent job gracefully', async () => {
    await expect(JobRepository.finishJob('non-existent', 'success', {}, 100)).resolves.not.toThrow();
  });

  it('should clear all jobs', async () => {
    await JobRepository.createJob('job-4', 'To be cleared', {}, {}, 'idle');
    await JobRepository.clearAllJobs();
    const details = await JobRepository.getJobDetails('job-4');
    expect(details.error).toBe('Job not found');
  });

  it('should log messages and flush them', async () => {
    await JobRepository.createJob('job-5', 'Test Job 5', {}, {}, 'running');
    JobRepository.insertLog('job-5', 'info', 'test message 1');
    JobRepository.insertLog('job-5', 'error', 'test message 2');
    
    await JobRepository.flushLogs();
    
    const logs = await JobRepository.getJobLogs('job-5');
    expect(logs.length).toBe(2);
    expect(logs[0].type).toBe('info');
    expect(logs[0].message).toBe('test message 1');
    expect(logs[1].type).toBe('error');
    expect(logs[1].message).toBe('test message 2');
  });

  it('should get history with and without limit/taskId', async () => {
    await JobRepository.createJob('history-1', 'H1', {}, {}, 'success');
    await JobRepository.createJob('history-2', 'H2', {}, {}, 'failed');
    
    const h1 = await JobRepository.getHistory(10);
    expect(h1.length).toBe(2);
    
    const h2 = await JobRepository.getHistory(10, 'history-1');
    expect(h2.length).toBe(1);
    expect(h2[0].id).toBe('history-1');
  });
  
  it('should delete a single job', async () => {
    await JobRepository.createJob('del-1', 'Delete me', {}, {}, 'running');
    await JobRepository.deleteJob('del-1');
    
    const details = await JobRepository.getJobDetails('del-1');
    expect(details.error).toBe('Job not found');
  });
  
  it('should cleanup old jobs keeping only 100 latest', async () => {
    // Create 105 jobs
    for (let i = 0; i < 105; i++) {
        await JobRepository.createJob(`job-old-${i}`, `Job ${i}`, {}, {}, 'success');
    }
    
    const h1 = await JobRepository.getHistory(200);
    expect(h1.length).toBe(105);
    
    await JobRepository.cleanupOldJobs();
    
    const h2 = await JobRepository.getHistory(200);
    expect(h2.length).toBe(100);
  });
  
  it('should parse logs properly in getJobDetails', async () => {
      await JobRepository.createJob('job-parsed', 'Parsed Logs', {}, {}, 'success');
      await JobRepository.addLogs([{ jobId: 'job-parsed', type: 'info', message: JSON.stringify({ detail: 'x' }) }]);
      
      const details = await JobRepository.getJobDetails('job-parsed');
      expect(details.logs?.[0].detail).toBe('x');
  });
  
  it('should handle unparseable log in getJobDetails gracefully', async () => {
      await JobRepository.createJob('job-unparsed', 'Unparsed', {}, {}, 'success');
      await JobRepository.addLogs([{ jobId: 'job-unparsed', type: 'info', message: 'Not a JSON' }]);
      
      const details = await JobRepository.getJobDetails('job-unparsed');
      expect(details.logs?.[0].message).toBe('Not a JSON');
  });

  describe('Exception Handling', () => {
    it('should handle DB errors gracefully and return fallbacks', async () => {
      const db = (await import('./index')).historyDb!;
      
      // Simulate missing table to trigger exceptions
      await db.run(sql`DROP TABLE logs`);
      await db.run(sql`DROP TABLE jobs`);
      
      // test createJob
      const createRes = await JobRepository.createJob('err-1', 'Err Job', {}, {}, 'running');
      expect(createRes).toBe(false);
      
      // updateJobStatus (void return, shouldn't throw)
      await expect(JobRepository.updateJobStatus('err-1', 'success')).resolves.not.toThrow();
      
      // finishJob
      await expect(JobRepository.finishJob('err-1', 'success', {}, 10)).resolves.not.toThrow();
      
      // cleanupOldJobs
      await expect(JobRepository.cleanupOldJobs()).resolves.not.toThrow();
      
      // clearAllJobs
      const clearRes = await JobRepository.clearAllJobs();
      expect(clearRes).toBe(false);
      
      // flushLogs
      JobRepository.insertLog('err-1', 'info', 'test');
      await expect(JobRepository.flushLogs()).resolves.not.toThrow();
      
      // getJobStatus
      const status = await JobRepository.getJobStatus('err-1');
      expect(status).toBeNull();
      
      // getJobLogs
      const logs = await JobRepository.getJobLogs('err-1');
      expect(logs).toEqual([]);
      
      // getHistory
      const history = await JobRepository.getHistory(10);
      expect(history).toEqual([]);
      
      // getJobDetails
      const details = await JobRepository.getJobDetails('err-1');
      expect(details.error).toBeDefined();

      // deleteJob
      await expect(JobRepository.deleteJob('err-1')).rejects.toThrow();
    });
  });

  describe('Buffer limits', () => {
    it('should auto-flush when log buffer reaches 100', async () => {
      // Clear logs first
      await JobRepository.flushLogs();
      await JobRepository.createJob('buffer-job', 'Buffer Job', {}, {}, 'running');
      
      for (let i = 0; i < 105; i++) {
          JobRepository.insertLog('buffer-job', 'info', `log ${i}`);
      }
      
      // Since it's async, we might need a tiny wait for it to process
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const logs = await JobRepository.getJobLogs('buffer-job');
      expect(logs.length).toBeGreaterThanOrEqual(100);
    });
  });

});

