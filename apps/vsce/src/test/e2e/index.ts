import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";
import Mocha from "mocha";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: "tdd",
		color: true,
		timeout: 60000, // 60 seconds
	});

	const testsRoot = path.resolve(__dirname, ".");

	return new Promise((c, e) => {
		glob("**/**.test.js", { cwd: testsRoot })
			.then((files) => {
				// Add files to the test suite
				files.forEach((f) => {
					mocha.addFile(path.resolve(testsRoot, f));
				});

				try {
					// Run the mocha test
					mocha.run((failures) => {
						if (failures > 0) {
							e(new Error(`${failures} tests failed.`));
						} else {
							c();
						}
					});
				} catch (err) {
					console.error(err);
					e(err);
				}
			})
			.catch((err) => {
				return e(err);
			});
	});
}
