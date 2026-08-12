var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  accounts: () => accounts,
  browserProfiles: () => browserProfiles,
  campaigns: () => campaigns,
  jobs: () => jobs,
  logs: () => logs,
  proxies: () => proxies
});
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
var jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  data: text("data").notNull(),
  options: text("options"),
  status: text("status").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`)
});
var logs = sqliteTable("logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: text("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  platform: text("platform").notNull(),
  // e.g., facebook, google, x
  username: text("username").notNull(),
  password: text("password"),
  twoFactorSecret: text("two_factor_secret"),
  cookies: text("cookies"),
  // JSON array of cookies
  proxyId: text("proxy_id"),
  // optional FK to proxies
  status: text("status").notNull().default("active"),
  // active, restricted, banned
  trustScore: integer("trust_score").default(100),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`)
});
var proxies = sqliteTable("proxies", {
  id: text("id").primaryKey(),
  host: text("host").notNull(),
  port: integer("port").notNull(),
  username: text("username"),
  password: text("password"),
  protocol: text("protocol").default("http"),
  // http, socks5
  status: text("status").notNull().default("alive"),
  lastChecked: text("last_checked"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var campaigns = sqliteTable("campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  workflowId: text("workflow_id").notNull(),
  schedule: text("schedule"),
  // cron expression
  status: text("status").notNull().default("idle"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var browserProfiles = sqliteTable("browser_profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  userAgent: text("user_agent").notNull(),
  timezone: text("timezone"),
  language: text("language").default("en-US"),
  screenResolution: text("screen_resolution").default("1920x1080"),
  accountId: text("account_id"),
  // Bound account
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`)
});

// src/db/index.ts
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
var historyDbClient = null;
var historyDb = null;
var assetsDbClient = null;
var assetsDb = null;
async function initCoreDatabases(config) {
  if (!historyDb) {
    historyDbClient = createClient({ url: config.historyDbPath });
    historyDb = drizzle(historyDbClient, { schema: schema_exports });
  }
  if (!assetsDb) {
    assetsDbClient = createClient({ url: config.assetsDbPath });
    assetsDb = drizzle(assetsDbClient, { schema: schema_exports });
  }
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
export {
  accounts,
  assetsDb,
  assetsDbClient,
  browserProfiles,
  campaigns,
  historyDb,
  historyDbClient,
  initCoreDatabases,
  jobs,
  logs,
  proxies
};
