import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"@automa/types/api": path.resolve(__dirname, "packages/automa-types/src/api/index.ts"),
			"@automa/types/ws": path.resolve(__dirname, "packages/automa-types/src/ws.ts"),
			"@automa/types": path.resolve(__dirname, "packages/automa-types/src/index.ts"),
		},
	},
	test: {
		environment: "node",
		globals: true,
		globalSetup: ["tests/e2e/helpers/globalSetup.ts"],
		testTimeout: 60000,
		hookTimeout: 60000,
		fileParallelism: false,
		maxConcurrency: 1,
		maxWorkers: 1,
		pool: "forks",
		sequence: {
			concurrent: false,
		},
		include: ["tests/**/*.test.ts"],
		exclude: [
			"automa-vsce/**",
			"automa-webe/**",
			"automa-desk/**",
			"node_modules/**",
			".vscode-test/**",
			"out/**",
			"dist/**",
			"target/**",
		],
	},
});
