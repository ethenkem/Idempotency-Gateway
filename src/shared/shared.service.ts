import { Injectable } from '@nestjs/common';
import stringify from 'fast-json-stable-stringify';
import { createHash } from 'crypto';
import { ProcessPaymentDto } from 'src/payment/dto/process-payment.dto';

@Injectable()
export class SharedService {
  hashRequestBody(body: ProcessPaymentDto): string {
    const normalizedBody = stringify(body); // stable order
    const requestHash = createHash('sha256')
      .update(normalizedBody)
      .digest('hex');
    return requestHash;
  }
}
