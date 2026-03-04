import { Controller, Post, Body, Headers, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { GenericResponseDto } from 'src/shared/dto/generic-response.dto';
import type { Response } from 'express';

@Controller('')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/process-payment')
  async processPayment(
    @Res({ passthrough: true }) res: Response,
    @Body() processPayment: ProcessPaymentDto,
    @Headers('Idempotency-Key') idempotencyKey: string,
  ): Promise<GenericResponseDto> {
    const response = await this.paymentService.processPaymentService(
      idempotencyKey,
      processPayment,
    );
    if (response.isReplay) {
      res.setHeader('X-Cache-Hit', response.headers['X-Cache-Hit']);
    }
    return {
      success: true,
      message: response.message,
    };
  }
}
