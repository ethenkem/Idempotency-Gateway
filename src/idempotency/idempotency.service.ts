import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IdempotencyModel } from './models/idempotency.model';
import { Repository } from 'typeorm';
import { ProcessPaymentDto } from 'src/payment/dto/process-payment.dto';
import { SharedService } from 'src/shared/shared.service';
import { IdempotencyResponseDto } from './dto/idempotency-response.dto';
import { IdempotencyHelper } from './idempotency.helper';

@Injectable()
export class IdempotencyService {
  constructor(
    @InjectRepository(IdempotencyModel)
    private idempotencyRepository: Repository<IdempotencyModel>,
    private sharedService: SharedService,
    private idempotencyHelper: IdempotencyHelper,
  ) {}

  async executeOrReplay(
    idempotencyKey: string,
    body: ProcessPaymentDto,
    processPayment: () => Promise<any>,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency key is required');
    }
    const requestHash = this.sharedService.hashRequestBody(body);
    // get existing record if its exists;
    // otherwise create new record
    let record: IdempotencyModel | null =
      await this.idempotencyRepository.findOne({
        where: { idempotencyKey },
      });

    if (!record) {
      record = this.idempotencyRepository.create({
        idempotencyKey,
        requestHash,
        status: 'processing',
      });
      await this.idempotencyRepository.save(record);

      // call and simulate processing delay
      const result = await processPayment();
      record.statusCode = result.statusCode;
      record.responseData = JSON.stringify(result.body);
      record.status = 'completed';
      await this.idempotencyRepository.save(record);
      return {
        statusCode: 200,
        body: result,
        headers: null,
      };
    }

    // 6. Duplicate key handling
    if (record.requestHash == requestHash) {
      throw new ConflictException(
        'Idempotency key already used for a different request body.',
      );
    }

    if (record.status === 'completed') {
      return {
        statusCode: record.statusCode,
        headers: { 'X-Cache-Hit': 'true' },
        body: JSON.parse(record.responseData),
      };
    }

    if (record.status === 'processing') {
      await this.idempotencyHelper.waitUntilProcessingCompletes(record.id);
      record = await this.idempotencyRepository.findOne({
        where: { id: record.id },
      });
      if (record?.status === 'completed') {
        return {
          statusCode: record.statusCode,
          headers: { 'X-Cache-Hit': 'true' },
          body: JSON.parse(record.responseData),
        };
      } else {
        throw new BadRequestException('Previous request failed. Please retry.');
      }
    }
  }
}
