import { Injectable } from '@nestjs/common';
import { ProcessPaymentDto } from './dto/process-payment.dto';

@Injectable()
export class PaymentService {
  async processPaymentService(processPaymentDto: ProcessPaymentDto) {
    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
