# Task Tracking

## Active Tasks
- [x] Run deep code review (Self-Improvement Loop)
- [ ] Resolve typecheck / linter issues (Skipped due to env Node v20 vs pnpm v11 incompatibility)

## Blind Spots & QA
- **Performance/QA**: In `automa-vscode/src/providers/ProviderManager.ts`, `vscode.workspace.createFileSystemWatcher("**/*.{json,yaml,yml}")` was watching ALL json/yaml files in the workspace. Fixed by restricting it to `**/*.{profile,workflow,package,fleet}.json`.
- **SOLID/DRY**: In `ProviderManager.ts`, the registration logic for Panels (Profiles, Workflows, Packages, Fleets) is heavily duplicated. It should be refactored into a reusable helper method `registerAutomaFilesProvider(...)`.
