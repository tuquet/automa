---
name: automa-cli
description: "Index directory for Automa CLI skills. Refer to sub-skills for specific CLI tasks."
---

# Automa CLI (automa-cli) - Skills Index

This directory serves as a categorized grouping for all skills related to the **Automa CLI** (`automa-cli`). 

This file acts purely as a **Referrer/Index**. Depending on your specific task, please navigate to the corresponding specialized skill below:

## Available Skills


- 💻 **[Automa CLI Run (automa-cli-run)](./automa-cli-run/SKILL.md)**
  - **Purpose:** Protocol for verifying local dependencies and running the Automa CLI tool to execute workflows.

- 🛠️ **[Automa CLI Studio (automa-cli-studio)](./automa-cli-studio/SKILL.md)**
  - **Purpose:** Protocol for programmatically injecting and opening a local workflow inside the Automa Extension Studio using Puppeteer.

> [!IMPORTANT]
> **Agents:** Do not perform tasks directly from this index. You MUST read the detailed `SKILL.md` of the respective sub-folder before proceeding with your task.
# Learning Proposal: Automa Extension UI Bypass (MV3)

## Classification
- **Type**: Skill Update
- **Target**: `C:\Users\pn.tund2\Documents\Repository\automa-ecosystem\skills\automa-cli\SKILL.md` (or a new sub-skill `automa-cli-injection.md`)

## Problem Addressed
Automa's `App.vue` actively closes itself (`browser.tabs.remove`) if `currentWindow.type !== 'popup'` and no popup states are active. This prevents `automa-cli studio` from launching the dashboard using `page.goto(studioUrl)` because standard Puppeteer tabs are not recognized as popups, causing the dashboard to instantly crash or self-close. Previous attempts to use URL bypass tricks (e.g., `?bypass=1`) crashed the Vue app initialization, preventing Database injections.

## Identified Solution
Instead of navigating via `page.goto` from a standard Puppeteer tab, we use the extension's Background Service Worker to natively create a popup window. 
By running `await chrome.windows.create({ type: 'popup', url: studioUrl })` directly within the `extWorker.evaluate` context, the new window naturally satisfies `currentWindow.type === 'popup'`, cleanly bypassing the self-close logic without causing Vue initialization crashes.

## Proposed Skill Changes
I propose updating `automa-cli\SKILL.md` to include a new section on **Extension Page Injection & Window Management**:
```markdown
### Launching Automa Extension Pages (Studio) via Puppeteer
Do NOT use `page.goto(chrome-extension://...)` to open the Automa dashboard or studio from a normal Puppeteer tab. Automa's `App.vue` will instantly close the tab if the window type is not `popup`.
Do NOT use URL query bypasses (like `?bypass=1`), as they cause Vue initialization crashes (e.g. `TypeError: Cannot read properties of undefined (reading 'id')` on `tabs[0]`) which skip critical store data loading.

**Solution:** Always inject a script into the Extension's Service Worker to create a native popup window using `chrome.windows.create`.
```typescript
const extWorker = (await extTarget.worker()) || (await extTarget.page());
await extWorker.evaluate(async (url) => {
  await chrome.windows.create({ url, type: 'popup', width: 1280, height: 800 });
}, studioUrl);
```
```

Please review and approve this learning proposal.
