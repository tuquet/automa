import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@automa/types/api": path.resolve(__dirname, "packages/automa-types/src/api/index.ts"),
			"@automa/types": path.resolve(__dirname, "packages/automa-types/src/index.ts"),
		},
	},
	test: {
		environment: "node",
		globals: true,
		include: ["tests/**/*.test.ts"],
		exclude: [
			"automa-vscode/**",
			"automa-ext/**",
			"node_modules/**",
			".vscode-test/**",
			"out/**",
			"dist/**",
			"target/**",
		],
	},
});
