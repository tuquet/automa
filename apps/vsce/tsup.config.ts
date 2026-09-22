import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/extension.ts"],
	format: ["cjs"],
	external: ["vscode"],
	noExternal: ["@automa/types"],
	minify: process.env.VSIX_ENV !== "dev",
	sourcemap: process.env.VSIX_ENV === "dev",
	env: {
		AUTOMA_ENV: process.env.VSIX_ENV === "dev" ? "development" : "production",
	},
});
