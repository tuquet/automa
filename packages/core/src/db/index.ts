import { createClient, Client } from "@libsql/client";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema.js";

// Connection instances
export let historyDbClient: Client | null = null;
export let historyDb: LibSQLDatabase<typeof schema> | null = null;

export let assetsDbClient: Client | null = null;
export let assetsDb: LibSQLDatabase<typeof schema> | null = null;

export interface DbConfig {
  historyDbPath: string; // e.g. file:./history.sqlite
  assetsDbPath: string;  // e.g. file:./assets.sqlite
}

export async function initCoreDatabases(config: DbConfig): Promise<void> {
  // Initialize History DB (Jobs & Logs)
  if (!historyDb) {
    historyDbClient = createClient({ url: config.historyDbPath });
    historyDb = drizzle(historyDbClient, { schema });
  }

  // Initialize Assets DB (Accounts, Proxies, Campaigns)
  if (!assetsDb) {
    assetsDbClient = createClient({ url: config.assetsDbPath });
    assetsDb = drizzle(assetsDbClient, { schema });
  }

  // For simplicity in development, we'll execute the raw table creation here
  // In production, we should use drizzle-kit migrations
  await setupTables();
}

async function setupTables() {
  if (historyDbClient) {
    await historyDbClient.execute(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data TEXT NOT NULL,
        options TEXT,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await historyDbClient.execute(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
      );
    `);
  }

  if (assetsDbClient) {
    await assetsDbClient.execute(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        username TEXT NOT NULL,
        password TEXT,
        two_factor_secret TEXT,
        cookies TEXT,
        proxy_id TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        trust_score INTEGER DEFAULT 100,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await assetsDbClient.execute(`
      CREATE TABLE IF NOT EXISTS proxies (
        id TEXT PRIMARY KEY,
        host TEXT NOT NULL,
        port INTEGER NOT NULL,
        username TEXT,
        password TEXT,
        protocol TEXT DEFAULT 'http',
        status TEXT NOT NULL DEFAULT 'alive',
        last_checked TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await assetsDbClient.execute(`
      CREATE TABLE IF NOT EXISTS browser_profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        user_agent TEXT NOT NULL,
        timezone TEXT,
        language TEXT DEFAULT 'en-US',
        screen_resolution TEXT DEFAULT '1920x1080',
        account_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
}
