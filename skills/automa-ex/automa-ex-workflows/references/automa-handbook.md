---
name: automa-handbook
description: Master handbook containing all rules, blocks usage, and self-healing guidelines for Automa Workflows
---

# Automa Workflow Master Handbook

This document is the single source of truth for Automa workflows. It contains all mandatory rules, DOM strategies, block semantics, and self-healing patterns.


# Part 1: Rules & Anti-Patterns

---
name: automa-anti-patterns
description: Common mistakes when creating Automa workflows
---

# Common Mistakes / Anti-patterns

When building Automa workflows, strictly avoid the following mistakes:

| Mistake | Why it is wrong | Correct approach |
|---------|-----------------|------------------|
| Leaving edge `label` empty | Agent/reader cannot understand the flow | Always write a label: `"Finished filling → submit"` |
| Generic node `description`: `"Open tab"` | Unclear what this node does in the business logic | `"Open login tab {{variables.url}} to start logging in"` |
| Hardcode password in node | Exposes information, cannot be reused | Declare in `trigger.parameters`, use `{{variables.password}}` |
| Adding `element-exists` before `event-click` | The `event-click` block already has `waitForSelector` to self-check | Only use `element-exists` when needing to **branch** (exists → A, does not exist → B) |
| Guessed selector: `input.emailll` | Actual DOM often differs from expectation | Inspect actual DOM, prioritize XPath |
| Conditions only have 1 output branch | Errors are unhandled, workflow hangs | Always connect both output-1 (true) and output-2 (false) |
| `new-tab` without `waitTabLoaded: true` | Subsequent blocks run when the page hasn't loaded → fail | Always set `"waitTabLoaded": true` |
| `delay.time` is string `"1000"` | Engine might not parse it correctly | Must always be a number: `1000` |
| `drawflow` is a string (copied from export file) | Newly created workflows cannot load | When creating new, `drawflow` is an **object** `{ nodes, edges }` |
| Omitting standard UI fields like `markEl`, `events` | Omitting "optional" fields in `forms`, `get-text` breaks engine compatibility | Refer to `schemas/automa.schema.json` or verified vault files for the full exact block payload structure. Do NOT omit any required/optional keys! |
| Connecting generic edges to `BlockPackage` nodes (`node-input-1`) | The wires will connect to the visual boundary (top/bottom) instead of the actual package ports (`start`/`end`), causing the flow to break | Always inspect the `inputs` and `outputs` arrays of the embedded Package JSON and use their exact `id`s for the handles: e.g., `<nodeId>-input-<inputId>` and `<nodeId>-output-<outputId>`. |
| Using `element-exists` with short `timeout` (e.g. 1000) and `throwError: true` to verify page transitions | If the network is slightly slow, it throws `element-not-found` instantly, causing flaky workflows | Always set `timeout` to an adequate value (e.g. 5000) for network-dependent actions. If using it as a condition check, use `onError: { enable: true, toDo: "fallback" }` instead of `throwError: true` and route the fallback output! |


---
---
name: automa-workflow-review
description: Detailed review checklist for an Automa Workflow draft
---

# Review Checklist

When reviewing a Workflow (or before completing the initialization), the Agent must self-check against the following criteria:

1. **Structure Check**: Are the nodes logical for the business requirement? Do not enforce a loop if it is not truly necessary (a one-time task does not need a loop block).
2. **Logic Check**: Are the edges following the correct flow? Are the conditions/webhook branches fully connected?
3. **Documentation Check**: Does every node/edge have a detailed `description`/`label`?
3.1. **Package Edge Check**: If using `BlockPackage`, are the handles correctly mapped to the embedded package's `inputs` and `outputs` IDs (e.g., `<nodeId>-input-<inputId>`) instead of generic `-input-1`?
3.2. **Execute Workflow Context Check**: When using `execute-workflow`, you MUST inspect the target workflow's JSON to determine if it relies on `globalData` (e.g., `{{globalData.startUrl}}`) or `variables` (e.g., `{{variables.team_id}}`). Then, explicitly pass the correct context using `insertAllGlobalData: true` or `insertAllVars: true` in the block data. NEVER hallucinate or hardcode values inside the block's `globalData` string unless explicitly required.
4. **Reusability Check**: Are all inputs fully declared in `trigger.parameters`? Absolutely no hardcoding.
5. **Redundancy Check**: Do not add `element-exists` before `element-scroll`, `forms`, `event-click` — those blocks already have `waitForSelector: true` to self-check the element. `element-exists` is only used to **branch logic** (e.g., element exists → do A, does not exist → do B).
6. **Selector Check**: Prioritize XPath, inspect actual DOM, do not guess DOM (read `dom-selection.md`). Mọi selector như `//input[@type='password']` nếu tự đoán mà không có HTML thực tế đều bị coi là lỗi nghiêm trọng. Phải yêu cầu user cung cấp HTML hoặc Selector chính xác nếu chưa có!
---
name: automa-anti-patterns
description: Common mistakes when creating Automa workflows
---

# Common Mistakes / Anti-patterns

When building Automa workflows, strictly avoid the following mistakes:

| Mistake | Why it is wrong | Correct approach |
|---------|-----------------|------------------|
| Leaving edge `label` empty | Agent/reader cannot understand the flow | Always write a label: `"Finished filling → submit"` |
| Generic node `description`: `"Open tab"` | Unclear what this node does in the business logic | `"Open login tab {{variables.url}} to start logging in"` |
| Hardcode password in node | Exposes information, cannot be reused | Declare in `trigger.parameters`, use `{{variables.password}}` |
| Adding `element-exists` before `event-click` | The `event-click` block already has `waitForSelector` to self-check | Only use `element-exists` when needing to **branch** (exists → A, does not exist → B) |
| Guessed selector: `input.emailll` | Actual DOM often differs from expectation | Inspect actual DOM, prioritize XPath |
| Conditions only have 1 output branch | Errors are unhandled, workflow hangs | Always connect both output-1 (true) and output-2 (false) |
| `new-tab` without `waitTabLoaded: true` | Subsequent blocks run when the page hasn't loaded → fail | Always set `"waitTabLoaded": true` |
| `delay.time` is string `"1000"` | Engine might not parse it correctly | Must always be a number: `1000` |
| `drawflow` is a string (copied from export file) | Newly created workflows cannot load | When creating new, `drawflow` is an **object** `{ nodes, edges }` |
| Omitting standard UI fields like `markEl`, `events` | Omitting "optional" fields in `forms`, `get-text` breaks engine compatibility | Refer to `schemas/automa.schema.json` or verified vault files for the full exact block payload structure. Do NOT omit any required/optional keys! |
| Connecting generic edges to `BlockPackage` nodes (`node-input-1`) | The wires will connect to the visual boundary (top/bottom) instead of the actual package ports (`start`/`end`), causing the flow to break | Always inspect the `inputs` and `outputs` arrays of the embedded Package JSON and use their exact `id`s for the handles: e.g., `<nodeId>-input-<inputId>` and `<nodeId>-output-<outputId>`. |
| Using `element-exists` with short `timeout` (e.g. 1000) and `throwError: true` to verify page transitions | If the network is slightly slow, it throws `element-not-found` instantly, causing flaky workflows | Always set `timeout` to an adequate value (e.g. 5000) for network-dependent actions. If using it as a condition check, use `onError: { enable: true, toDo: "fallback" }` instead of `throwError: true` and route the fallback output! |


---
---
name: automa-workflow-review
description: Detailed review checklist for an Automa Workflow draft
---

# Review Checklist

When reviewing a Workflow (or before completing the initialization), the Agent must self-check against the following criteria:

