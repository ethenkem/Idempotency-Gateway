import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: PaymentService;

  const mockPaymentService = {
    processPaymentService: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should replay payment if record already exists', async () => {
    // Mock the service to simulate an existing record
    mockPaymentService.processPaymentService.mockResolvedValue({
      success: true,
      message: 'Payment processed successfully',
      isReplay: true,
      previousResponseStatusCode: 200,
      headers: { 'X-Cache-Hit': 'true' },
    });
    const res = { setHeader: jest.fn() } as any;
    const body = {} as any;
    const idempotencyKey = 'existing-key';

    // Call the controller method
    const result = await controller.processPayment(res, body, idempotencyKey);

    // Assert the controller returns the service result
    expect(result).toEqual({
      success: true,
      message: 'Payment processed successfully',
    });

    // Assert the header is set correctly if it's a replay
    expect(res.setHeader).toHaveBeenCalledWith('X-Cache-Hit', 'true');

    // Assert the service method was called with correct arguments
    expect(mockPaymentService.processPaymentService).toHaveBeenCalledWith(
      'existing-key',
      {},
    );
  });
});
