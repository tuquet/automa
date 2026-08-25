import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();

// ANSI styling
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

function runStep(name, command, args, cwd = rootDir) {
	return new Promise((resolve) => {
		const startTime = Date.now();
		console.log(`\n${BOLD}${CYAN}▶ [RUNNING] ${name}...${RESET}`);
		console.log(`${CYAN}$ ${command} ${args.join(" ")} (in ${cwd})${RESET}\n`);

		const child = spawn(command, args, {
			cwd,
			stdio: "inherit",
			shell: true,
			env: { ...process.env, FORCE_COLOR: "1" },
		});

		child.on("close", (code) => {
			const duration = ((Date.now() - startTime) / 1000).toFixed(2);
			if (code === 0) {
				console.log(`\n${BOLD}${GREEN}✔ [PASSED] ${name} (${duration}s)${RESET}`);
				resolve({ name, success: true, duration, code });
			} else {
				console.log(`\n${BOLD}${RED}✘ [FAILED] ${name} (${duration}s, exit code: ${code})${RESET}`);
				resolve({ name, success: false, duration, code });
			}
		});

		child.on("error", (err) => {
			const duration = ((Date.now() - startTime) / 1000).toFixed(2);
			console.error(`\n${BOLD}${RED}✘ [ERROR] ${name}: ${err.message}${RESET}`);
			resolve({ name, success: false, duration, code: 1, error: err });
		});
	});
}

async function main() {
	console.log(`\n${BOLD}======================================================${RESET}`);
	console.log(`${BOLD}🚀  AUTOMA ECOSYSTEM UNIFIED TEST SUITE${RESET}`);
	console.log(`${BOLD}======================================================${RESET}`);

	const results = [];
	const overallStart = Date.now();

	// Step 1: Rust Core Tests (Cargo)
	const rustRes = await runStep(
		"Automa Rust Core (Engine, API & E2E)",
		"cargo",
		["test"],
		path.join(rootDir, "automa-core")
	);
	results.push(rustRes);

	// Step 2: VS Code Extension & Webview E2E Tests (Vitest + Playwright)
	const vscodeRes = await runStep(
		"Automa VS Code Extension & Webview E2E",
		"pnpm",
		["-F", "vscode-automa", "test"],
		rootDir
	);
	results.push(vscodeRes);

	// Step 3: Cross-Service E2E API Tests (Generated SDK against Isolated Core)
	const e2eRes = await runStep(
		"Cross-Service E2E API Tests (Generated SDK)",
		"pnpm",
		["exec", "vitest", "run", "--config", "vitest.config.ts"],
		rootDir
	);
	results.push(e2eRes);

	// Step 4: Desktop OS App Unit Tests (Tauri v2 + Vue 3.5)
	const deskRes = await runStep(
		"Automa Desktop OS App (Tauri v2 & Vue 3.5)",
		"pnpm",
		["-F", "@automa/desk", "run", "test:unit"],
		rootDir
	);
	results.push(deskRes);

	// Step 5: Strict Schema Validation
	const schemaRes = await runStep(
		"Strict OpenAPI & JSON Schema Linter",
		"node",
		["scripts/enforce-strict-schema.mjs"],
		rootDir
	);
	results.push(schemaRes);

	const totalDuration = ((Date.now() - overallStart) / 1000).toFixed(2);

	// Summary Report
	console.log(`\n${BOLD}======================================================${RESET}`);
	console.log(`${BOLD}📊  TEST SUMMARY REPORT (${totalDuration}s)${RESET}`);
	console.log(`${BOLD}======================================================${RESET}`);

	let allPassed = true;
	for (const res of results) {
		const status = res.success
			? `${GREEN}✔ PASSED${RESET}`
			: `${RED}✘ FAILED (code ${res.code})${RESET}`;
		console.log(`  ${res.name.padEnd(45)} [${status}]  ${res.duration}s`);
		if (!res.success) allPassed = false;
	}
	console.log(`${BOLD}======================================================${RESET}\n`);

	if (allPassed) {
		console.log(`${BOLD}${GREEN}🎉 ALL TEST SUITES PASSED CLEANLY! 🎉${RESET}\n`);
		process.exit(0);
	} else {
		console.error(`${BOLD}${RED}💥 SOME TEST SUITES FAILED! Please review logs above.${RESET}\n`);
		process.exit(1);
	}
}

main().catch((err) => {
	console.error("Unexpected test runner failure:", err);
	process.exit(1);
});
