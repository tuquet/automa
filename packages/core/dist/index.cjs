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
  browserProfiles: () => browserProfiles,
  campaigns: () => campaigns,
  eq: () => import_drizzle_orm2.eq,
  fleetMembers: () => fleetMembers,
  fleets: () => fleets,
  historyDb: () => historyDb,
  historyDbClient: () => historyDbClient,
  inArray: () => import_drizzle_orm2.inArray,
  initCoreDatabases: () => initCoreDatabases,
  jobs: () => jobs,
  logs: () => logs,
  proxies: () => proxies,
  schedules: () => schedules,
  sql: () => import_drizzle_orm2.sql
});
module.exports = __toCommonJS(index_exports);

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  accounts: () => accounts,
  browserProfiles: () => browserProfiles,
  campaigns: () => campaigns,
  fleetMembers: () => fleetMembers,
  fleets: () => fleets,
  jobs: () => jobs,
  logs: () => logs,
  proxies: () => proxies,
  schedules: () => schedules
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
  trustScore: (0, import_sqlite_core.integer)("trust_score").default(100),
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
var browserProfiles = (0, import_sqlite_core.sqliteTable)("browser_profiles", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  name: (0, import_sqlite_core.text)("name").notNull(),
  userAgent: (0, import_sqlite_core.text)("user_agent").notNull(),
  timezone: (0, import_sqlite_core.text)("timezone"),
  language: (0, import_sqlite_core.text)("language").default("en-US"),
  screenResolution: (0, import_sqlite_core.text)("screen_resolution").default("1920x1080"),
  accountId: (0, import_sqlite_core.text)("account_id"),
  // Bound account
  createdAt: (0, import_sqlite_core.text)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`)
});
var fleets = (0, import_sqlite_core.sqliteTable)("fleets", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  name: (0, import_sqlite_core.text)("name").notNull(),
  description: (0, import_sqlite_core.text)("description"),
  status: (0, import_sqlite_core.text)("status").notNull().default("active"),
  // active, paused
  createdAt: (0, import_sqlite_core.text)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`)
});
var fleetMembers = (0, import_sqlite_core.sqliteTable)("fleet_members", {
  fleetId: (0, import_sqlite_core.text)("fleet_id").notNull().references(() => fleets.id, { onDelete: "cascade" }),
  accountId: (0, import_sqlite_core.text)("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  createdAt: (0, import_sqlite_core.text)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`)
});
var schedules = (0, import_sqlite_core.sqliteTable)("schedules", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  fleetId: (0, import_sqlite_core.text)("fleet_id").notNull().references(() => fleets.id, { onDelete: "cascade" }),
  workflowPath: (0, import_sqlite_core.text)("workflow_path").notNull(),
  cronExpr: (0, import_sqlite_core.text)("cron_expr").notNull(),
  concurrency: (0, import_sqlite_core.integer)("concurrency").default(1),
  status: (0, import_sqlite_core.text)("status").notNull().default("active"),
  // active, paused
  createdAt: (0, import_sqlite_core.text)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`)
});

// src/db/index.ts
var import_client = require("@libsql/client");
var import_libsql = require("drizzle-orm/libsql");
var import_migrator = require("drizzle-orm/libsql/migrator");
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
  if (config.migrationsFolder) {
    await (0, import_migrator.migrate)(historyDb, { migrationsFolder: config.migrationsFolder });
    await (0, import_migrator.migrate)(assetsDb, { migrationsFolder: config.migrationsFolder });
  }
}

// src/index.ts
var import_drizzle_orm2 = require("drizzle-orm");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  accounts,
  assetsDb,
  assetsDbClient,
  browserProfiles,
  campaigns,
  eq,
  fleetMembers,
  fleets,
  historyDb,
  historyDbClient,
  inArray,
  initCoreDatabases,
  jobs,
  logs,
  proxies,
  schedules,
  sql
});
