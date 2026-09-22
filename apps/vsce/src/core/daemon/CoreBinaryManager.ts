import * as fs from "node:fs";
import * as https from "node:https";
import * as path from "node:path";
import * as vscode from "vscode";
import { Logger } from "../Logger";

export const CoreBinaryManager = {
	getBinaryName(): string {
		const platform = process.platform;
		const arch = process.arch;
		const isWin = platform === "win32";

		let name = `automa-core-${platform}-${arch}`;
		if (isWin) {
			name += ".exe";
		}
		return name;
	},

	async ensureBinaryExists(context?: vscode.ExtensionContext): Promise<string> {
		// 1. Check AUTOMA_CORE_PATH environment variable
		if (
			process.env.AUTOMA_CORE_PATH &&
			fs.existsSync(process.env.AUTOMA_CORE_PATH)
		) {
			Logger.info(
				`Found Automa Core Engine from AUTOMA_CORE_PATH: ${process.env.AUTOMA_CORE_PATH}`,
			);
			return process.env.AUTOMA_CORE_PATH;
		}

		// 2. Check local workspace paths in monorepo development
		const isWin = process.platform === "win32";
		const exeName = isWin ? "automa-core.exe" : "automa-core";
		const workspaceFolders = vscode.workspace.workspaceFolders || [];

		for (const folder of workspaceFolders) {
			const candidateReleaseApps = path.join(
				folder.uri.fsPath,
				"apps",
				"core",
				"target",
				"release",
				exeName,
			);
			if (fs.existsSync(candidateReleaseApps)) {
				Logger.info(
					`Found local Automa Core Engine (release): ${candidateReleaseApps}`,
				);
				return candidateReleaseApps;
			}
			const candidateDebugApps = path.join(
				folder.uri.fsPath,
				"apps",
				"core",
				"target",
				"debug",
				exeName,
			);
			if (fs.existsSync(candidateDebugApps)) {
				Logger.info(
					`Found local Automa Core Engine (debug): ${candidateDebugApps}`,
				);
				return candidateDebugApps;
			}
			const candidateRelease = path.join(
				folder.uri.fsPath,
				"automa-core",
				"target",
				"release",
				exeName,
			);
			if (fs.existsSync(candidateRelease)) {
				Logger.info(
					`Found local Automa Core Engine (release): ${candidateRelease}`,
				);
				return candidateRelease;
			}
			const candidateDebug = path.join(
				folder.uri.fsPath,
				"automa-core",
				"target",
				"debug",
				exeName,
			);
			if (fs.existsSync(candidateDebug)) {
				Logger.info(
					`Found local Automa Core Engine (debug): ${candidateDebug}`,
				);
				return candidateDebug;
			}
		}

		// Also check relative to __dirname
		const relCandidates = [
			path.resolve(__dirname, "../core/target/release", exeName),
			path.resolve(__dirname, "../core/target/debug", exeName),
			path.resolve(__dirname, "../../core/target/release", exeName),
			path.resolve(__dirname, "../../core/target/debug", exeName),
			path.resolve(__dirname, "../../../apps/core/target/release", exeName),
			path.resolve(__dirname, "../../../apps/core/target/debug", exeName),
			path.resolve(
				__dirname,
				"../../../../automa-core/target/release",
				exeName,
			),
			path.resolve(__dirname, "../../../../automa-core/target/debug", exeName),
			path.resolve(__dirname, "../../../automa-core/target/release", exeName),
			path.resolve(__dirname, "../../../automa-core/target/debug", exeName),
			path.resolve(__dirname, "../../automa-core/target/release", exeName),
			path.resolve(__dirname, "../../automa-core/target/debug", exeName),
		];
		for (const cand of relCandidates) {
			if (fs.existsSync(cand)) {
				Logger.info(`Found local Automa Core Engine: ${cand}`);
				return cand;
			}
		}

		// 3. Global Storage / Download for Production
		if (!context) {
			throw new Error("Context is required for Production Auto-Download.");
		}

		const storagePath = context.globalStorageUri.fsPath;

		try {
			await fs.promises.access(storagePath);
		} catch {
			await fs.promises.mkdir(storagePath, { recursive: true });
		}

		const binaryName = CoreBinaryManager.getBinaryName();
		const binaryPath = path.join(storagePath, binaryName);

		try {
			await fs.promises.access(binaryPath, fs.constants.F_OK);
			Logger.info(`Found Automa Core Engine at: ${binaryPath}`);
			return binaryPath;
		} catch {
			Logger.info(`Automa Core Engine not found. Initiating download...`);
			await CoreBinaryManager.downloadBinary(binaryPath, binaryName);
			return binaryPath;
		}
	},

	async downloadBinary(destPath: string, binaryName: string): Promise<void> {
		const repoUrl = "tuquet/tuquet-automa";
		const downloadUrl = `https://github.com/${repoUrl}/releases/latest/download/${binaryName}`;

		return vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: "Downloading Automa Core Engine...",
				cancellable: false,
			},
			async (progress) => {
				return CoreBinaryManager.fetchWithRedirect(
					downloadUrl,
					destPath,
					progress,
					0,
				);
			},
		);
	},

	fetchWithRedirect(
		url: string,
		destPath: string,
		progress: vscode.Progress<{ message?: string; increment?: number }>,
		redirectCount: number,
	): Promise<void> {
		if (redirectCount > 5) {
			return Promise.reject(new Error("Too many redirects"));
		}

		return new Promise((resolve, reject) => {
			const req = https.get(url, (response) => {
				if (response.statusCode === 302 || response.statusCode === 301) {
					const location = response.headers.location;
					if (!location) {
						return reject(new Error("Redirect location is missing"));
					}
					// Đệ quy tải tiếp tục
					CoreBinaryManager.fetchWithRedirect(
						location,
						destPath,
						progress,
						redirectCount + 1,
					)
						.then(resolve)
						.catch(reject);
					return;
				}

				if (response.statusCode !== 200) {
					response.resume(); // Tiêu thụ rác
					return reject(
						new Error(`Failed to download binary: HTTP ${response.statusCode}`),
					);
				}

				const totalBytes = parseInt(
					response.headers["content-length"] || "0",
					10,
				);
				let downloadedBytes = 0;
				const file = fs.createWriteStream(destPath);

				response.on("data", (chunk: Buffer) => {
					downloadedBytes += chunk.length;
					if (totalBytes > 0) {
						const percent = Math.round((downloadedBytes / totalBytes) * 100);
						progress.report({
							message: `${percent}%`,
							increment: (chunk.length / totalBytes) * 100,
						});
					}
				});

				response.pipe(file);

				file.on("finish", async () => {
					file.close();
					if (totalBytes > 0 && downloadedBytes !== totalBytes) {
						// Tải thiếu dung lượng, xóa file rác
						await fs.promises.unlink(destPath).catch(() => {});
						return reject(new Error("Corrupted download: File size mismatch."));
					}

					// Chmod bằng Native API
					if (process.platform !== "win32") {
						try {
							await fs.promises.chmod(destPath, 0o755);
						} catch (e) {
							Logger.warn(`Failed to set executable permissions: ${e}`);
						}
					}
					resolve();
				});

				file.on("error", async (err) => {
					file.close();
					await fs.promises.unlink(destPath).catch(() => {});
					reject(err);
				});
			});

			req.on("error", async (err) => {
				await fs.promises.unlink(destPath).catch(() => {});
				reject(err);
			});
		});
	},
};
