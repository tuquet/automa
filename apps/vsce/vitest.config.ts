import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		include: ["src/**/*.test.ts"],
		exclude: ["src/test/e2e/**", "out/**", "dist/**", "node_modules/**"],
		setupFiles: ["./src/test/setup.ts"],
		testTimeout: 20000,
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "json"],
			reportsDirectory: "./coverage",
			exclude: ["out/**", "dist/**", "node_modules/**", "src/test/setup.ts", "src/test/e2e/**"],
		},
	},
});
