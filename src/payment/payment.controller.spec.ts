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
    mockPaymentService.processPaymentService.mockResolvedValue({
      success: true,
      message: 'Payment processed successfully',
      isReplay: true,
      previousResponseData: {
        previousResponseStatusCode: 200,
        previousResponseBody: {
          amount: 200,
          currency: 'GHS',
          message: 'Payment processed',
        },
      },
    });

    const req = { ip: '127.0.0.1' } as any;
    const res = { setHeader: jest.fn() } as any;
    const body = { amount: 200, currency: 'GHS' } as any;
    const idempotencyKey = 'existing-key';

    const result = await controller.processPayment(
      req,
      res,
      body,
      idempotencyKey,
    );

    // Assert the controller returns only success and message
    expect(result).toEqual({
      success: true,
      message: 'Payment processed successfully',
      data: {
        previousResponseStatusCode: 200,
        previousResponseBody: {
          amount: 200,
          currency: 'GHS',
          message: 'Payment processed',
        },
      },
    });

    // Assert the header is set from nested previousResponseData.headers
    expect(res.setHeader).toHaveBeenCalledWith('X-Cache-Hit', 'true');

    // Assert the service was called correctly
    expect(mockPaymentService.processPaymentService).toHaveBeenCalledWith(
      '127.0.0.1',
      'existing-key',
      {},
    );
  });
});
