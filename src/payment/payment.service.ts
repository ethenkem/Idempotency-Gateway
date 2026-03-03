import { BadRequestException, Injectable } from '@nestjs/common';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { IdempotencyService } from 'src/idempotency/idempotency.service';
import { ProcessRaymentResponseDto } from './dto/process-payment-response.dto';

@Injectable()
export class PaymentService {
  constructor(
    private readonly idempotencyService: IdempotencyService,
  ){}
   // Simulate payment processing logic
  async simulatePaymentProcessing(): Promise<{ statusCode: number; body: any }> {
    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Simulate a successful payment response
    return {
      statusCode: 200,
      body: { message: 'Payment processed successfully' },
    };
  } 

  async processPaymentService(idempotencyKey: string, body: ProcessPaymentDto): Promise<ProcessRaymentResponseDto> {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency key is required');
    }
    let record = await this.idempotencyService.findOneRecordByIdempotencyKey(idempotencyKey)
    if (!record) { 
      record = await this.idempotencyService.createIdempotencyRecord(idempotencyKey, body)
      // Simulate payment processing delay
      const result = await this.simulatePaymentProcessing();
      await this.idempotencyService.updateIdempotencyRecord(record, result.statusCode, result.body);
      return { success: true, message:"Charged 100 GHS"};
    } else {
      // if record exists
      const res = await this.idempotencyService.executeOrReplay(idempotencyKey, body);
      return {success: true, message: res.body.message, isReplay: true, previousResponseStatusCode: res.statusCode, headers: res.headers};
    }
  }
}
