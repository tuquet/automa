import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutomaClient } from './index';

const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('AutomaClient', () => {
  let client: AutomaClient;

  beforeEach(() => {
    client = new AutomaClient('http://test.local');
    fetchMock.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('checkDaemonHealth', () => {
    it('should return health response', async () => {
      const mockResponse = { status: 'ok', version: '1.0.0', message: 'alive' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.checkDaemonHealth();
      expect(result).toEqual(mockResponse);
      expect(fetchMock).toHaveBeenCalledWith('http://test.local/api/health');
    });

    it('should throw an error if response is not ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(client.checkDaemonHealth()).rejects.toThrow('HTTP error: 500');
    });
  });

  describe('encryptSecret', () => {
    it('should encrypt secret', async () => {
      const req = { plaintext: 'hello' };
      const res = { encrypted_secret: 'encrypted' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => res,
      });

      const result = await client.encryptSecret(req);
      expect(result).toEqual(res);
      expect(fetchMock).toHaveBeenCalledWith('http://test.local/api/secrets/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
    });

    it('should throw an error if encryption fails with error field', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid input' }),
      });

      await expect(client.encryptSecret({ plaintext: '' })).rejects.toThrow('Encryption failed: Invalid input');
    });

    it('should throw an error if encryption fails with status text', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Error',
        json: async () => { throw new Error('Not JSON') },
      });

      await expect(client.encryptSecret({ plaintext: '' })).rejects.toThrow('Encryption failed: Internal Error');
    });
  });

  describe('getHistory', () => {
    it('should return history with default limit', async () => {
      const mockHistory = [{ id: '1', name: 'Job 1', status: 'success' }];
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      });

      // Default client limit test
      const defaultClient = new AutomaClient();
      const result = await defaultClient.getHistory();
      expect(result).toEqual(mockHistory);
      expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:8765/api/history?limit=50');
    });

    it('should return history with specific limit', async () => {
      const mockHistory = [{ id: '1', name: 'Job 1', status: 'success' }];
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      });

      const result = await client.getHistory(10);
      expect(result).toEqual(mockHistory);
      expect(fetchMock).toHaveBeenCalledWith('http://test.local/api/history?limit=10');
    });

    it('should throw error when getHistory fails', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });
      await expect(client.getHistory()).rejects.toThrow('HTTP error: 404');
    });
  });

  describe('submitJob', () => {
    it('should submit job', async () => {
      const mockResponse = { jobId: '123' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const payload = { key: 'value' };
      const result = await client.submitJob('/api/jobs', payload);
      expect(result).toEqual(mockResponse);
      expect(fetchMock).toHaveBeenCalledWith('http://test.local/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    });
    
    it('should throw error when submitJob fails', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });
      await expect(client.submitJob('/api/jobs', {})).rejects.toThrow('HTTP error: 400');
    });
  });

  describe('getJobStatus', () => {
    it('should return job status', async () => {
      const mockStatus = { status: 'running' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const result = await client.getJobStatus('123');
      expect(result).toEqual(mockStatus);
      expect(fetchMock).toHaveBeenCalledWith('http://test.local/api/history/123/status');
    });

    it('should return unknown status when request fails', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.getJobStatus('123');
      expect(result).toEqual({ status: 'unknown' });
    });
    
    it('should return unknown status when response is not ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
      });

      const result = await client.getJobStatus('123');
      expect(result).toEqual({ status: 'unknown' });
    });
  });

  describe('getJobLogs', () => {
    it('should return job logs from primary endpoint', async () => {
      const mockLogs = [{ id: 1, type: 'info', message: 'test log', created_at: '2023' }];
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogs,
      });

      const result = await client.getJobLogs('123');
      expect(result).toEqual(mockLogs);
      expect(fetchMock).toHaveBeenCalledWith('http://test.local/api/history/123/logs');
    });

    it('should fallback to old endpoint if primary fails', async () => {
      const mockLogs = [{ id: 1, type: 'info', message: 'test log fallback', created_at: '2023' }];
      fetchMock
        .mockResolvedValueOnce({ ok: false, status: 404 }) // Primary fails
        .mockResolvedValueOnce({ ok: true, json: async () => ({ logs: mockLogs }) }); // Fallback succeeds

      const result = await client.getJobLogs('123');
      expect(result).toEqual(mockLogs);
      expect(fetchMock).toHaveBeenCalledWith('http://test.local/api/history/123/logs');
      expect(fetchMock).toHaveBeenCalledWith('http://test.local/api/jobs/123/logs');
    });
    
    it('should throw error when fallback also fails', async () => {
      fetchMock
        .mockResolvedValueOnce({ ok: false, status: 404 }) // Primary fails
        .mockResolvedValueOnce({ ok: false, status: 500 }); // Fallback fails

      await expect(client.getJobLogs('123')).rejects.toThrow('HTTP error: 404');
    });

    it('should throw error when fallback rejects', async () => {
      fetchMock
        .mockResolvedValueOnce({ ok: false, status: 404 }) // Primary fails
        .mockRejectedValueOnce(new Error('Network error')); // Fallback network fails

      await expect(client.getJobLogs('123')).rejects.toThrow('HTTP error: 404');
    });
  });

  describe('installBrowser', () => {
    it('should call onProgress with different events', async () => {
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({ value: new TextEncoder().encode('data: {"type":"info","message":"Starting..."}\n'), done: false })
          .mockResolvedValueOnce({ value: new TextEncoder().encode('data: {"type":"progress","percent":50}\n'), done: false })
          .mockResolvedValueOnce({ value: new TextEncoder().encode('data: {"type":"invalid"}\n'), done: false })
          .mockResolvedValueOnce({ value: new TextEncoder().encode('data: \n'), done: false })
          .mockResolvedValueOnce({ done: true })
      };
      
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => mockReader
        }
      };
      fetchMock.mockResolvedValueOnce(mockResponse);

      const onProgress = vi.fn();
      await client.installBrowser(onProgress);

      expect(fetchMock).toHaveBeenCalledWith('http://test.local/api/system/install-browser', expect.any(Object));
      expect(onProgress).toHaveBeenCalledWith('Starting...');
      expect(onProgress).toHaveBeenCalledWith('Downloading... 50%');
    });
    
    it('should throw error when daemon returns error', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false });
      await expect(client.installBrowser(vi.fn())).rejects.toThrow('Daemon returned error');
    });
    
    it('should throw error when body is null', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, body: null });
      await expect(client.installBrowser(vi.fn())).rejects.toThrow('No response body');
    });
    
    it('should throw error when stream receives error type', async () => {
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({ value: new TextEncoder().encode('data: {"type":"error","error":"Install failed"}\n'), done: false })
          .mockResolvedValueOnce({ done: true })
      };
      
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => mockReader
        }
      };
      fetchMock.mockResolvedValueOnce(mockResponse);

      await expect(client.installBrowser(vi.fn())).rejects.toThrow('Install failed');
    });
  });

  describe('connectSse', () => {
    it('should return EventSource', () => {
      const MockEventSource = vi.fn();
      global.EventSource = MockEventSource as any;
      
      const result = client.connectSse();
      expect(MockEventSource).toHaveBeenCalledWith('http://test.local/api/events');
    });
  });
});
