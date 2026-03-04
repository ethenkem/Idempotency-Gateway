import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { IdempotencyModel } from './models/idempotency.model';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class IdempotencyHelper {
  constructor(  
    @InjectRepository(IdempotencyModel)
    private idempotencyRepository: Repository<IdempotencyModel>
  ) {}

  async waitUntilProcessingCompletes(recordId: string) {
    let record = await this.idempotencyRepository.findOne({
      where: { id: recordId },
    });
    while (record?.status === 'processing') {
      await new Promise((resolve) => setTimeout(resolve, 100));
      record = await this.idempotencyRepository.findOne({
        where: { id: recordId },
      });
    }
    // simulate payment processing delay and response
    return {
      statusCode: 200,
      body: { message: 'Payment processed successfully' },
    };
  }
}
