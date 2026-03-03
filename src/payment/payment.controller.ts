import { Controller, Post, Body, Headers } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { IdempotencyService } from 'src/idempotency/idempotency.service';
import { GenericResponseDto } from 'src/shared/dto/generic-response.dto';

@Controller('')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  @Post('/process-payment')
  async processPayment(
    @Body() processPayment: ProcessPaymentDto,
    @Headers('Idempotency-Key') idempotencyKey: string,
  ): Promise<GenericResponseDto> {
    const response = await this.idempotencyService.executeOrReplay(
      idempotencyKey,
      processPayment,
      () => this.paymentService.processPaymentService(processPayment),
    );
    return {
      success: true,
      message: 'Payment processed successfully',
      data: response,
    };
  }
}
