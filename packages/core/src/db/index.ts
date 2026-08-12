import { createClient, Client } from "@libsql/client";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema.js";

// Connection instances
export let historyDbClient: Client | null = null;
export let historyDb: LibSQLDatabase<typeof schema> | null = null;

export let assetsDbClient: Client | null = null;
export let assetsDb: LibSQLDatabase<typeof schema> | null = null;

export interface DbConfig {
  historyDbPath: string; // e.g. file:./history.sqlite
  assetsDbPath: string;  // e.g. file:./assets.sqlite
  migrationsFolder?: string; // Path to drizzle/ folder
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

  if (config.migrationsFolder) {
    await migrate(historyDb, { migrationsFolder: config.migrationsFolder });
    await migrate(assetsDb, { migrationsFolder: config.migrationsFolder });
  }
}

