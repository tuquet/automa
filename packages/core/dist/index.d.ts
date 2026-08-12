import * as drizzle_orm_sqlite_core from 'drizzle-orm/sqlite-core';
import { Client } from '@libsql/client';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
export { eq, inArray, sql } from 'drizzle-orm';

declare const jobs: drizzle_orm_sqlite_core.SQLiteTableWithColumns<{
    name: "jobs";
    schema: undefined;
    columns: {
        id: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "id";
            tableName: "jobs";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        name: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "name";
            tableName: "jobs";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        data: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "data";
            tableName: "jobs";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        options: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "options";
            tableName: "jobs";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        status: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "status";
            tableName: "jobs";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        createdAt: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "created_at";
            tableName: "jobs";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        updatedAt: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "updated_at";
            tableName: "jobs";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
    };
    dialect: "sqlite";
}>;
declare const logs: drizzle_orm_sqlite_core.SQLiteTableWithColumns<{
    name: "logs";
    schema: undefined;
    columns: {
        id: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "id";
            tableName: "logs";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
        jobId: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "job_id";
            tableName: "logs";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        type: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "type";
            tableName: "logs";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        message: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "message";
            tableName: "logs";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        createdAt: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "created_at";
            tableName: "logs";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
    };
    dialect: "sqlite";
}>;
declare const accounts: drizzle_orm_sqlite_core.SQLiteTableWithColumns<{
    name: "accounts";
    schema: undefined;
    columns: {
        id: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "id";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        platform: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "platform";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        username: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "username";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        password: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "password";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        twoFactorSecret: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "two_factor_secret";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        cookies: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "cookies";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        proxyId: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "proxy_id";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        status: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "status";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        trustScore: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "trust_score";
            tableName: "accounts";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
        createdAt: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "created_at";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        updatedAt: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "updated_at";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
    };
    dialect: "sqlite";
}>;
declare const proxies: drizzle_orm_sqlite_core.SQLiteTableWithColumns<{
    name: "proxies";
    schema: undefined;
    columns: {
        id: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "id";
            tableName: "proxies";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        host: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "host";
            tableName: "proxies";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        port: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "port";
            tableName: "proxies";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
        username: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "username";
            tableName: "proxies";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        password: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "password";
            tableName: "proxies";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        protocol: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "protocol";
            tableName: "proxies";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        status: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "status";
            tableName: "proxies";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        trustScore: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "trust_score";
            tableName: "proxies";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
        lastChecked: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "last_checked";
            tableName: "proxies";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        createdAt: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "created_at";
            tableName: "proxies";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
    };
    dialect: "sqlite";
}>;
declare const campaigns: drizzle_orm_sqlite_core.SQLiteTableWithColumns<{
    name: "campaigns";
    schema: undefined;
    columns: {
        id: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "id";
            tableName: "campaigns";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        name: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "name";
            tableName: "campaigns";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        workflowId: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "workflow_id";
            tableName: "campaigns";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        schedule: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "schedule";
            tableName: "campaigns";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        status: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "status";
            tableName: "campaigns";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        createdAt: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "created_at";
            tableName: "campaigns";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
    };
    dialect: "sqlite";
}>;
declare const browserProfiles: drizzle_orm_sqlite_core.SQLiteTableWithColumns<{
    name: "browser_profiles";
    schema: undefined;
    columns: {
        id: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "id";
            tableName: "browser_profiles";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        name: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "name";
            tableName: "browser_profiles";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        userAgent: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "user_agent";
            tableName: "browser_profiles";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        timezone: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "timezone";
            tableName: "browser_profiles";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        language: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "language";
            tableName: "browser_profiles";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        screenResolution: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "screen_resolution";
            tableName: "browser_profiles";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        accountId: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "account_id";
            tableName: "browser_profiles";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        createdAt: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "created_at";
            tableName: "browser_profiles";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
    };
    dialect: "sqlite";
}>;
declare const fleets: drizzle_orm_sqlite_core.SQLiteTableWithColumns<{
    name: "fleets";
    schema: undefined;
    columns: {
        id: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "id";
            tableName: "fleets";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        name: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "name";
            tableName: "fleets";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        description: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "description";
            tableName: "fleets";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        status: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "status";
            tableName: "fleets";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        createdAt: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "created_at";
            tableName: "fleets";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
    };
    dialect: "sqlite";
}>;
declare const fleetMembers: drizzle_orm_sqlite_core.SQLiteTableWithColumns<{
    name: "fleet_members";
    schema: undefined;
    columns: {
        fleetId: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "fleet_id";
            tableName: "fleet_members";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        accountId: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "account_id";
            tableName: "fleet_members";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        createdAt: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "created_at";
            tableName: "fleet_members";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
    };
    dialect: "sqlite";
}>;
declare const schedules: drizzle_orm_sqlite_core.SQLiteTableWithColumns<{
    name: "schedules";
    schema: undefined;
    columns: {
        id: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "id";
            tableName: "schedules";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        fleetId: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "fleet_id";
            tableName: "schedules";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        workflowPath: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "workflow_path";
            tableName: "schedules";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        cronExpr: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "cron_expr";
            tableName: "schedules";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        concurrency: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "concurrency";
            tableName: "schedules";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
        status: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "status";
            tableName: "schedules";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        createdAt: drizzle_orm_sqlite_core.SQLiteColumn<{
            name: "created_at";
            tableName: "schedules";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
    };
    dialect: "sqlite";
}>;

declare const schema_accounts: typeof accounts;
declare const schema_browserProfiles: typeof browserProfiles;
declare const schema_campaigns: typeof campaigns;
declare const schema_fleetMembers: typeof fleetMembers;
declare const schema_fleets: typeof fleets;
declare const schema_jobs: typeof jobs;
declare const schema_logs: typeof logs;
declare const schema_proxies: typeof proxies;
declare const schema_schedules: typeof schedules;
declare namespace schema {
  export { schema_accounts as accounts, schema_browserProfiles as browserProfiles, schema_campaigns as campaigns, schema_fleetMembers as fleetMembers, schema_fleets as fleets, schema_jobs as jobs, schema_logs as logs, schema_proxies as proxies, schema_schedules as schedules };
}

declare let historyDbClient: Client | null;
declare let historyDb: LibSQLDatabase<typeof schema> | null;
declare let assetsDbClient: Client | null;
declare let assetsDb: LibSQLDatabase<typeof schema> | null;
interface DbConfig {
    historyDbPath: string;
    assetsDbPath: string;
    migrationsFolder?: string;
}
declare function initCoreDatabases(config: DbConfig): Promise<void>;

export { type DbConfig, accounts, assetsDb, assetsDbClient, browserProfiles, campaigns, fleetMembers, fleets, historyDb, historyDbClient, initCoreDatabases, jobs, logs, proxies, schedules };
