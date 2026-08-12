import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ---- HISTORY DB TABLES (Inherited from automa-cli) ----

export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  data: text('data').notNull(),
  options: text('options'),
  status: text('status').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const logs = sqliteTable('logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  message: text('message').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});


// ---- ASSET DB TABLES (New MMO Foundation) ----

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  platform: text('platform').notNull(), // e.g., facebook, google, x
  username: text('username').notNull(),
  password: text('password'),
  twoFactorSecret: text('two_factor_secret'),
  cookies: text('cookies'), // JSON array of cookies
  proxyId: text('proxy_id'), // optional FK to proxies
  status: text('status').notNull().default('active'), // active, restricted, banned
  trustScore: integer('trust_score').default(100),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const proxies = sqliteTable('proxies', {
  id: text('id').primaryKey(),
  host: text('host').notNull(),
  port: integer('port').notNull(),
  username: text('username'),
  password: text('password'),
  protocol: text('protocol').default('http'), // http, socks5
  status: text('status').notNull().default('alive'),
  trustScore: integer('trust_score').default(100),
  lastChecked: text('last_checked'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const campaigns = sqliteTable('campaigns', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  workflowId: text('workflow_id').notNull(),
  schedule: text('schedule'), // cron expression
  status: text('status').notNull().default('idle'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const browserProfiles = sqliteTable('browser_profiles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  userAgent: text('user_agent').notNull(),
  timezone: text('timezone'),
  language: text('language').default('en-US'),
  screenResolution: text('screen_resolution').default('1920x1080'),
  accountId: text('account_id'), // Bound account
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const campaignAccounts = sqliteTable('campaign_accounts', {
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const schedules = sqliteTable('schedules', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  workflowPath: text('workflow_path').notNull(),
  cronExpr: text('cron_expr').notNull(),
  concurrency: integer('concurrency').default(1),
  status: text('status').notNull().default('active'), // active, paused
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

