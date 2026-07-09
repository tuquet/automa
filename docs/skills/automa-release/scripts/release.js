const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Starting Automa Production Release Protocol...");

  // 1. Build the Extension
  console.log("\n[1/3] Building the Automa Extension for production...");
  const automaDir = path.resolve(__dirname, '../../../../automa');
  try {
    execSync('npm run build:prod-chrome', { cwd: automaDir, stdio: 'inherit' });
  } catch (err) {
    console.error("Failed to build the extension.");
    process.exit(1);
  }

  // 2. Locate the generated zip file
  const packageJSON = require(path.join(automaDir, 'package.json'));
  const appVersion = packageJSON.version;
  const packageName = packageJSON.name;
  const zipFileName = `${packageName}-chrome-v${appVersion}.zip`;
  const zipPath = path.join(automaDir, 'build-zip', appVersion, zipFileName);

  console.log(`\n[2/3] Locating compiled zip file: ${zipPath}`);
  if (!fs.existsSync(zipPath)) {
    console.error(`Zip file not found at ${zipPath}`);
    process.exit(1);
  }

  // 3. Upload to Supabase Storage
  console.log("\n[3/3] Uploading zip file to Supabase Storage ('release' bucket)...");
  const uploadName = zipFileName;
  const backendDir = path.resolve(__dirname, '../../../../automa-be');

  try {
    // We use the native supabase CLI (since the user is already logged in)
    // IMPORTANT: In Windows, supabase CLI `storage cp` fails with absolute paths (C:\...).
    // We must pass a relative path from the CWD (backendDir) to the zip file.
    const relativeZipPath = path.relative(backendDir, zipPath);
    execSync(`supabase storage cp "${relativeZipPath}" "ss:///release/${uploadName}" --linked --experimental`, { cwd: backendDir, stdio: 'inherit' });
  } catch (error) {
    console.error("Failed to upload extension zip to Supabase:", error.message);
    process.exit(1);
  }

  console.log(`\n✅ Successfully uploaded extension zip!`);
  console.log(`Storage Path: release/${uploadName}`);
  console.log("\nThe Edge Function `download-extension` will now serve this file.");
}

main().catch(err => {
  console.error("Release script failed:", err);
  process.exit(1);
});
