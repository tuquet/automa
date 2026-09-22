import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStudioExecution } from '../../src/studio/composables/useStudioExecution';

// Mock vue-toastification
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

// Mock @automa/types/api
const mockSubmitJob = vi.fn();
vi.mock('@automa/types/api', () => ({
  submitJob: (...args: unknown[]) => mockSubmitJob(...args),
}));

describe('useStudioExecution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates required parameters correctly in isParamsValid', () => {
    const automaCoreState = { status: 'online', baseUrl: 'http://127.0.0.1:8765' };
    const { runModalState, isParamsValid } = useStudioExecution(automaCoreState);

    // Empty parameters -> valid
    expect(isParamsValid.value).toBe(true);

    // Parameter required and empty -> invalid
    runModalState.parameters = [
      { name: 'apiKey', value: '', data: { required: true } },
    ];
    expect(isParamsValid.value).toBe(false);

    // Parameter required and filled -> valid
    runModalState.parameters[0].value = 'secret_123';
    expect(isParamsValid.value).toBe(true);
  });

  it('submits job and packages parameters into options.variables for automa-core', async () => {
    const automaCoreState = { status: 'online', baseUrl: 'http://127.0.0.1:8765' };
    const { runModalState, submitWorkflowExecution } = useStudioExecution(automaCoreState);

    runModalState.browserId = 'profile_test';
    runModalState.headless = true;
    runModalState.closeBrowserOnFinish = true;
    runModalState.parameters = [
      { name: 'targetUrl', value: 'https://example.com' },
      { name: 'maxItems', value: 10 },
    ];

    mockSubmitJob.mockResolvedValueOnce({
      data: { jobId: 'job_xyz789' },
    });

    const onFinish = vi.fn();
    const workflow = { id: 'wf_test', name: 'Test Workflow', drawflow: { nodes: [], edges: [] } };

    await submitWorkflowExecution(workflow, 'test.workflow.json', onFinish);

    expect(mockSubmitJob).toHaveBeenCalledTimes(1);
    const callArgs = mockSubmitJob.mock.calls[0][0];
    expect(callArgs.baseUrl).toBe('http://127.0.0.1:8765');
    expect(callArgs.body.workflowId).toBe('wf_test');
    expect(callArgs.body.workflowPath).toBe('test.workflow.json');
    expect(callArgs.body.options.browserId).toBe('profile_test');
    expect(callArgs.body.options.headless).toBe(true);
    expect(callArgs.body.options.closeBrowserOnFinish).toBe(true);
    expect(callArgs.body.options.variables).toEqual({
      targetUrl: 'https://example.com',
      maxItems: 10,
    });
    expect(onFinish).toHaveBeenCalledWith('job_xyz789');
  });
});
