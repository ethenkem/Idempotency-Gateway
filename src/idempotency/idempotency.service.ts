import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IdempotencyModel } from './models/idempotency.model';
import { Repository } from 'typeorm';
import { ProcessPaymentDto } from 'src/payment/dto/process-payment.dto';
import { SharedService } from 'src/shared/shared.service';
import { IdempotencyResponseDto } from './dto/idempotency-response.dto';
import { IdempotencyHelper } from './idempotency.helper';
import { IDEMPOTENCY_STATUSES } from 'src/shared/shared.constants';

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);
  constructor(
    @InjectRepository(IdempotencyModel)
    private idempotencyRepository: Repository<IdempotencyModel>,
    private sharedService: SharedService,
    private idempotencyHelper: IdempotencyHelper,
  ) {}

  async createIdempotencyRecord(idempotencyKey: string, body: ProcessPaymentDto): Promise<IdempotencyModel> {
    const requestHash = this.sharedService.hashRequestBody(body);
    const record = this.idempotencyRepository.create({
      idempotencyKey,
      requestHash,
      status: IDEMPOTENCY_STATUSES.PROCESSING,
    });
    return await this.idempotencyRepository.save(record);
  }

  async updateIdempotencyRecord(record: IdempotencyModel, statusCode: number, responseData: any) {
    record.statusCode = statusCode;
    record.responseData = JSON.stringify(responseData);
    record.status = IDEMPOTENCY_STATUSES.COMPLETED;
    await this.idempotencyRepository.save(record);
  }

  async findOneRecordByIdempotencyKey(idempotencyKey: string): Promise<IdempotencyModel> {
    let record: IdempotencyModel | null = await this.idempotencyRepository.findOne({
        where: { idempotencyKey },
      });

    if (!record) throw new NotFoundException('Idempotency record not found');
    return record;
  }

  async executeOrReplay(idempotencyKey: string, body: ProcessPaymentDto): Promise<IdempotencyResponseDto> {
    const requestHash = this.sharedService.hashRequestBody(body);
    // get existing record if its exists;
    let record: IdempotencyModel | null = await this.idempotencyRepository.findOne({where: { idempotencyKey },});
      
    if (!record) {
      throw new NotFoundException('Idempotency record not found');
    }

    // 6. Duplicate key handling
    // Different Request, Same Key (Fraud/Error Check) 
    if (record.requestHash !== requestHash) {
      throw new ConflictException(
        'Idempotency key already used for a different request body.',
      );
    }

    return {
        statusCode: record.statusCode,
        headers: { 'X-Cache-Hit': 'true' },
        body: JSON.parse(record.responseData),
      };
  }
}
