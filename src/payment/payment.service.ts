import { BadRequestException, Injectable, Req } from '@nestjs/common';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { IdempotencyService } from 'src/idempotency/idempotency.service';
import { ProcessRaymentResponseDto } from './dto/process-payment-response.dto';
import { AuditService } from 'src/audit/audit.service';
import { AUDIT_LOG_RECORD_STATUSES } from 'src/audit/audit.constants';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PaymentService {
  constructor(
    private readonly idempotencyService: IdempotencyService,
    private readonly auditService: AuditService,
  ){}
   // Simulate payment processing logic
  async simulatePaymentProcessing(): Promise<{ statusCode: number; body: any }> {
    console.log('Simulating payment processing...');
    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Simulate a successful payment response
    return {
      statusCode: 200,
      body: { message: 'Payment processed successfully' },
    };
  } 

  async processPaymentService(ipAddress: string, idempotencyKey: string, body: ProcessPaymentDto): Promise<ProcessRaymentResponseDto> {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency key is required');
    }
    let record = await this.idempotencyService.findOneRecordByIdempotencyKey(idempotencyKey)

    if (!record) { 
       // Log audit for processing
      const auditLog = {idempotencyKey, requestBody:body, responseBody: null, status: AUDIT_LOG_RECORD_STATUSES.PROCESSING, ipAddress};
      await this.auditService.logRequest(auditLog);
      
      record = await this.idempotencyService.createIdempotencyRecord(idempotencyKey, body)
      // Simulate payment processing delay
      const result = await this.simulatePaymentProcessing();

      await this.idempotencyService.updateIdempotencyRecord(record, result.statusCode, result.body);
      return { success: true, message:"Charged 100 GHS"};
    } else {
      // if record exists 
      const res = await this.idempotencyService.executeOrReplay(idempotencyKey, body);

       // Log audit for replayed request
      const auditLog = {idempotencyKey, requestBody:body, responseBody: res.body, status: AUDIT_LOG_RECORD_STATUSES.REPLAYED, ipAddress};
      await this.auditService.logRequest(auditLog);
      return {success: true, message: res.body.message, isReplay: true, previousResponseStatusCode: res.statusCode, headers: res.headers};
    }
  }
}
