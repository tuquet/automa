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
  campaignAccounts: () => campaignAccounts,
  campaigns: () => campaigns,
  jobs: () => jobs,
  logs: () => logs,
  proxies: () => proxies,
  schedules: () => schedules
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
  trustScore: integer("trust_score").default(100),
  lastChecked: text("last_checked"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var campaigns = sqliteTable("campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
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
var campaignAccounts = sqliteTable("campaign_accounts", {
  campaignId: text("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`)
});
var schedules = sqliteTable("schedules", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  workflowPath: text("workflow_path").notNull(),
  cronExpr: text("cron_expr").notNull(),
  concurrency: integer("concurrency").default(1),
  status: text("status").notNull().default("active"),
  // active, paused
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`)
});

// src/db/index.ts
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
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
  if (config.migrationsFolder) {
    await migrate(historyDb, { migrationsFolder: config.migrationsFolder });
    await migrate(assetsDb, { migrationsFolder: config.migrationsFolder });
  }
}

// src/index.ts
import { eq, sql as sql2, inArray } from "drizzle-orm";
export {
  accounts,
  assetsDb,
  assetsDbClient,
  browserProfiles,
  campaignAccounts,
  campaigns,
  eq,
  historyDb,
  historyDbClient,
  inArray,
  initCoreDatabases,
  jobs,
  logs,
  proxies,
  schedules,
  sql2 as sql
};