1. **Structure Check**: Are the nodes logical for the business requirement? Do not enforce a loop if it is not truly necessary (a one-time task does not need a loop block).
2. **Logic Check**: Are the edges following the correct flow? Are the conditions/webhook branches fully connected?
3. **Documentation Check**: Does every node/edge have a detailed `description`/`label`?
3.1. **Package Edge Check**: If using `BlockPackage`, are the handles correctly mapped to the embedded package's `inputs` and `outputs` IDs (e.g., `<nodeId>-input-<inputId>`) instead of generic `-input-1`?
3.2. **Execute Workflow Context Check**: When using `execute-workflow`, you MUST inspect the target workflow's JSON to determine if it relies on `globalData` (e.g., `{{globalData.startUrl}}`) or `variables` (e.g., `{{variables.team_id}}`). Then, explicitly pass the correct context using `insertAllGlobalData: true` or `insertAllVars: true` in the block data. NEVER hallucinate or hardcode values inside the block's `globalData` string unless explicitly required.
4. **Reusability Check**: Are all inputs fully declared in `trigger.parameters`? Absolutely no hardcoding.
5. **Redundancy Check**: Do not add `element-exists` before `element-scroll`, `forms`, `event-click` — those blocks already have `waitForSelector: true` to self-check the element. `element-exists` is only used to **branch logic** (e.g., element exists → do A, does not exist → do B).
6. **Selector Check**: Prioritize XPath, inspect actual DOM, do not guess DOM (read `dom-selection.md`). Mọi selector như `//input[@type='password']` nếu tự đoán mà không có HTML thực tế đều bị coi là lỗi nghiêm trọng. Phải yêu cầu user cung cấp HTML hoặc Selector chính xác nếu chưa có!
7. **Condition Check**: `conditions` must always have both output branches (true + false). Do not miss the fallback.
8. **Resiliency & Self-Healing Check**: Does the workflow anticipate failures?
   - Are `onError` objects (with `toDo: "fallback"`) explicitly defined for critical network or DOM operations (and connected to a recovery block)?
   - Are `waitForSelector` and safe `waitSelectorTimeout` (e.g., 5000ms+) configured for dynamic elements?
   - If using `conditions`, are `retryConditions`, `retryCount`, and `retryTimeout` appropriately configured to poll for async events rather than failing instantly?
   - Do `javascript-code` blocks wrap risky parsing in `try...catch` and exit via `automaNextBlock({ $error: true })`?
9. **Automated Linter Check (Mandatory Gate)**: The workflow MUST pass the static linter. Run `node <skillPath>/scripts/lint_automa.js <target_json_file>` to execute the linter and verify rules.
   The linter statically validates:
   - Node Schema Integrity: Checks each block's properties against `automa.schema.json`.
   - Variable Declarations: Ensures any interpolated variable `{{variables.varName}}` or javascript-referenced variable `automaRefData('variables', 'varName')` is declared in either `trigger.parameters` or the project's global/database variables. Undeclared variables will result in lint errors.


---
# Single Node Generation Rule

**Trigger:** When the user explicitly asks to design, generate, or fix a SINGLE node (e.g., "Thiết kế cho tôi node click-element", "Cho tôi 1 node xử lý tab").

## Core Behavior

