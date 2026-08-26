import { describe, it, expect, beforeEach } from 'vitest';
import {
  BUTTON_CATALOG,
  type ButtonBusinessLogicSchema,
  type ButtonExecutionState,
} from '@automa/types';

describe('SRS Button Business Logic & Event-Driven Schema (docs/SRS_BUTTON_BUSINESS_LOGIC_EVENT_DRIVEN.md)', () => {
  describe('1. Button Catalog & Zero-Dummy Compliance (39 Buttons)', () => {
    it('contains all 39 canonical action buttons from specifications', () => {
      expect(BUTTON_CATALOG.length).toBe(39);
    });

    it('enforces strict unique IDs using dot-delimited format', () => {
      const idSet = new Set<string>();
      for (const btn of BUTTON_CATALOG) {
        expect(btn.id).toMatch(/^[a-z0-9_]+(\.[a-z0-9_]+){2,}$/);
        expect(idSet.has(btn.id)).toBe(false);
        idSet.add(btn.id);
      }
    });

    it('enforces industry-standard data-testid format (btn-<kebab-case>)', () => {
      for (const btn of BUTTON_CATALOG) {
        expect(btn.presentation.dataTestId).toMatch(/^btn-[a-z0-9-]+$/);
      }
    });

    it('includes all 10 Browser Profile buttons including recent additions', () => {
      const browserButtons = BUTTON_CATALOG.filter((b) => b.context === 'BrowserManager');
      expect(browserButtons.length).toBe(10);

      // 1. btn.browser.set_default
      const setDefaultBtn = BUTTON_CATALOG.find((b) => b.id === 'btn.browser.set_default');
      expect(setDefaultBtn).toBeDefined();
      expect(setDefaultBtn?.presentation.dataTestId).toBe('btn-set-default-browser');
      expect(setDefaultBtn?.presentation.label).toBe('Set as Default');
      expect(setDefaultBtn?.presentation.icon).toBe('Star');
      expect(setDefaultBtn?.dispatch.type).toBe('REST');
      if (setDefaultBtn?.dispatch.type === 'REST') {
        expect(setDefaultBtn.dispatch.method).toBe('PATCH');
        expect(setDefaultBtn.dispatch.pathTemplate).toBe('/api/v1/system/settings');
      }

      // 2. btn.browser.auto_detect
      const autoDetectBtn = BUTTON_CATALOG.find((b) => b.id === 'btn.browser.auto_detect');
      expect(autoDetectBtn).toBeDefined();
      expect(autoDetectBtn?.presentation.dataTestId).toBe('btn-autodetect-browsers');
      expect(autoDetectBtn?.presentation.label).toBe('Auto-Detect Host Browsers');
      expect(autoDetectBtn?.presentation.icon).toBe('Scan');
      expect(autoDetectBtn?.dispatch.type).toBe('REST');
      if (autoDetectBtn?.dispatch.type === 'REST') {
        expect(autoDetectBtn.dispatch.method).toBe('POST');
        expect(autoDetectBtn.dispatch.pathTemplate).toBe('/api/v1/browsers/auto-detect');
      }

      // 3. btn.browser.download_binary
      const downloadBtn = BUTTON_CATALOG.find((b) => b.id === 'btn.browser.download_binary');
      expect(downloadBtn).toBeDefined();
      expect(downloadBtn?.presentation.dataTestId).toBe('btn-download-chromium');
      expect(downloadBtn?.presentation.label).toBe('Download Managed Chromium');
      expect(downloadBtn?.presentation.icon).toBe('DownloadCloud');
      expect(downloadBtn?.dispatch.type).toBe('REST');
      if (downloadBtn?.dispatch.type === 'REST') {
        expect(downloadBtn.dispatch.method).toBe('POST');
        expect(downloadBtn.dispatch.pathTemplate).toBe('/api/v1/system/browser-binaries');
      }
    });

    it('enforces confirmation modals for destructive / purge operations', () => {
      const destructiveIds = [
        'btn.campaign.delete',
        'btn.browser.kill_all',
        'btn.storage.table.delete',
        'btn.storage.var.delete',
        'btn.storage.cred.delete',
        'btn.history.clear_all',
        'btn.history.delete_item',
      ];

      for (const id of destructiveIds) {
        const btn = BUTTON_CATALOG.find((b) => b.id === id);
        expect(btn, `Button ${id} must exist`).toBeDefined();
        expect(btn?.preConditions.confirmationModal, `Button ${id} must have confirmationModal`).toBeDefined();
        expect(btn?.preConditions.confirmationModal?.variant).toBe('destructive');
        expect(btn?.preConditions.confirmationModal?.confirmText.length).toBeGreaterThan(0);
      }
    });

    it('maps all REST action triggers to valid HTTP methods', () => {
      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      for (const btn of BUTTON_CATALOG) {
        if (btn.dispatch.type === 'REST') {
          expect(validMethods).toContain(btn.dispatch.method);
          expect(btn.dispatch.operationId.length).toBeGreaterThan(0);
          expect(btn.dispatch.pathTemplate.startsWith('/api/v1/')).toBe(true);
        }
      }
    });

    it('maps WebSocket command triggers to valid Automa WS types', () => {
      const wsButtons = BUTTON_CATALOG.filter((b) => b.dispatch.type === 'WEBSOCKET');
      expect(wsButtons.length).toBeGreaterThanOrEqual(2);
      for (const btn of wsButtons) {
        if (btn.dispatch.type === 'WEBSOCKET') {
          expect(['PAUSE_JOB', 'RESUME_JOB', 'KILL_JOB', 'STEP_OVER']).toContain(btn.dispatch.commandType);
          const cmd = btn.dispatch.buildCommand({ jobId: 'test-job-42' });
          expect(cmd.type).toBe(btn.dispatch.commandType);
        }
      }
    });
  });

  describe('2. Section 2.1: Pre-flight Cascading & Browser Resolution Waterfall', () => {
    interface BrowserProfile {
      id: string;
      name: string;
    }

    interface ResolutionContext {
      defaultProfileId: string | null;
      profilesInDb: BrowserProfile[];
      userSelectionPrompt?: (profiles: BrowserProfile[]) => Promise<string | null>;
      masterResolverPrompt?: () => Promise<'auto_detect' | 'download_binary' | 'create_profile' | null>;
    }

    async function resolveBrowserForExecution(ctx: ResolutionContext): Promise<{ resolvedBrowserId: string } | { cancelled: true }> {
      // Level 1: Fast Path - Default Profile Configured
      if (ctx.defaultProfileId && ctx.profilesInDb.some((p) => p.id === ctx.defaultProfileId)) {
        return { resolvedBrowserId: ctx.defaultProfileId };
      }

      // Level 2: Selection Prompt - Multiple profiles exist but no default
      if (ctx.profilesInDb.length > 0) {
        if (ctx.userSelectionPrompt) {
          const selected = await ctx.userSelectionPrompt(ctx.profilesInDb);
          if (selected) {
            return { resolvedBrowserId: selected };
          }
        }
        return { cancelled: true };
      }

      // Level 3: Master Browser Resolver - Zero Profiles
      if (ctx.masterResolverPrompt) {
        const action = await ctx.masterResolverPrompt();
        if (action === 'auto_detect') {
          return { resolvedBrowserId: 'autodetected_chrome' };
        }
        if (action === 'download_binary') {
          return { resolvedBrowserId: 'downloaded_chromium' };
        }
        if (action === 'create_profile') {
          return { resolvedBrowserId: 'custom_created_profile' };
        }
      }

      return { cancelled: true };
    }

    it('Level 1: Fast Path resolves configured default browser immediately without prompting', async () => {
      const result = await resolveBrowserForExecution({
        defaultProfileId: 'browser_primary',
        profilesInDb: [{ id: 'browser_primary', name: 'Primary Chrome' }],
      });

      expect(result).toEqual({ resolvedBrowserId: 'browser_primary' });
    });

    it('Level 2: Selection Prompt prompts user and resolves selected browser', async () => {
      const result = await resolveBrowserForExecution({
        defaultProfileId: null,
        profilesInDb: [
          { id: 'p1', name: 'Work Profile' },
          { id: 'p2', name: 'Personal Profile' },
        ],
        userSelectionPrompt: async (profiles) => profiles[1].id,
      });

      expect(result).toEqual({ resolvedBrowserId: 'p2' });
    });

    it('Level 2: Selection Prompt returns cancelled if user dismisses prompt', async () => {
      const result = await resolveBrowserForExecution({
        defaultProfileId: null,
        profilesInDb: [{ id: 'p1', name: 'Work Profile' }],
        userSelectionPrompt: async () => null,
      });

      expect(result).toEqual({ cancelled: true });
    });

    it('Level 3: Master Browser Resolver resolves self-healing options when zero profiles exist', async () => {
      // Option A: Auto-Detect
      const autoDetectRes = await resolveBrowserForExecution({
        defaultProfileId: null,
        profilesInDb: [],
        masterResolverPrompt: async () => 'auto_detect',
      });
      expect(autoDetectRes).toEqual({ resolvedBrowserId: 'autodetected_chrome' });

      // Option B: Download Managed Chromium
      const downloadRes = await resolveBrowserForExecution({
        defaultProfileId: null,
        profilesInDb: [],
        masterResolverPrompt: async () => 'download_binary',
      });
      expect(downloadRes).toEqual({ resolvedBrowserId: 'downloaded_chromium' });

      // Option C: Create Custom Profile
      const createRes = await resolveBrowserForExecution({
        defaultProfileId: null,
        profilesInDb: [],
        masterResolverPrompt: async () => 'create_profile',
      });
      expect(createRes).toEqual({ resolvedBrowserId: 'custom_created_profile' });
    });
  });

  describe('3. Deterministic FSM State Machine Simulation', () => {
    class MockButtonFsmController {
      public state: ButtonExecutionState = 'IDLE';
      public activeJobId: string | null = null;
      public logs: string[] = [];
      public lastError: string | null = null;

      public async trigger(button: ButtonBusinessLogicSchema, context: { workflowPath?: string; jobId?: string }) {
        if (this.state === 'EXECUTING' && button.id === 'btn.workflow.run') {
          // Dual toggle: Run button switches to Stop/Kill when already executing
          this.state = 'TERMINATING';
          this.activeJobId = null;
          this.state = 'IDLE';
          return;
        }

        // Anti-spam debounce guard
        if (this.state !== 'IDLE') return;

        // Phase 1: Validating
        this.state = 'VALIDATING';
        if (button.preConditions.requiresDirtyState && !context.workflowPath) {
          this.state = 'IDLE';
          this.lastError = 'Validation failed: Requires dirty state';
          return;
        }

        // Phase 2: Dispatching
        this.state = 'DISPATCHING';
        if (button.dispatch.type === 'REST') {
          // Simulate successful API call
          this.activeJobId = 'job-mock-999';
          this.state = 'EXECUTING';
        }
      }

      public onEvent(event: { type: string; jobId: string; message?: string }) {
        if (event.jobId !== this.activeJobId) return;

        if (event.type === 'task:log') {
          this.logs.push(event.message || '');
        } else if (event.type === 'task:completed') {
          this.state = 'COMPLETED';
          this.state = 'IDLE';
          this.activeJobId = null;
        } else if (event.type === 'task:error') {
          this.state = 'FAILED';
          this.lastError = event.message || 'Execution error';
          this.state = 'IDLE';
          this.activeJobId = null;
        }
      }
    }

    let controller: MockButtonFsmController;
    const runBtn = BUTTON_CATALOG.find((b) => b.id === 'btn.workflow.run')!;

    beforeEach(() => {
      controller = new MockButtonFsmController();
    });

    it('progresses smoothly through IDLE -> VALIDATING -> DISPATCHING -> EXECUTING', async () => {
      expect(controller.state).toBe('IDLE');
      await controller.trigger(runBtn, { workflowPath: 'test.workflow.json' });
      expect(controller.state).toBe('EXECUTING');
      expect(controller.activeJobId).toBe('job-mock-999');
    });

    it('handles event-driven reaction stream and transitions to COMPLETED -> IDLE', async () => {
      await controller.trigger(runBtn, { workflowPath: 'test.workflow.json' });
      expect(controller.state).toBe('EXECUTING');

      controller.onEvent({ type: 'task:log', jobId: 'job-mock-999', message: 'Step 1 finished' });
      expect(controller.logs).toContain('Step 1 finished');

      controller.onEvent({ type: 'task:completed', jobId: 'job-mock-999' });
      expect(controller.state).toBe('IDLE');
      expect(controller.activeJobId).toBeNull();
    });

    it('switches Run button into Terminating/Stop mode when clicked during active execution', async () => {
      await controller.trigger(runBtn, { workflowPath: 'test.workflow.json' });
      expect(controller.state).toBe('EXECUTING');

      // Click again during execution -> stops job
      await controller.trigger(runBtn, { workflowPath: 'test.workflow.json' });
      expect(controller.state).toBe('IDLE');
      expect(controller.activeJobId).toBeNull();
    });

    it('ignores clicks when state is in intermediate transitions (Debounce Guard)', async () => {
      controller.state = 'DISPATCHING';
      await controller.trigger(runBtn, { workflowPath: 'test.workflow.json' });
      // Should remain DISPATCHING without re-executing
      expect(controller.state).toBe('DISPATCHING');
    });
  });
});
