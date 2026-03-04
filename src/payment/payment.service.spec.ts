import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { IdempotencyService } from 'src/idempotency/idempotency.service';
import { BadRequestException } from '@nestjs/common';

describe('PaymentService', () => {
  let service: PaymentService;
  let idempotencyService: IdempotencyService;

  const mockIdempotencyService = {
    findOneRecordByIdempotencyKey: jest.fn(),
    createIdempotencyRecord: jest.fn(),
    updateIdempotencyRecord: jest.fn(),
    executeOrReplay: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: IdempotencyService,
          useValue: mockIdempotencyService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    idempotencyService = module.get<IdempotencyService>(IdempotencyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test case for missing idempotency key
  it('should throw BadRequestException if idempotencyKey is missing', async () => {
    await expect(
      service.processPaymentService('', {
        amount: 100,
        currency: 'USD',
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  // Test case for creating a new record and processing payment
  it('should create record and process payment if no record exists', async () => {
    mockIdempotencyService.findOneRecordByIdempotencyKey.mockResolvedValue(
      null,
    );
    mockIdempotencyService.createIdempotencyRecord.mockResolvedValue({
      id: 1,
    });
    jest.spyOn(service, 'simulatePaymentProcessing').mockResolvedValue({
      statusCode: 200,
      body: { message: 'Payment processed successfully' },
    });

    const result = await service.processPaymentService('test-key', {} as any);

    expect(result).toEqual({
      success: true,
      message: 'Charged 100 GHS',
    });

    expect(mockIdempotencyService.createIdempotencyRecord).toHaveBeenCalled();
    expect(mockIdempotencyService.updateIdempotencyRecord).toHaveBeenCalled();
  });

  // Test case for replaying payment if record already exists
  it('should replay payment if record already exists', async () => {
    mockIdempotencyService.findOneRecordByIdempotencyKey.mockResolvedValue({
      id: 1,
    });

    mockIdempotencyService.executeOrReplay.mockResolvedValue({
      statusCode: 200,
      body: { message: 'Payment processed successfully' },
      headers: {},
    });

    const result = await service.processPaymentService(
      'existing-key',
      {} as any,
    );

    expect(result).toEqual({
      success: true,
      message: 'Payment processed successfully',
      isReplay: true,
      previousResponseStatusCode: 200,
      headers: {},
    });
    expect(result.isReplay).toBe(true);
    // headers should include X-Cache-Hit: true
    expect(result.headers).toHaveProperty('X-Cache-Hit', 'true');

    expect(mockIdempotencyService.executeOrReplay).toHaveBeenCalled();
  });
});
