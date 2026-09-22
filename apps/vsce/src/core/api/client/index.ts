export * from "@automa/types/api";
import { client } from "@automa/types/api";

// Initialize default baseUrl immediately so any early requests don't fail with relative URL errors
client.setConfig({
	baseUrl: "http://127.0.0.1:8765",
});

export { client };
