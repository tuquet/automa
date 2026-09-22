import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		include: ["src/test/e2e/**/*.e2e.test.ts"],
		testTimeout: 120_000,
		hookTimeout: 30_000,
		sequence: {
			concurrent: false,
		},
	},
});
