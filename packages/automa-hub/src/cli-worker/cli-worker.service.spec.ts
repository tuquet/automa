import { Test, TestingModule } from '@nestjs/testing';
import { CliWorkerService } from './cli-worker.service';
import { ConfigService } from '@nestjs/config';
import { vi } from 'vitest';

const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('CliWorkerService', () => {
  let service: CliWorkerService;

  const mockConfigService = {
    get: vi.fn().mockReturnValue('http://worker.test'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CliWorkerService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<CliWorkerService>(CliWorkerService);
    fetchMock.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('dispatchJob', () => {
    it('should dispatch job successfully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'job123' }),
      });

      const result = await service.dispatchJob({ payload: 'data' });
      expect(result).toEqual({ jobId: 'job123' });
      expect(fetchMock).toHaveBeenCalledWith('http://worker.test', expect.any(Object));
    });

    it('should throw Error when response is not ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });

      await expect(service.dispatchJob({})).rejects.toThrow('CLI Worker is unavailable: CLI Worker responded with status 400: Bad Request');
    });

    it('should throw ServiceUnavailableException when fetch fails', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network Down'));

      await expect(service.dispatchJob({})).rejects.toThrow('CLI Worker is unavailable: Network Down');
    });
  });
});
