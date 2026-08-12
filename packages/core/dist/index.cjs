"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  accounts: () => accounts,
  assetsDb: () => assetsDb,
  assetsDbClient: () => assetsDbClient,
  campaigns: () => campaigns,
  historyDb: () => historyDb,
  historyDbClient: () => historyDbClient,
  initCoreDatabases: () => initCoreDatabases,
  jobs: () => jobs,
  logs: () => logs,
  proxies: () => proxies
});
module.exports = __toCommonJS(index_exports);

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  accounts: () => accounts,
  campaigns: () => campaigns,
  jobs: () => jobs,
  logs: () => logs,
  proxies: () => proxies
});
var import_sqlite_core = require("drizzle-orm/sqlite-core");
var import_drizzle_orm = require("drizzle-orm");
var jobs = (0, import_sqlite_core.sqliteTable)("jobs", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  name: (0, import_sqlite_core.text)("name").notNull(),
  data: (0, import_sqlite_core.text)("data").notNull(),
  options: (0, import_sqlite_core.text)("options"),
  status: (0, import_sqlite_core.text)("status").notNull(),
  createdAt: (0, import_sqlite_core.text)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`),
  updatedAt: (0, import_sqlite_core.text)("updated_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`)
});
var logs = (0, import_sqlite_core.sqliteTable)("logs", {
  id: (0, import_sqlite_core.integer)("id").primaryKey({ autoIncrement: true }),
  jobId: (0, import_sqlite_core.text)("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  type: (0, import_sqlite_core.text)("type").notNull(),
  message: (0, import_sqlite_core.text)("message").notNull(),
  createdAt: (0, import_sqlite_core.text)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`)
});
var accounts = (0, import_sqlite_core.sqliteTable)("accounts", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  platform: (0, import_sqlite_core.text)("platform").notNull(),
  // e.g., facebook, google, x
  username: (0, import_sqlite_core.text)("username").notNull(),
  password: (0, import_sqlite_core.text)("password"),
  twoFactorSecret: (0, import_sqlite_core.text)("two_factor_secret"),
  cookies: (0, import_sqlite_core.text)("cookies"),
  // JSON array of cookies
  proxyId: (0, import_sqlite_core.text)("proxy_id"),
  // optional FK to proxies
  status: (0, import_sqlite_core.text)("status").notNull().default("active"),
  // active, restricted, banned
  trustScore: (0, import_sqlite_core.integer)("trust_score").default(100),
  createdAt: (0, import_sqlite_core.text)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`),
  updatedAt: (0, import_sqlite_core.text)("updated_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`)
});
var proxies = (0, import_sqlite_core.sqliteTable)("proxies", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  host: (0, import_sqlite_core.text)("host").notNull(),
  port: (0, import_sqlite_core.integer)("port").notNull(),
  username: (0, import_sqlite_core.text)("username"),
  password: (0, import_sqlite_core.text)("password"),
  protocol: (0, import_sqlite_core.text)("protocol").default("http"),
  // http, socks5
  status: (0, import_sqlite_core.text)("status").notNull().default("alive"),
  lastChecked: (0, import_sqlite_core.text)("last_checked"),
  createdAt: (0, import_sqlite_core.text)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`)
});
var campaigns = (0, import_sqlite_core.sqliteTable)("campaigns", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  name: (0, import_sqlite_core.text)("name").notNull(),
  workflowId: (0, import_sqlite_core.text)("workflow_id").notNull(),
  schedule: (0, import_sqlite_core.text)("schedule"),
  // cron expression
  status: (0, import_sqlite_core.text)("status").notNull().default("idle"),
  createdAt: (0, import_sqlite_core.text)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`)
});

// src/db/index.ts
var import_client = require("@libsql/client");
var import_libsql = require("drizzle-orm/libsql");
var historyDbClient = null;
var historyDb = null;
var assetsDbClient = null;
var assetsDb = null;
async function initCoreDatabases(config) {
  if (!historyDb) {
    historyDbClient = (0, import_client.createClient)({ url: config.historyDbPath });
    historyDb = (0, import_libsql.drizzle)(historyDbClient, { schema: schema_exports });
  }
  if (!assetsDb) {
    assetsDbClient = (0, import_client.createClient)({ url: config.assetsDbPath });
    assetsDb = (0, import_libsql.drizzle)(assetsDbClient, { schema: schema_exports });
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
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  accounts,
  assetsDb,
  assetsDbClient,
  campaigns,
  historyDb,
  historyDbClient,
  initCoreDatabases,
  jobs,
  logs,
  proxies
});
