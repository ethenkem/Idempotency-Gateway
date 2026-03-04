import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { IdempotencyService } from 'src/idempotency/idempotency.service';
import { BadRequestException } from '@nestjs/common';
import { AuditService } from 'src/audit/audit.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';

describe('PaymentService', () => {
  let service: PaymentService;
  let idempotencyService: IdempotencyService;
  let auditService: AuditService;

  const mockIdempotencyService = {
    findOneRecordByIdempotencyKey: jest.fn(),
    createIdempotencyRecord: jest.fn(),
    updateIdempotencyRecord: jest.fn(),
    executeOrReplay: jest.fn(),
  };

  const mockAuditService = {
    logRequest: jest.fn().mockResolvedValue(true),
  };

  const testIp = '127.0.0.1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: IdempotencyService, useValue: mockIdempotencyService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    idempotencyService = module.get<IdempotencyService>(IdempotencyService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw BadRequestException if idempotencyKey is missing', async () => {
    await expect(
      service.processPaymentService(testIp, '', {} as ProcessPaymentDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('should create record, process payment, and log audits for first request', async () => {
    mockIdempotencyService.findOneRecordByIdempotencyKey.mockResolvedValue(null);
    mockIdempotencyService.createIdempotencyRecord.mockResolvedValue({ id: 1 });
    jest.spyOn(service, 'simulatePaymentProcessing').mockResolvedValue({
      statusCode: 200,
      body: { message: 'Payment processed successfully' },
    });

    const result = await service.processPaymentService(testIp, 'test-key', {} as ProcessPaymentDto);

    // Service response
    expect(result).toEqual({ success: true, message: 'Charged 100 GHS' });

    // Idempotency service calls
    expect(mockIdempotencyService.createIdempotencyRecord).toHaveBeenCalledWith('test-key', {});
    expect(mockIdempotencyService.updateIdempotencyRecord).toHaveBeenCalled();

    // Audit logs
    expect(mockAuditService.logRequest).toHaveBeenNthCalledWith(1, {
      idempotencyKey: 'test-key',
      requestBody: {},
      responseBody: null,
      status: 'processing',
      ipAddress: testIp,
    });
  });

  it('should replay payment if record already exists and log audit', async () => {
    mockIdempotencyService.findOneRecordByIdempotencyKey.mockResolvedValue({ id: 1 });
    mockIdempotencyService.executeOrReplay.mockResolvedValue({
      statusCode: 200,
      body: { message: 'Payment processed successfully' },
      headers: {},
    });

    const result = await service.processPaymentService(testIp, 'existing-key', {} as ProcessPaymentDto);

    // Service response
    expect(result).toEqual({
      success: true,
      message: 'Payment processed successfully',
      isReplay: true,
      previousResponseStatusCode: 200,
      headers: {},
    });

    // Idempotency execute call
    expect(mockIdempotencyService.executeOrReplay).toHaveBeenCalledWith('existing-key', {});

    // Audit log for replay
    expect(mockAuditService.logRequest).toHaveBeenCalledWith({
      idempotencyKey: 'existing-key',
      requestBody: {},
      responseBody: { message: 'Payment processed successfully' },
      status: 'replayed',
      ipAddress: testIp,
    });
  });
});