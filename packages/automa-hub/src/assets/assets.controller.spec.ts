import { Test, TestingModule } from '@nestjs/testing';
import { AssetsController } from './assets.controller';
import { TelemetryService } from '../telemetry/telemetry.service';
import { vi } from 'vitest';

vi.mock('@automa/core', () => ({
  assetsDb: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue({}),
  },
  accounts: {},
  proxies: {},
}));

describe('AssetsController', () => {
  let controller: AssetsController;

  const mockTelemetryService = {
    processTelemetry: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [
        { provide: TelemetryService, useValue: mockTelemetryService },
      ],
    }).compile();

    controller = module.get<AssetsController>(AssetsController);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('accounts', () => {
    it('should return accounts', async () => {
      const result = await controller.getAccounts();
      expect(result).toEqual([]);
    });

    it('should create account', async () => {
      const result = await controller.createAccount({ platform: 'test', username: 'usr', password: 'pwd' });
      expect(result).toHaveProperty('id');
      expect(result.success).toBe(true);
    });
  });

  describe('proxies', () => {
    it('should return proxies', async () => {
      const result = await controller.getProxies();
      expect(result).toEqual([]);
    });

    it('should create proxy', async () => {
      const result = await controller.createProxy({ host: '127.0.0.1', port: '8080' });
      expect(result).toHaveProperty('id');
      expect(result.success).toBe(true);
    });
  });

  describe('telemetry', () => {
    it('should report telemetry', async () => {
      const result = await controller.reportTelemetry({ data: 'test' });
      expect(result).toEqual({ success: true });
      expect(mockTelemetryService.processTelemetry).toHaveBeenCalledWith({ data: 'test' });
    });
  });
});