1. **Do not ask for full workflow requirements:** If the user asks for a single node, assume they are building the workflow themselves on the Automa canvas and just need a quick copy-paste snippet for a specific functionality.
2. **Output Format:**
   - Output the exact JSON structure for that node wrapped inside a JSON array (because Automa's clipboard format for nodes is an array of objects).
   - Example format:
     ```json
     [
       {
         "id": "random-uuid-or-descriptive-id",
         "label": "name-of-the-block",
         "type": "BlockBasic",
         "position": { "x": 0, "y": 0 },
         "data": { ... }
       }
     ]
     ```
3. **Data Accuracy:** Always refer to `assets/block-examples.json` to ensure the `data` object has all the required fields for that specific block type.
4. **Brief Explanation:** After providing the JSON, briefly explain 1-2 key fields (like `selector` or `onError`) so the user knows what to tweak if needed. Do not output a long tutorial unless requested.


---

# Part 2: DOM Selection & SPA Interaction

# DOM Selection / XPath Guidelines

## Rules

- **Prioritize XPath** — more accurate, supports text, position, complex relationships
- If the selector is clean (has `id`, `data-testid`, `name`) → use CSS for brevity
- **Must be unique** — uniquely identifies 1 element
- **No guessing** — if it cannot be inspected, report back immediately

---

## How to inspect

1. `F12` → `Ctrl+Shift+C` → click the element
2. Copy: Right-click in Elements → **Copy → Copy XPath**
3. Verify in Console:
```js
$x("//*[@id='root']/div[2]/form/input[1]")
```

---

## When to use XPath / CSS?

| Situation | Use | Example |
|-----------|-----|---------|
| Has `id`, `data-testid`, `name` | CSS | `#username`, `[data-testid="btn"]` |
| Find by **text** | XPath | `//button[contains(text(),'Login')]` |
| Find by **position** | XPath | `(//div[@class='item'])[3]` |
| Attribute contains dynamic string | XPath | `//a[starts-with(@href, '/product/')]` |
| Distant parent-child relationship | XPath | `//form[@id='login']//input[@type='submit']` |
| Stable class | CSS | `.btn-primary` |
| Volatile class | XPath | `//*[contains(@class, 'btn') and contains(@class, 'primary')]` |

---

## Unique XPath Strategies

### Level 1: Parent ID + tag + attribute
```xpath
//*[@id='login-form']//input[@type='email']
//form[@id='search']//button[@type='submit']
```

### Level 2: Stable attribute
```xpath
//button[@data-testid='submit']
//input[@name='email']
//a[@href='/dashboard']
```

### Level 3: Text content
```xpath
//button[text()='Login']
//span[contains(text(),'Cart')]
```

### Level 4: Class + position
```xpath
(//div[@class='product-item'])[1]//a
//ul[@class='nav']/li[3]/a
```

### Level 5: Role / aria
```xpath
//*[@role='dialog']//button[@aria-label='Close']
```

---

## Quick Validation

```js
// CSS — must return 1 element, not null
document.querySelector('#my-id')

// XPath — must return 1 element
$x("//button[contains(text(),'Login')]")[0]
```

---

## How to report errors properly

If the actual DOM cannot be inspected:

> "Cannot determine the selector — need access to the page to inspect the DOM. Recommend using interaction-block or parameter-prompt for the user to input manually."

Always enable `waitForSelector: true` + `waitSelectorTimeout: 5000` on DOM blocks.

---
# Interaction with Ant Design Vue (UI Automation)

When creating or fixing Automa workflows that interact with modern SPA frameworks (especially Vue.js + Ant Design Vue), agents must apply specific patterns. Native browser methods like `element.click()` or `element.value = 'abc'` frequently fail or get ignored by the Virtual DOM event listeners.

## 1. The `simulateClick` Pattern

Ant Design Vue buttons and UI components often bind listeners to `mousedown` or `pointerdown` rather than standard `click`. Always use the following `simulateClick` pattern in `javascript-code` blocks:

```javascript
const simulateClick = (element) => {
  if (!element) return;
  element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, view: window }));
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
  element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, view: window }));
  element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
  element.click();
};
```

**Pro-tip for Buttons:** If a button contains an inner `span` (e.g., `<button><span>Move</span></button>`), Vue sometimes registers the click on the `span`. If a click fails, ensure the button is scrolled into view and click BOTH the button and the inner `span`:
```javascript
btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
setTimeout(() => {
  simulateClick(btn);
  const innerSpan = btn.querySelector('span');
  if (innerSpan) simulateClick(innerSpan);
}, 200);
```

## 2. The `simulateInput` Pattern

When you need to force a value into an `input` and ensure Vue reacts to it (e.g. updating the `v-model`), bypassing the framework's property interception is necessary:

```javascript
const simulateInput = (element, text) => {
  element.focus();
  // Bypass framework setter overrides
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  if (setter) setter.call(element, text);
  else element.value = text;
  
  // Force framework reaction
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true })); 
};
```

## 3. Working with Ant Design Select (`ant-select`)

Never try to interact with hidden, native `<select>` tags in Ant Design. You must interact with the complex DOM structure:

1. Click the selector box to open the dropdown.
2. Wait for the popup animation.
3. Fill the hidden input (if searchable).
4. Find the correct `.ant-select-item-option` from the visible dropdown.
5. Click it.

```javascript
// 1. Open Dropdown
const teamSelector = document.querySelector('.ant-select-selector');
const teamInput = document.querySelector('.ant-select-selection-search-input'); // or just 'input'
if (teamSelector && teamInput) {
  simulateClick(teamSelector);
  await sleep(1000); // Wait for popup animation
  
  // 2. Search
  simulateInput(teamInput, targetValue);
  await sleep(1000); // Wait for filter
  
  // 3. Select Option
  const options = Array.from(document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option'));
  const match = options.find(o => o.innerText.toLowerCase().includes(targetValue.toLowerCase())) || options[0];
  if (match) { 
    simulateClick(match); 
    await sleep(500); 
  }
}
```

## 4. Working with Ant Design DatePicker (`ant-picker`)

To pick "Today":
```javascript
const dateInput = document.querySelector('.ant-picker-input input');
if (dateInput) {
  simulateClick(dateInput);
  await sleep(1000); // Wait for popup
  
  const todayBtn = document.querySelector('.ant-picker-today-btn');
  if (todayBtn) { 
    simulateClick(todayBtn); 
    await sleep(500); 
  } else {
    // Fallback: Type directly
    const today = new Date().toISOString().split('T')[0];
    simulateInput(dateInput, today);
    simulateClick(document.body); // Click outside to close
  }
}
```

## 5. Drawers and Modals Animation Timing

If a workflow involves opening an `ant-drawer` or `ant-modal` and taking an action inside it (or capturing an HTML snapshot), **never** execute immediately.
You must insert a `delay` block (or `await sleep(...)`) of **at least 1500ms - 2500ms** after clicking the trigger button to ensure the DOM tree has fully mounted and transitions are complete before attempting to interact with the modal's contents.


---

# Part 3: Block Usage & Advanced Logic

# Detailed Input / Output for Node Blocks

Below are the details of the blocks in Automa.

> **Important Note**: Every exact JSON Data Schema for each Block has been moved to the `automa.schema.json` file. Please use that Schema file as the Source of Truth when programming; this document is only meant to explain the logical meaning of the data fields.

> **Common fields for all blocks**: `description` (string), `disableBlock` (boolean), `selected` (boolean), `inGroup` (boolean), `onError` (string). These fields are not listed again in each block to avoid duplication.

## Table of Contents

### 1. Triggers & Events
- [`trigger`](#trigger) — Start the workflow
- [`browser-event`](#browser-event) — Listen for browser events
- [`trigger-event`](#trigger-event) — Trigger simulated DOM events
- [`workflow-state`](#workflow-state) — Manage workflow state

### 2. Browser & Tabs
- [`new-tab`](#new-tab) — Open a new tab
- [`go-back`](#go-back) — Go back to previous page
- [`reload-tab`](#reload-tab) — Reload the page
- [`close-tab`](#close-tab) — Close tab
- [`active-tab`](#active-tab) — Change active tab
- [`switch-tab`](#switch-tab) — Switch tab
- [`new-window`](#new-window) — Open a new window
- [`switch-to`](#switch-to) — Switch iframe/shadow DOM context
- [`forward-page`](#forward-page) — Go forward page
- [`tab-url`](#tab-url) — Navigate URL

### 3. Web Interactions
- [`event-click`](#event-click) — Click element
- [`forms`](#forms) — Input/extract forms
- [`get-text`](#get-text) — Extract text
- [`element-scroll`](#element-scroll) — Scroll element
- [`hover-element`](#hover-element) — Hover element
- [`attribute-value`](#attribute-value) — Get HTML attribute
- [`element-exists`](#element-exists) — Check element existence
- [`take-screenshot`](#take-screenshot) — Take screenshot
- [`upload-file`](#upload-file) — Upload file
- [`press-key`](#press-key) — Press key
- [`create-element`](#create-element) — Create HTML element
- [`verify-selector`](#verify-selector) — Verify selector
- [`link`](#link) — Extract link
- [`save-assets`](#save-assets) — Save assets

### 4. Flow & Logic
- [`delay`](#delay) — Delay execution
- [`conditions`](#conditions) — If/Else branching
- [`loop-data`](#loop-data) — Loop through array
- [`loop-elements`](#loop-elements) — Loop through DOM elements
- [`loop-breakpoint`](#loop-breakpoint) — Break/Continue loop
- [`while-loop`](#while-loop) — Loop based on condition
- [`repeat-task`](#repeat-task) — Repeat for a fixed number of times
- [`execute-workflow`](#execute-workflow) — Execute sub-workflow
- [`blocks-group`](#blocks-group) — Group blocks
- [`block-package`](#block-package) — Extension package
- [`ai-workflow`](#ai-workflow) — AI integration

### 5. Data & Variables
- [`insert-data`](#insert-data) — Save into table
- [`export-data`](#export-data) — Export data
- [`log-data`](#log-data) — Log data
- [`increase-variable`](#increase-variable) — Increase/decrease variable
- [`slice-variable`](#slice-variable) — Slice string/array
- [`regex-variable`](#regex-variable) — Regex on variable
- [`data-mapping`](#data-mapping) — Map data structure
- [`sort-data`](#sort-data) — Sort data
- [`delete-data`](#delete-data) — Delete data

### 6. Integrations & Advanced
- [`javascript-code`](#javascript-code) — Run custom JS
- [`webhook`](#webhook) — Call HTTP API
- [`google-sheets`](#google-sheets) — Google Sheets integration
- [`notification`](#notification) — Push notification
- [`parameter-prompt`](#parameter-prompt) — Input prompt popup
- [`clipboard`](#clipboard) — Copy/Paste
- [`handle-dialog`](#handle-dialog) — Handle alert/confirm dialogs
- [`handle-download`](#handle-download) — Manage file downloads
- [`wait-connections`](#wait-connections) — Wait for network idle
- [`proxy`](#proxy) — Configure proxy
- [`interaction-block`](#interaction-block) — Wait for manual interaction
- [`google-drive`](#google-drive) — Google Drive integration
- [`google-sheets-drive`](#google-sheets-drive) — Sheets + Drive
- [`note`](#note) — Non-executing note

---

## 1. Triggers & Events

### `trigger`
The starting block of the workflow, defining how the script is activated.
- **Input (`data`)**:
  - `type` (string): Activation method. Values: `"manual"`, `"interval"`, `"context-menu"`, `"specific-day"`, `"cron"`, `"on-element"`, `"webhook"`.
  - `interval` (number): Loop interval (seconds) — used when `type = "interval"`.
  - `delay` (number): Delay before execution (seconds).
  - `shortcut` (string): Keyboard shortcut to trigger.
  - `url` (string): URL pattern to trigger automatically.
  - `isUrlRegex` (boolean): Allow regex in `url`.
  - `contextMenuName` (string): Display name in the right-click context menu.
  - `contextTypes` (array): Type of context menu (`["selection"]`, `["link"]`, `["image"]`, `["page"]`...).
  - `parameters` (array): List of input parameters — each element contains `id`, `label`, `type` (`"text"`, `"number"`, `"select"`, `"file"`), `defaultValue`, `required`, `options`.
  - `activeInInput` (boolean): Activate even when the cursor is in an input field.
  - `date` (string): Execution date (yyyy-MM-dd).
  - `time` (string): Execution time (HH:mm).
  - `days` (array): Days of the week (`["mon","tue","wed","thu","fri","sat","sun"]`).
  - `observeElement` (object): Observe DOM element configuration — includes `selector`, `baseSelector`, `baseElOptions`, `targetOptions`, `matchPattern`.
  - `preferParamsInTab` (boolean): Show parameter prompt popup in tab instead of a small popup.
- **Output**: Initializes workflow context and transfers control to the next block. If `parameters` exist, user input data is saved to `$variables.<name>` variables.

### `browser-event`
Listen to browser events (such as tab created, tab updated, tab removed, window changed).
- **Input (`data`)**:
  - `eventType` (string): Event type — `"tab-created"`, `"tab-updated"`, `"tab-removed"`, `"tab-activated"`, `"window-created"`, `"window-removed"`, `"download-completed"`.
  - `urlFilter` (string): URL pattern to filter events (triggers only when URL matches).
  - `isUrlRegex` (boolean): Allow regex in `urlFilter`.
- **Output**: When the event occurs, detailed event information is saved to variables (e.g., `$tabId`, `$url`, `$windowId`).

### `trigger-event`
Trigger a simulated DOM event on a webpage element.
- **Input (`data`)**:
  - `selector` (string): CSS selector of the target element.
  - `eventType` (string): Event type — `"click"`, `"mouseover"`, `"mouseout"`, `"keydown"`, `"keyup"`, `"focus"`, `"blur"`, `"change"`, `"submit"`, `"scroll"`, `"custom"`.
  - `eventDetail` (object): Additional data for the event (e.g., `keyCode` for keyboard events, `clientX`/`clientY` for mouse events).
- **Output**: Event is triggered on the DOM, returns no data.

### `workflow-state`
Manage the state of the running workflow (pause, stop, wait).
- **Input (`data`)**:
  - `action` (string): Action — `"pause"`, `"stop"`, `"wait"`, `"resume"`.
  - `condition` (string): Trigger condition (e.g., based on a variable or result from a previous block).
- **Output**: Workflow transitions to the state specified by the action.

---

## 2. Browser & Tabs

### `new-tab`
Open a new tab in the browser.
- **Input (`data`)**:
  - `url` (string): Webpage URL to open (required). Supports variable interpolation `{{variable}}`.
  - `updatePrevTab` (boolean): If `true`, update the current tab instead of opening a new tab.
  - `active` (boolean): Change focus to this tab immediately after opening.
  - `customUserAgent` (boolean) + `userAgent` (string): Enable/disable and set a simulated device User-Agent.
  - `waitTabLoaded` (boolean): Wait until the tab is fully loaded.
- **Output**: New tab is created and activated. The opened URL is saved to internal engine variables.

### `go-back`
Go back to the previous page in the current tab's history.
- **Input (`data`)**:
  - `onError` (string): Behavior on error (`"stop-workflow"`, `"continue"`,...).
- **Output**: Goes back to the previous page, returns no data.

### `reload-tab`
Reload the current page.
- **Input (`data`)**: No special parameters.
- **Output**: Page is reloaded, returns no data.

### `close-tab`
Close the current tab.
- **Input (`data`)**: No parameters.
- **Output**: Tab is closed, workflow moves to the next block.

### `active-tab`
Change focus to a specific tab based on index or URL.
- **Input (`data`)**:
  - `tab` (string): Method to identify tab — `"by-index"`, `"by-url"`, `"last-tab"`, `"next-tab"`, `"previous-tab"`, `"first-tab"`.
  - `value` (string): Corresponding value — tab index (number) or URL pattern.
- **Output**: Focus switches to the target tab, returns no data.

### `switch-tab`
Switch back and forth between open tabs (similar to the Ctrl+Tab shortcut).
- **Input (`data`)**:
  - `direction` (string): Switch direction — `"next"` or `"previous"`.
  - `times` (number): Number of switches (default is 1).
- **Output**: Switches tab, returns no data.

### `new-window`
Open a new browser window.
- **Input (`data`)**:
  - `url` (string): URL to open in the new window.
  - `active` (boolean): Focus on the new window immediately after opening.
  - `width` / `height` (number): Window size (pixels).
  - `left` / `top` (number): Window position on screen.
  - `incognito` (boolean): Open in incognito mode.
- **Output**: New window is created, tab is activated.

### `switch-to`
Switch focus context to an iframe, shadow DOM, or another frame.
- **Input (`data`)**:
  - `target` (string): Target context — `"iframe"`, `"shadow-dom"`, `"parent-frame"`, `"default-content"`.
  - `selector` (string): CSS selector of the iframe or shadow host (used when `target = "iframe"` or `"shadow-dom"`).
  - `index` (number): iframe index if there are multiple iframes (0-indexed).
- **Output**: Context switches to the new region, subsequent DOM blocks will interact within that region.

### `forward-page`
Go forward to the next page in the current tab's browser history.
- **Input (`data`)**: No special parameters.
- **Output**: Goes forward page, returns no data.

### `tab-url`
Navigate to a URL directly on the current tab.
- **Input (`data`)**:
  - `url` (string): URL to navigate to.
- **Output**: Tab is navigated to the new URL.

---

## 3. Web Interactions

### `event-click`
Simulate a mouse click on an element on the page.
- **Input (`data`)**:
  - `selector` (string): CSS selector of the HTML element to click. Supports variable interpolation.
  - `findBy` (string): Element search method. Usually `"cssSelector"`.
  - `waitForSelector` (boolean): Wait for the element to appear before clicking.
  - `waitSelectorTimeout` (number): Maximum wait time (ms).
  - `multiple` (boolean): Click consecutively on all elements matching the selector.
  - `markEl` (boolean): Mark the element with a red border for easier debugging.
- **Output**: Returns no data directly, automatically transfers control to the next node after a successful click.

### `forms`
Input or extract data from forms (input, textarea, select, checkbox).
- **Input (`data`)**:
  - `selector` (string): CSS selector of the form input element. Supports variable interpolation.
  - `type` (string): Form element type: `"text-field"`, `"checkbox"`, `"select"`, `"radio"`, `"file"`.
  - `value` (string/number): Value to input (applied when `getValue = false`). Supports variable interpolation `{{variable}}`.
  - `getValue` (boolean): If `true`, the block will **extract** the current value instead of **inputting**.
  - `clearValue` (boolean): Clear the input field before filling.
  - `multiple` (boolean): Apply action to all elements matching the selector.
  - `delay` (number): Delay (ms) between each keystroke to bypass anti-bot mechanisms.
  - `assignVariable` (boolean): Assign result to a variable.
  - `variableName` (string): Variable name to store the result.
  - `saveData` (boolean): Save result to the data table.
  - `dataColumn` (string): Column ID in the table to save.
  - `selectOptionBy` (string): Select option in dropdown by `"value"` or `"text"`.
  - `optionPosition` (number): Option position in dropdown (1-indexed).
  - `waitForSelector` (boolean) + `waitSelectorTimeout` (number): Wait for the element to appear.
  - `markEl` (boolean): Mark element for debugging.
  - `findBy` (string): Search method (`"cssSelector"`).
  - `events` (array): List of secondary events (e.g., `change`, `blur`) triggered after input.
- **Output**: 
  - If `getValue = true`: Returns a string value or an array if `multiple = true`.
  - If `getValue = false`: Returns `null`.

### `get-text`
Extract text content from one or multiple elements.
- **Input (`data`)**:
  - `selector` (string): CSS selector of the element. Supports variable interpolation `{{loopData@items}}` for use with `loop-elements`.
  - `multiple` (boolean): Extract from all matching tags (returns an array).
  - `includeTags` (boolean): Extract `outerHTML` instead of text.
  - `useTextContent` (boolean): Extract via `textContent` instead of `innerText` (preserves original whitespace).
  - `regex` (string) + `regexExp` (array): Regex pattern and flags (`"g"`, `"i"`) to extract specific parts.
  - `prefixText` / `suffixText` (string): String inserted before/after the extracted text.
  - `findBy` (string): Search method.
  - `saveData` (boolean): Save to the data table.
  - `dataColumn` (string): Column ID in the table.
  - `assignVariable` (boolean) + `variableName` (string): Save to a variable.
  - `addExtraRow` (boolean) + `extraRowDataColumn` (string) + `extraRowValue` (string): Add an extra row with a static value.
  - `waitForSelector` (boolean) + `waitSelectorTimeout` (number): Wait for the element to appear.
  - `markEl` (boolean): Mark element for debugging.
- **Output**: Returns a `string` (if `multiple = false`) or `array` (if `multiple = true`).

### `element-scroll`
Scroll the webpage to a specific element or position.
- **Input (`data`)**:
  - `selector` (string): CSS selector of the element to scroll to.
  - `findBy` (string): Search method.
  - `scrollIntoView` (boolean): Scroll the element into the viewport.
  - `scrollX` / `scrollY` (number): Scroll to specific pixel coordinates.
  - `incX` / `incY` (boolean): Relative scrolling (added to the current position).
  - `smooth` (boolean): Smooth scrolling behavior.
  - `waitForSelector` (boolean) + `waitSelectorTimeout` (number): Wait for the element to appear.
  - `markEl` (boolean): Mark element for debugging.
- **Output**: Returns no data, only performs the scroll action.

### `hover-element`
Simulate hovering the mouse over an element.
- **Input (`data`)**:
  - `selector` (string): CSS selector of the element to hover.
- **Output**: Returns no data.

### `attribute-value`
Get the HTML attribute value of an element.
- **Input (`data`)**:
  - `selector` (string): CSS selector.
  - `attributeName` (string): Attribute name (e.g., `href`, `src`, `data-id`).
- **Output**: Returns the attribute value as a string.

### `element-exists`
Wait for or check the existence of an element on the DOM.
- **Input (`data`)**:
  - `selector` (string): CSS selector.
  - `timeout` (number): Maximum wait time (ms).
- **Output**: Boolean — `true` if the element exists, `false` if wait time expires.

### `take-screenshot`
Take a screenshot of the current webpage.
- **Input (`data`)**:
  - `type` (string): Capture type — `"full-page"`, `"viewport"`, `"element"`.
  - `selector` (string): CSS selector of the element to capture (used when `type = "element"`).
  - `format` (string): Image format — `"png"`, `"jpeg"`, `"webp"`.
  - `quality` (number): Image quality (0-100, only for JPEG/WebP).
  - `saveData` (boolean): Save to the data table.
  - `assignVariable` (boolean) + `variableName` (string): Save to a variable as a base64 string.
- **Output**: Returns image data as a base64 string or the saved file path.

### `upload-file`
Simulate file upload via `<input type="file">`.
- **Input (`data`)**:
  - `selector` (string): CSS selector of the file input element.
  - `filePath` (string): Path of the file to upload.
  - `multiple` (boolean): Select multiple files at once.
  - `filePaths` (array): List of multiple files (used when `multiple = true`).
- **Output**: File is selected, returns no data.

### `press-key`
Simulate keystrokes on the webpage.
- **Input (`data`)**:
  - `keys` (array): List of keys to press — each element is a key code (e.g., `"Tab"`, `"Enter"`, `"Escape"`, `"ArrowDown"`, `"a"`, `"ctrl+c"`, `"Control"`, `"Shift"`, `"Alt"`).
  - `target` (string): CSS selector of the target element to send key events (if empty, sends to the document).
  - `delay` (number): Delay (ms) between each keystroke.
  - `times` (number): Number of times to repeat the keystroke combination.
- **Output**: Keyboard action is executed, returns no data.

### `create-element`
Create a new HTML element and inject it into the current page's DOM.
- **Input (`data`)**:
  - `html` (string): HTML string of the element to create (e.g., `'<div class="my-banner">Hello</div>'`).
  - `targetSelector` (string): CSS selector of the parent element to insert into.
  - `position` (string): Insertion position — `"beforebegin"`, `"afterbegin"`, `"beforeend"`, `"afterend"` (similar to `insertAdjacentHTML`).
- **Output**: HTML element is injected into the DOM, returns no data.

### `verify-selector`
Verify if a CSS selector is valid and exists on the page.
- **Input (`data`)**:
  - `selector` (string): CSS selector to verify.
- **Output**: Boolean — `true` if selector is valid and element exists, `false` otherwise.

### `link`
Find and extract link URLs from `<a>` tags on the page.
- **Input (`data`)**:
  - `selector` (string): CSS selector (default `"a"`).
  - `attribute` (string): Attribute to extract — `"href"`, `"text"`, `"title"`.
- **Output**: Returns an array of URLs or texts of the found links.

### `save-assets`
Automatically download and save assets (images, videos, files) from the webpage.
- **Input (`data`)**:
  - `assetType` (string): Asset type — `"images"`, `"videos"`, `"audios"`, `"documents"`, `"all"`.
  - `selector` (string): CSS selector to filter specific assets.
  - `downloadPath` (string): Local directory path to save the files.
  - `renamePattern` (string): File renaming pattern (e.g., `"image_{index}"`).
- **Output**: Assets are downloaded to the specified directory, returns a list of file paths.

---

## 4. Flow & Logic

### `delay`
Pause the script execution for a specified amount of time.
- **Input (`data`)**:
  - `time` (number): Wait time in milliseconds (default 500ms).
- **Output**: Continues to the next block after the wait time expires.

### `conditions`
Branch the script execution (If/Else) based on multiple conditions.
- **Input (`data`)**:
  - `conditions` (array): List of conditions. Each condition contains `id` (branch identifier) and a comparison expression.
  - `retryConditions` (boolean): Retry checking if no conditions are true.
- **Output**: Redirects flow to the matching condition branch.

### `loop-data`
Loop through an array of data.
- **Input (`data`)**:
  - `loopId` (string): UUID identifying the loop.
  - `loopThrough` (string): Data type to loop — `"custom-data"`, `"numbers"`, `"table"`, `"elements"`, `"google-sheets"`, `"variable"`.
  - `loopData` (array): Static data array (used when `loopThrough = "custom-data"`).
  - `variableName` (string): Variable name containing the array (used when `loopThrough = "variable"`).
  - `referenceKey` (string): Reference key.
  - `fromNumber` / `toNumber` (number): Number range (used when `loopThrough = "numbers"`).
  - `maxLoop` (number): Maximum number of iterations (0 = unlimited).
  - `startIndex` (number): Starting index (0-indexed).
  - `resumeLastWorkflow` (boolean): Resume from the last stopped position.
  - `elementSelector` (string): CSS selector (used when `loopThrough = "elements"`).
  - `waitForSelector` (boolean) + `waitSelectorTimeout` (number): Wait for the element to appear.
- **Output**: On each cycle, the engine records:
  - `{{loopData.<loopId>.data}}` — current element value.
  - `{{loopData.<loopId>.<field>}}` — specific field if the element is an object.
  - Syntax `{{loopData@<loopId>}}` — reference current element in selectors.

### `loop-elements`
Loop through a list of DOM elements on the page.
- **Input (`data`)**:
  - `loopId` (string): UUID identifying the loop.
  - `selector` (string): CSS selector to find the list of DOM elements.
  - `findBy` (string): Search method.
  - `maxLoop` (number): Maximum number of elements to iterate (0 = unlimited).
  - `reverseLoop` (boolean): Iterate backwards from the end.
  - `loadMoreAction` (string): Load more action — `"scroll"`, `"click"`, or `""` (none).
  - `scrollToBottom` (boolean): Scroll to the bottom to trigger lazy loading.
  - `actionElSelector` (string): CSS selector of the "Load more" button (used when `loadMoreAction = "click"`).
  - `actionElMaxWaitTime` (number): Maximum wait time (seconds) for the load more button.
  - `actionPageMaxWaitTime` (number): Maximum wait time (seconds) per load action.
  - `waitForSelector` (boolean) + `waitSelectorTimeout` (number): Wait for the list to appear.
- **Output**: On each cycle, the current DOM element can be referenced via `{{loopData.<loopId>}}` in the selector of child blocks.

### `loop-breakpoint`
Loop breakpoint (`break`/`continue`).
- **Input (`data`)**:
  - `loopId` (string): UUID of the target loop.
  - `clearLoop` (boolean): If `true`, exit the loop (break). If `false`, move to the next iteration (continue).
- **Output**: Controls the loop, returns no data.
- **Usage**: Typically placed at the end of the loop, connected back to the beginning of the loop block to form a cycle.

### `while-loop`
Loop execution until a condition becomes false.
- **Input (`data`)**:
  - `loopId` (string): UUID identifying the loop.
  - `condition` (object): Condition configuration containing:
    - `variable` (string): Variable name to check.
    - `comparison` (string): Comparison operator — `"equals"`, `"not-equals"`, `"greater-than"`, `"less-than"`, `"contains"`, `"starts-with"`, `"ends-with"`, `"empty"`, `"not-empty"`.
    - `value` (string): Value to compare against.
  - `maxLoop` (number): Maximum loop limit (prevents infinite loops).
- **Output**: Loops until the condition is false. Variable `{{loopData.<loopId>.count}}` stores the iteration count.

### `repeat-task`
Repeat a group of tasks for a predefined number of times.
- **Input (`data`)**:
  - `repeatFor` (number): Number of repetitions.
- **Output**: Repeats child blocks for the specified times. Variable `{{$repeatIndex}}` contains the current iteration index (starts from 0).

### `execute-workflow`
Call and execute another Automa workflow (sub-workflow) and wait for the result.
- **Input (`data`)**:
  - `workflowId` (string): ID of the workflow to call (can be selected from available workflows).
  - `params` (array): Parameters passed to the sub-workflow — array of objects `{ name: "...", value: "..." }`.
  - `waitForResult` (boolean): Wait for the sub-workflow to complete before continuing.
  - `assignVariable` (boolean) + `variableName` (string): Save sub-workflow result to a variable.
- **Output**: Result returned from the sub-workflow (if `waitForResult = true`).

### `blocks-group`
Group blocks together to organize and collapse the canvas UI.
- **Input (`data`)**:
  - `groupId` (string): UUID identifying the group.
  - `groupName` (string): Display name of the group.
  - `collapsed` (boolean): Collapse the group visually.
  - `color` (string): Group border color.
- **Output**: Does not affect data flow, only organizes the interface.

### `block-package`
Use an extension package within the workflow. Custom packages are incredibly powerful because they can act as a **Test Case Branching Router**.
- **Input (`data`)**:
  - `packageId` (string): Installed package ID.
  - `blockName` (string): Block name inside the package.
  - `config` (object): Custom configuration based on the package definition.
- **Output**:
  - Packages can define **Multiple Source Handles (Outputs)** depending on the execution result. 
  - **Best Practice (Test Automation):** Instead of using complex `Conditions` blocks, a custom package (e.g., "Test Login Form") can evaluate the UI and expose multiple output paths such as:
    - 🟢 `output-success` ➔ Route to "Continue Test / Log Success"
    - 🔴 `output-failed` ➔ Route to "Take Error Screenshot"
    - 🟡 `output-wrong-pass` ➔ Route to "Log Validation Error"
    - 🟠 `output-network-error` ➔ Route to "Retry Logic"
  - This turns Automa into a highly visual and maintainable flow-based testing tool.

### `ai-workflow`
AI integration block — calls AI services (chat, text generation, analysis) within the workflow.
- **Input (`data`)**:
  - `provider` (string): AI provider — `"openai"`, `"google-gemini"`, `"anthropic"`, `"custom"`.
  - `model` (string): Model name (e.g., `"gpt-4"`, `"gpt-3.5-turbo"`, `"gemini-pro"`).
  - `prompt` (string): Prompt sent to AI. Supports variable interpolation.
  - `systemPrompt` (string): System prompt to guide AI behavior.
  - `temperature` (number): Creativity degree (0-1, default 0.7).
  - `maxTokens` (number): Maximum tokens in response.
  - `assignVariable` (boolean) + `variableName` (string): Save result to a variable.
- **Output**: Returns text response from the AI model.

---

## 5. Data & Variables

### `insert-data`
Save data into the workflow's table.
- **Input (`data`)**:
  - `dataList` (array): List of column-value pairs to save. Each element: `{ column: "<columnId>", value: "<value>" }`. Supports variable interpolation in `value`.
- **Output**: Data is added as a new row to the table, returns no value.

### `export-data`
Export data from the table to a file.
- **Input (`data`)**:
  - `type` (string): Export format — `"csv"`, `"json"`, `"plain-text"`.
  - `name` (string): Exported file name.
  - `dataToExport` (string): Data source — `"data-columns"` (export table), or variable name.
  - `csvDelimiter` (string): CSV delimiter (default `","`).
  - `addBOMHeader` (boolean): Add BOM header for UTF-8 (supports Excel for displaying characters properly).
  - `onConflict` (string): Behavior when file exists — `"uniquify"` (add numeric suffix), `"overwrite"`, `"skip"`.
  - `refKey` (string): Reference key.
- **Output**: File is downloaded or saved to a specified directory.

### `log-data`
Print logs to the console or execution log history.
- **Input (`data`)**:
  - `message` (string): Content to log. Supports variable interpolation.
  - `level` (string): Log level — `"info"`, `"warn"`, `"error"`, `"debug"`.
- **Output**: Displays the log, doesn't affect execution flow.

### `increase-variable`
Increase or decrease the numeric value of a variable.
- **Input (`data`)**:
  - `variableName` (string): Variable name to modify.
  - `step` (number): Increment/decrement step (negative for decrement, default 1).
  - `min` (number): Minimum value (if falls below, sets to min).
  - `max` (number): Maximum value (if exceeds, sets to max).
  - `loopMode` (boolean): If `true`, loop around (returns to `min` when exceeding `max` and vice versa).
- **Output**: Variable is updated with the new value.

### `slice-variable`
Slice a string or array from a variable.
- **Input (`data`)**:
  - `variableName` (string): Source variable name (string or array).
  - `start` (number): Starting index (0-indexed, supports negative).
  - `end` (number): Ending index (exclusive, supports negative).
  - `assignVariable` (boolean) + `resultVariableName` (string): Variable name to store the result.
- **Output**: Returns the sliced portion (substring or sub-array).

### `regex-variable`
Apply Regular Expression (Regex) to a string variable.
- **Input (`data`)**:
  - `variableName` (string): Source variable name.
  - `pattern` (string): Regex pattern (e.g., `\d+`, `[a-z]+`).
  - `flags` (string): Regex flags — `"g"` (global), `"i"` (case-insensitive), `"m"` (multiline).
  - `replace` (string): If provided, performs replace instead of match.
  - `replaceWith` (string): Replacement value (used when `replace` is specified).
  - `assignVariable` (boolean) + `resultVariableName` (string): Variable name to store the result.
- **Output**: Returns a match array or the replaced string.

### `data-mapping`
Transform and map data structures (transform object keys).
- **Input (`data`)**:
  - `inputVariable` (string): Input variable name.
  - `mappings` (array): List of mapping rules — each element: `{ from: "old_key", to: "new_key", transform: "lowercase"|"uppercase"|"trim"|"number"|"string" }`.
  - `assignVariable` (boolean) + `resultVariableName` (string): Variable name to store the result.
- **Output**: Transformed data with new keys.

### `sort-data`
Sort data in a table or an array.
- **Input (`data`)**:
  - `sourceType` (string): Data source — `"data-columns"` (table) or `"variable"` (array variable).
  - `variableName` (string): Variable name (used when `sourceType = "variable"`).
  - `sortBy` (string): Key to sort by (if data is an object array).
  - `order` (string): Order — `"asc"` (ascending) or `"desc"` (descending).
  - `assignVariable` (boolean) + `resultVariableName` (string): Variable name to store the result.
- **Output**: Sorted data.

### `delete-data`
Delete a variable, data in the table, or the entire table.
- **Input (`data`)**:
  - `targetType` (string): Target — `"variable"`, `"data-columns"`, `"all-data"`.
  - `variableName` (string): Variable name to delete (used when `targetType = "variable"`).
  - `rowIndex` (number): Row index to delete in the table (-1 to delete all).
- **Output**: Data is deleted, returns no value.

---

## 6. Integrations & Advanced

### `javascript-code`
Run custom JS code with access to Automa's APIs.
- **Input (`data`)**:
  - `code` (string): JavaScript code block.
  - `everyNewTab` (boolean): Automatically inject script into every new tab.
  - `timeout` (number): Maximum wait time (ms) before timeout.
  - `preloadScripts` (array): List of preloaded library URLs (jQuery, Lodash...).
  - `runBeforeLoad` (boolean): Run script before the page loads.
- **Available API functions in sandbox**:
  - `automaNextBlock(data)`: Trigger next block and pass data.
  - `automaSetVariable(name, value)`: Write variable.
  - `automaRefData(type, name)`: Read data (variables, table, globalData...).
- **Output**: Data passed from `automaNextBlock({...})` becomes input for the next block.

### `webhook`
Send HTTP requests (API calls).
- **Input (`data`)**:
  - `url` (string): API endpoint (required). Supports variable interpolation.
  - `method` (string): HTTP method — `GET`, `POST`, `PUT`, `DELETE`, `PATCH`.
  - `headers` (array): Array of objects `{ name: "...", value: "..." }`.
  - `body` (string/object): Request body content.
  - `responseType` (string): Response type — `"json"`, `"text"`, `"base64"`.
  - `assignVariable` (boolean) + `variableName` (string): Save to a variable.
  - `saveData` (boolean) + `dataPath` (string): Save to the table by object path (e.g., `$response.data.id`).
- **Output**: Response payload. Supports fallback — if request fails, the flow can branch to an error connection.

### `google-sheets`
Interact with Google Sheets API.
- **Input (`data`)**:
  - `type` (string): Action — `"update"`, `"get"`, `"append"`, `"clear"`.
  - `spreadsheetId` (string): Google Sheet ID.
  - `range` (string): Range (e.g., `"Sheet1!A1:C10"`).
  - `dataFrom` (string): Data source — `"data-columns"` (from table), `"custom-data"`.
  - `customData` (string): Custom JSON string data.
  - `InsertDataOption` (string): `"INSERT_ROWS"` or `"OVERWRITE"`.
  - `valueInputOption` (string): `"RAW"` or `"USER_ENTERED"`.
  - `assignVariable` (boolean) + `variableName` (string): Save result from Sheet to variable.
  - `saveData` (boolean): Save result to table.
  - `keysAsFirstRow` (boolean): Use keys as the first row.
  - `firstRowAsKey` (boolean): Use first row as keys.
  - `refKey` (string): Reference key.
- **Output**: Data from the Sheet or confirmation of a successful write.

### `notification`
Show browser push notifications to the user.
- **Input (`data`)**:
  - `title` (string): Notification title. Supports variable interpolation.
  - `message` (string): Notification message. Supports variable interpolation.
  - `icon` (string): Icon URL to show on notification.
  - `silent` (boolean): Disable notification sound.
- **Output**: Notification is displayed, workflow continues.

### `parameter-prompt`
Show an input prompt popup requesting parameters from the user before continuing.
- **Input (`data`)**:
  - `title` (string): Popup title.
  - `description` (string): Guidance description for the user.
  - `fields` (array): List of input fields — each element: `{ id: "...", label: "...", type: "text"|"number"|"select"|"checkbox"|"file", defaultValue: "...", required: true/false, options: ["op1","op2"] }` (options used for type select).
  - `buttonText` (string): Text on the confirmation button (default "OK").
- **Output**: User input data is saved to `$variables.<id>` variables.

### `clipboard`
Read from or write data to the clipboard.
- **Input (`data`)**:
  - `action` (string): Action — `"copy"` (write) or `"paste"` (read).
  - `value` (string): Value to copy (used when `action = "copy"`). Supports variable interpolation.
  - `assignVariable` (boolean) + `variableName` (string): Save pasted result to a variable (used when `action = "paste"`).
- **Output**: 
  - If `action = "copy"`: Value is written to the clipboard, returns no data.
  - If `action = "paste"`: Returns clipboard content.

### `handle-dialog`
Automatically handle JavaScript dialogs (alert, confirm, prompt) on the webpage.
- **Input (`data`)**:
  - `action` (string): Action — `"accept"` (OK), `"dismiss"` (Cancel).
  - `dialogType` (string): Dialog type — `"alert"`, `"confirm"`, `"prompt"`, `"beforeunload"`, `"all"`.
  - `response` (string): Response value for prompt (used when `dialogType = "prompt"`).
- **Output**: Dialog is handled automatically, workflow is not blocked.

### `handle-download`
Manage and monitor browser file download events.
- **Input (`data`)**:
  - `action` (string): Action — `"allow"`, `"block"`, `"save"` (save to a specified directory).
  - `downloadPath` (string): Directory to save file (used when `action = "save"`).
  - `fileTypes` (array): List of allowed file extensions (e.g., `[".pdf", ".csv", ".xlsx"]`).
  - `renamePattern` (string): Renaming pattern (e.g., `"report_{date}"`).
  - `assignVariable` (boolean) + `variableName` (string): Save downloaded file information to a variable (includes `filename`, `url`, `fileSize`).
- **Output**: File is handled according to configuration, returns file information if available.

### `wait-connections`
Wait until all network connections on the current tab are in an idle state.
- **Input (`data`)**:
  - `timeout` (number): Maximum wait time (ms) before bypassing.
  - `idleTime` (number): Time (ms) with no active requests to be considered idle.
- **Output**: Continues when the network has no active processing requests or times out.

### `proxy`
Configure HTTP/SOCKS proxy for the workflow's network requests.
- **Input (`data`)**:
  - `protocol` (string): Proxy type — `"http"`, `"https"`, `"socks4"`, `"socks5"`.
  - `host` (string): Proxy IP address or hostname.
  - `port` (number): Proxy port.
  - `username` (string): Username (if proxy requires auth).
  - `password` (string): Password (if proxy requires auth).
  - `bypassList` (array): List of URLs bypassing the proxy (e.g., `["localhost", "*.internal.com"]`).
  - `enabled` (boolean): Enable/disable proxy.
- **Output**: Proxy is applied to all requests from the workflow.

### `interaction-block`
Wait for manual user interaction — show instructions and a confirmation button.
- **Input (`data`)**:
  - `message` (string): Instruction for the user (e.g., "Please solve the captcha and click Continue").
  - `title` (string): Instruction popup title.
  - `timeout` (number): Maximum wait time (seconds). Automatically bypasses if timed out without interaction.
- **Output**: Workflow continues when the user confirms the manual action is completed.

### `google-drive`
Interact with Google Drive API — read, create, delete files on Google Drive.
- **Input (`data`)**:
  - `type` (string): Action — `"list"` (list files), `"upload"`, `"download"`, `"delete"`, `"search"`.
  - `fileId` (string): File ID on Drive (used for download/delete).
  - `fileName` (string): File name to search or create.
  - `folderId` (string): Folder ID on Drive.
  - `mimeType` (string): File MIME type (e.g., `"text/csv"`, `"application/json"`, `"application/pdf"`).
  - `dataFrom` (string): Upload data source — `"data-columns"` (from table) or `"variable"`.
  - `assignVariable` (boolean) + `variableName` (string): Save result (file list or file content) to a variable.
- **Output**: 
  - `list`/`search`: Returns an array of file info (id, name, mimeType, size, modifiedTime).
  - `download`: Returns file content.
  - `upload`/`delete`: Confirmation of success.

### `google-sheets-drive`
Combine Google Sheets and Google Drive — create a new Sheet from data and save to Drive.
- **Input (`data`)**:
  - `type` (string): Action — `"create"` (create new Google Sheets file), `"export-to-drive"` (export table data to a file on Drive).
  - `spreadsheetTitle` (string): Title of the new Sheets file.
  - `folderId` (string): Drive folder ID to save the file.
  - `dataFrom` (string): Data source — `"data-columns"`, `"variable"`.
  - `fileName` (string): Exported file name on Drive (used when `type = "export-to-drive"`).
  - `exportFormat` (string): Export format — `"csv"`, `"xlsx"`, `"pdf"`, `"ods"`.
- **Output**: URL/path of the created Google Sheets or file on Drive.

### `note`
Non-executing note — not executed, only used for annotation on the canvas.
- **Input (`data`)**:
  - `note` (string): Note content.
  - `color` (string): Color (`"indigo"`, `"red"`, `"green"`, etc.).
  - `drawing` (boolean): Freehand drawing mode.
  - `fontSize` (string): Font size (`"regular"`, `"small"`, `"large"`).
  - `width` / `height` (number): Note frame size.
- **Output**: Not executed, returns no data.

---

## Variable Interpolation Syntax

Workflows use Handlebars syntax `{{ }}` to reference data:

| Syntax | Meaning | Example |
|---|---|---|
| `{{loopData.<loopId>.<field>}}` | Field of an element in a loop | `{{loopData.testcases.username}}` |
| `{{loopData@<loopId>}}` | Current element (used in selector) | `{{loopData@options}}` |
| `{{loopData.items}}` | Current DOM element (in `loop-elements`) | `{{loopData.items}} > div` |
| `{{variables@$ctxTextSelection}}` | Highlighted text from context menu | `{{variables@$ctxTextSelection}}` |

---

## Flow Structure

The execution flow always starts from a block with `label: "trigger"`. The `drawflow.edges` array is used to determine the order:
- `source` → ID of the source block.
- `target` → ID of the target block.
- `sourceHandle` / `targetHandle` — specific connection ports on the blocks (e.g., `-output-1`, `-input-1`).

For `conditions` and `webhook` blocks, there can be multiple output ports (true/false branch, success/fail).

---

## Sample JSON Structure of a Node Block

> _(Reference the exact JSON structure in the automa.schema.json file)_


---
---
name: automa-advanced-blocks
description: Guide on Advanced Blocks including Loops, Data Tables, Google Sheets, and Conditions
---

# Advanced Blocks: Loops, Tables & Conditions

To build resilient, scalable data extraction pipelines in Automa, you must master branching (`conditions`), iteration (`loop-data`, `loop-elements`), and data management (`insert-data`, `google-sheets`).

---

## 1. Branching with Conditions (`conditions`)

The `conditions` block dynamically routes the workflow based on logical expressions. It evaluates an array of branches (e.g., `output-1`, `output-2`) from top to bottom.

### Core Mechanics
*   **First Match Wins**: The engine stops evaluating at the first branch that evaluates to `true` and routes the execution specifically to that block's output port.
*   **Logical AND**: Inside a single branch, you can have multiple items (e.g., `value` and `compare`). They are evaluated sequentially and all must pass.
*   **The Fallback Edge**: If NO conditions are met, Automa routes to the `fallback` output ID. **CRITICAL: You must always connect a block to the fallback node.** If there is no connection on the fallback port, the workflow will reach a dead-end and silently hang or crash.

### Best Practices
*   **Retry Logic**: For asynchronous checks (e.g., waiting for a dynamically rendered element to exist), utilize `retryConditions: true`, `retryCount`, and `retryTimeout` rather than instantly failing over to the fallback.
*   **Type Coercion**: Ensure you compare apples to apples by using type casting prefixes (e.g., `"number::100"`) when evaluating variables.

---

## 2. Iteration (Loops)

Automa manages loops through a triad of blocks, managed via a unique `loopId`. 

### `loop-data` & `loop-elements`
*   **`loop-data`**: Iterates through structured arrays (JSON data, numbers, internal table, Google Sheets rows).
*   **`loop-elements`**: Iterates through a physical NodeList of DOM elements on the active tab. It natively supports lazy-loading (pagination) via the `loadMoreAction` (scroll/click) property.

### `loop-breakpoint`
*   **Mandatory Closing Block**: Every loop branch must end with a `loop-breakpoint` block that references the same `loopId`. 
*   This block signals the engine to either `continue` (increment index and loop again) or `break` (exit the loop and clear state). 
*   **Flow Structure**: You must connect an edge *from* the `loop-breakpoint` *back* to the original `loop-data`/`loop-elements` block to physically close the loop.

### Interpolation Variables
During a loop, the engine injects state variables:
*   `{{loopData.myLoop.data}}`: Retrieves the raw value of the current iteration.
*   `{{loopData.myLoop.$index}}`: Retrieves the current iteration index (0-based).
*   `{{loopData@myLoop}}`: A special syntax used in CSS selectors during `loop-elements`. Instead of querying the whole document (`document.querySelector`), this restricts the selector context strictly to the current DOM element being iterated over (e.g., `{{loopData@myLoop}} > h2.title`).

---

## 3. Data Extraction Pipeline (Tables & Sheets)

Automa uses an internal **Table (Data Columns)** as a temporary database for the lifecycle of a workflow execution. 

### Inserting Data
1.  **Automatic Extraction**: Blocks like `get-text` or `attribute-value` have a `saveData: true` parameter. When enabled, you specify a `dataColumn` name, and the scraped value is instantly appended to the current row.
2.  **Explicit Insertion**: The `insert-data` block allows you to construct a completely custom row (using `{ column, value }` pairs) and append it to the table manually.

### Data Cleanup
If you need to sanitize data (e.g., stripping '$' signs or whitespace) before inserting:
*   Use `get-text` to assign the raw text to a variable (`assignVariable: true`).
*   Format the variable using `regex-variable` or `javascript-code`.
*   Finally, use `insert-data` to save the clean variable into the Table.

### Exporting & Syncing
*   **`export-data`**: Exports the internal table to disk (CSV, JSON). Enables `addBOMHeader` for Excel compatibility.
*   **`google-sheets`**: Appends or overwrites the internal table (`data-columns`) directly to a remote spreadsheet using `insertDataOption: "INSERT_ROWS"`.

### 🚨 Critical Anti-Pattern: Network Calls Inside Loops
**NEVER** place an `export-data` or `google-sheets` block *inside* your extraction loop. 
*   Doing so will fire an API call for every single row you scrape, leading to heavy rate-limiting and incredibly slow execution.
*   **Correct Pattern**: Use the loop exclusively to scrape and populate the internal Table (`insert-data`). Connect the `google-sheets` block *after* the `loop-breakpoint` exits, allowing you to bulk-upload the entire table array in one single, fast API request.

---

## 4. JavaScript Transformations (`javascript-code`)

The `javascript-code` block is a powerful escape hatch for when standard blocks (like `regex-variable` or `data-mapping`) aren't flexible enough. It executes within a secure Sandbox environment but provides specialized helper functions to interact with the workflow state.

### Built-in Helper Functions
*   `automaRefData(keyword, path)`: Extracts data from the workflow's state. 
    *   *Example*: `const myVar = automaRefData('variables', 'myVar');`
    *   *Example*: `const myConst = automaRefData('globalData', 'myConst');`
*   `automaSetVariable(name, value)`: Dynamically sets or overwrites a workflow variable.
    *   *Example*: `automaSetVariable('cleanPrice', 1500);`
*   `automaNextBlock(data, insert)`: Advances the workflow to the next block. 
    *   If you omit this, Automa automatically appends `automaNextBlock()` to the end of your script.
    *   *Tip*: You can pass an object to insert it directly into the table, e.g., `automaNextBlock({ price: 1500 }, true)`.

### Common Use-Case: Data Formatting
When scraping messy text, use JavaScript to clean it before inserting it into your table or passing it to an API.
```javascript
// 1. Retrieve the raw scraped variable
const rawText = automaRefData('variables', 'scraped_text');

// 2. Transform the data (e.g., extracting numbers)
const sanitized = rawText.replace(/[^0-9.]/g, '');

// 3. Save it back to a new variable
automaSetVariable('clean_price', sanitized);

// 4. Continue workflow
automaNextBlock();
```

### Interpolation (`{{ }}`) inside JS
While you can use `{{variables.xx}}` inside the JS code block, it's safer and cleaner to use `automaRefData()` to prevent syntax errors if the variable contains unexpected quotes or line breaks. Save string interpolation for UI blocks (like URLs or CSS Selectors).


---

# Part 4: Self-Healing & Resilience

---
name: automa-self-healing
description: Design patterns and best practices for building resilient, self-healing workflows
---

# Building Self-Healing Workflows

A production-grade Automa workflow must anticipate and gracefully handle failures (e.g., dynamic UI changes, missing DOM elements, network latency, or bad payloads) without crashing the entire automation pipeline. 

This guide details the core mechanisms available in Automa to build resilient, **self-healing** workflows.

---

## 1. Block-Level Error Handling (`onError`)

Every executable block in Automa contains an `onError` property. By default, it may be omitted. To build a self-healing pipeline, you must override this behavior on critical or risky blocks (like web scraping or API calls) by providing an `onError` object.

**CRITICAL RULE**: `onError` MUST be an object. NEVER use a string like `"onError": "fallback"`. Using a string will cause the UI to crash and the fallback port will disappear.

### Correct `onError` Schema:
```json
"onError": {
  "enable": true,
  "toDo": "fallback",
  "retry": false,
  "retryTimes": 1,
  "retryInterval": 2,
  "insertData": false
}
```

### Available `toDo` Strategies:
*   `"error"` (Default): The workflow fails and stops immediately. Use this only for fatal errors where continuing would cause data corruption.
*   `"continue"`: Ignores the error and proceeds to the next block as if nothing happened.
    *   *Use Case*: Clicking a "Close Ad" popup button. If the ad isn't there, it errors out, but the workflow should just continue.
*   `"fallback"`: Routes execution to a secondary branch specifically designed to handle the error.
    *   *Use Case*: If `get-text` fails to find a price element, the `fallback` edge routes to a `javascript-code` block that manually inserts `null` into the data table.

### How to use `fallback` routing:
When a block is configured with the `onError` object and `"toDo": "fallback"`, a special output node (the black handle on the bottom) becomes active. You **must** connect this handle to your recovery block using an edge targeting `[sourceNode.id]-output-fallback`.

---

## 2. Defensive DOM Operations (Wait & Verify)

Web pages are inherently unpredictable. A selector that worked yesterday might load 3 seconds slower today due to network latency.

### The Wait For Selector Pattern
**Never assume an element exists immediately.** On blocks that interact with the page (`event-click`, `get-text`, `forms`), always:
1.  Set `waitForSelector: true`
2.  Set a safe `waitSelectorTimeout` (e.g., `5000` to `10000` milliseconds).

### The "Check First" Pattern (`element-exists`)
If a workflow needs to perform a massive branch of logic depending on the UI state (e.g., "Is the user logged in or logged out?"):
1.  Use the `element-exists` block to check for the presence of the User Avatar.
2.  Route the `fallback` output to the Login Sub-workflow.
3.  Route the primary output to the Main Dashboard logic.

---

## 3. Conditional Fallbacks & Polling (`conditions`)

When checking the status of variables or the DOM, the `conditions` block acts as the traffic controller.

### Preventing Dead-Ends
A massive anti-pattern in Automa is failing to connect the `fallback` port on a `conditions` block. If no conditions match and `fallback` is disconnected, the workflow enters a "Dead-End" and hangs. **Always route the fallback**, even if it just points to a block that logs a safe warning.

### Retry Logic (Polling)
If a condition evaluates variables populated by a slow asynchronous webhook or page load, don't immediately route to fallback. 
*   Enable `retryConditions: true`.
*   Configure `retryCount` (e.g., 5).
*   Configure `retryTimeout` (e.g., 2000ms).
This forces the engine to repeatedly test the condition before finally giving up and taking the fallback path, effectively creating an auto-polling self-healing loop.

---

## 4. Sub-Workflow Recovery (`execute-workflow`)

For enterprise pipelines, failures should be logged and escalated rather than silently ignored.

If a critical pipeline (e.g., scraping a competitor's pricing) fails on the core logic:
1.  Set the parent block's `onError` to `"fallback"`.
2.  Route the fallback edge into an `execute-workflow` block.
3.  Have the `execute-workflow` block call a dedicated **"Alerting Workflow"**.
4.  Pass the error details into the Alerting Workflow via `Insert Variables` (e.g., `automaSetVariable('error_log', 'Failed on block X')`).
5.  The Alerting Workflow triggers a Slack Webhook or Email to notify the engineering team, while the parent workflow safely halts.

---

## 5. JavaScript Sandbox Recovery

When writing custom `javascript-code`, wrap risky logic in a `try...catch` block. If parsing JSON or manipulating strings fails, catch the error and route cleanly using `automaNextBlock`.

```javascript
try {
  const rawData = automaRefData('variables', 'api_response');
  const parsed = JSON.parse(rawData);
  automaSetVariable('extractedId', parsed.data.id);
  
  // Success, continue normally
  automaNextBlock(); 
} catch (error) {
  // Graceful degradation: Log the error and move to the fallback port
  console.error("Failed to parse API response", error);
  automaNextBlock({ $error: true, message: error.message });
}
```
*Note: Passing `{ $error: true }` to `automaNextBlock` forces the JS block to exit via its `fallback` connection.*


---


---
# Unknown Block Investigation Protocol

When asked to manipulate or generate a block that you are unfamiliar with (e.g., 
ote, proxy, locks-group), **DO NOT GUESS** the JSON structure. You must follow this strict investigation protocol:

1. **Check the Schema (utoma.schema.json)**: Look inside drawflow.properties.nodes.items.allOf. Find the rule matching the block label and inspect 	hen.properties.data.properties.
2. **Check the Default Tasks (utomaTasks.json)**: This file contains the default templates for all blocks. It is the fastest way to see the baseline structure.
3. **Check the Linter Source Code (lint_automa.js)**: The linter enforces custom rules not strictly defined in the JSON schema (e.g., forbidding empty strings for description, requiring disableBlock: false). Always read the linter's custom checks.
4. **Check Vue Flow Core Properties**: Every node must have a 	ype property matching the internal Vue component (e.g., BlockNote). Missing the 	ype property will cause the block to render as a blank fallback node in the UI.
