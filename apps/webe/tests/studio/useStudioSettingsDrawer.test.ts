import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import StudioHeader from '@/studio/components/StudioHeader.vue';

describe('Workflow Settings Drawer Trigger in StudioHeader', () => {
  it('emits openModal with "settings" when desktop btn-settings is clicked', async () => {
    const wrapper = mount(StudioHeader, {
      props: {
        showSidebar: true,
        automaCoreStatus: 'online',
        currentWorkflowId: 'test-wf-1',
        currentWorkflowName: 'Test Workflow',
        currentFilePath: 'test.workflow.json',
        availableWorkflows: [{ id: 'test-wf-1', name: 'Test Workflow' }],
        lintIssuesCount: 0,
        logsCount: 0,
        isDirty: false,
        isJobRunning: false,
        isJobPaused: false,
        workflowSettings: {},
      },
    });

    const settingsBtn = wrapper.find('[data-testid="btn-settings"]');
    expect(settingsBtn.exists()).toBe(true);

    await settingsBtn.trigger('click');

    const emitted = wrapper.emitted('openModal');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]).toEqual(['settings']);
  });

  it('emits openModal with "settings" when mobile btn-popover-settings is clicked', async () => {
    const wrapper = mount(StudioHeader, {
      attachTo: document.body,
      props: {
        showSidebar: true,
        automaCoreStatus: 'online',
        currentWorkflowId: 'test-wf-1',
        currentWorkflowName: 'Test Workflow',
        currentFilePath: 'test.workflow.json',
        availableWorkflows: [{ id: 'test-wf-1', name: 'Test Workflow' }],
        lintIssuesCount: 0,
        logsCount: 0,
        isDirty: false,
        isJobRunning: false,
        isJobPaused: false,
        workflowSettings: {},
      },
    });

    // Open mobile utilities popover first
    const utilitiesTrigger = wrapper.find('[data-testid="btn-utilities-popover"]');
    expect(utilitiesTrigger.exists()).toBe(true);
    await utilitiesTrigger.trigger('click');
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const mobileSettingsBtn = document.body.querySelector('[data-testid="btn-popover-settings"]');
    expect(mobileSettingsBtn).not.toBeNull();

    (mobileSettingsBtn as HTMLElement).click();

    // Wait for nextTick in onUtilitySettingsClick
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const emitted = wrapper.emitted('openModal');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]).toEqual(['settings']);
    wrapper.unmount();
  });
});
