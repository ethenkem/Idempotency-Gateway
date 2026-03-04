import { Controller, Post, Body, Headers, Res, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { GenericResponseDto } from 'src/shared/dto/generic-response.dto';
import type { Request, Response } from 'express';

@Controller('')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('/process-payment')
  async processPayment(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() processPayment: ProcessPaymentDto,
    @Headers('Idempotency-Key') idempotencyKey: string,
  ): Promise<GenericResponseDto> {
    // Extract client IP address
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const strIpAddress = Array.isArray(ipAddress) ? ipAddress[0] : ipAddress;
    const response = await this.paymentService.processPaymentService(
      strIpAddress,
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
