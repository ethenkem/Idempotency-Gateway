import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { IdempotencyModel } from './models/idempotency.model';

@Injectable()
export class IdempotencyHelper {
  constructor(private idempotencyRepository: Repository<IdempotencyModel>) {}

  async waitUntilProcessingCompletes(recordId: number) {
    let record = await this.idempotencyRepository.findOne({
      where: { id: recordId },
    });
    while (record?.status === 'processing') {
      await new Promise((resolve) => setTimeout(resolve, 100));
      record = await this.idempotencyRepository.findOne({
        where: { id: recordId },
      });
    }
  }
}
