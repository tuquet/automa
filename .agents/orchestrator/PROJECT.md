# Project: Automa CLI Tool

## Architecture
- Package name: `automa-cli`
- Target path: `c:\Repository\automa-ecosystem\automa-cli`
- Design file: `c:\Repository\automa-ecosystem\automa-cli\design_and_risks.md`
- Verification script: `c:\Repository\automa-ecosystem\automa-cli\verify_cli.js`
- Unpacked extension location: `c:\Repository\automa-ecosystem\automa\build`

## Milestones
| # | Name | Scope | Dependencies | Status | Conversation ID |
|---|------|-------|-------------|--------|-----------------|
| 1 | R1: Design & Risk Analysis | Create design_and_risks.md with a Mermaid mindmap and 4 mitigations. | None | DONE | 17fe1a15-a444-48c4-b8fb-0c62b46e400f, 9cc77bd3-129c-4e7f-bd06-920329bf888f |
| 2 | R2: CLI Package | Develop the automa-cli Puppeteer-based wrapper package. | M1 | DONE | 024cc3a8-7a81-4bea-9b3f-9b16e064cde9, 38c440f1-25ca-435f-a1e2-8473aee9e2c8, fea1acbf-948b-4557-be48-c17c537e81f4 |
| 3 | Verification & Testing | Implement verify_cli.js with E2E workflow run and no-UI assertions. | M2 | DONE | 024cc3a8-7a81-4bea-9b3f-9b16e064cde9, 38c440f1-25ca-435f-a1e2-8473aee9e2c8, fea1acbf-948b-4557-be48-c17c537e81f4 |
| 4 | QA & Integrity Audit | Review code, run tests, and run Forensic Auditor checks. | M3 | DONE | 81a111c4-bd51-4c83-8647-b8009e1a8167, a468f140-1059-4e9a-8b11-941590fb2cc9, c57b581b-5db1-4a48-a877-bfcb77a9ada2, 5a1991e4-d16f-4ec7-9db8-73594656e2ee, e70e1528-5a4b-4be9-ae32-21ea90b71a36, 2d4bd128-32f5-4203-85ed-e62ac0c896d0, f76bba94-4fd4-43d9-879c-f8cc0d1814d4, 1de2b195-ebb5-47a7-b5bd-7335ce87c1e0, 6b73f3ba-0721-46ea-b41f-fe6523970302, dfaa7c84-a064-470c-801f-603cc98919d7 |

## Interface Contracts
### CLI Command
- Entry point: `node automa-cli/bin/index.js` or `node automa-cli/index.js`
- Arguments:
  - `--workflow <path>`: path to workflow JSON file.
- Behaviors:
  - Loads unpacked extension.
  - Keeps service worker alive.
  - Avoids opening popup/params tabs or pages.
  - Monitors IndexedDB or local storage for workflow state completion.
  - Exits with 0 on successful run, non-zero on error.

## Code Layout
- `automa-cli/`
  - `package.json`
  - `index.js` (CLI implementation)
  - `design_and_risks.md`
  - `verify_cli.js` (E2E verifier)
  - `sample_workflow.json` (Sample workflow for test)
