import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IdempotencyModel } from './models/idempotency.model';
import { ObjectId, Repository } from 'typeorm';
import { ProcessPaymentDto } from 'src/payment/dto/process-payment.dto';
import { SharedService } from 'src/shared/shared.service';
import { IdempotencyResponseDto } from './dto/idempotency-response.dto';
import { IdempotencyHelper } from './idempotency.helper';
import { IDEMPOTENCY_STATUSES } from 'src/shared/shared.constants';

@Injectable()
export class IdempotencyService {

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

  async updateIdempotencyRecord(record: IdempotencyModel, statusCode: number, responseData: any, status: IDEMPOTENCY_STATUSES) {
    record.statusCode = statusCode;
    record.responseData = JSON.stringify(responseData);
    record.status = status;
    await this.idempotencyRepository.save(record);
  }

  async findOneRecordByIdempotencyKey(idempotencyKey: string): Promise<IdempotencyModel | null> {
    let record: IdempotencyModel | null = await this.idempotencyRepository.findOne({
        where: { idempotencyKey },
      });
    return record;
  }
  
  async findOneRecordById(id: ObjectId): Promise<IdempotencyModel> {
    let record: IdempotencyModel | null = await this.idempotencyRepository.findOne({
        where: { _id: id },
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
    
    
    // The "In-Flight" Check
    if (record.status === IDEMPOTENCY_STATUSES.PROCESSING) {
        const processResponse = await this.idempotencyHelper.waitUntilProcessingCompletes(record._id);
        record = await this.findOneRecordById(record._id);
        if (record?.status === 'completed') {
          return { statusCode: processResponse.statusCode, body: processResponse.body };
        } else {
          throw new BadRequestException('Previous request failed. Please retry.');
        }
    }

    return {
        statusCode: record.statusCode,
        headers: { 'X-Cache-Hit': 'true' },
        body: JSON.parse(record.responseData),
      };
  }
}
