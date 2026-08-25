import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
	input: "http://127.0.0.1:8765/api-docs/openapi.json",
	output: {
		path: "src/api",
	},
	plugins: ["@hey-api/client-fetch"],
});
