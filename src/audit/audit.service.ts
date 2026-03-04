import { Injectable } from '@nestjs/common';
import { CreateAuditDto } from './dto/create-audit.dto';
import { Repository } from 'typeorm';
import { PaymentAudit } from './models/audit-log.model';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(PaymentAudit)
    private readonly auditRepo: Repository<PaymentAudit>,
  ) {}

  async logRequest(auditData: CreateAuditDto): Promise<PaymentAudit> {
    const audit = this.auditRepo.create({
      idempotencyKey: auditData.idempotencyKey,
      requestBody: auditData.requestBody,
      responseBody: auditData.responseBody,
      status: auditData.status,
      ipAddress: auditData.ipAddress,
    });
    return this.auditRepo.save(audit);
  }

  async findAudits(filters: Partial<PaymentAudit>): Promise<PaymentAudit[]> {
    return this.auditRepo.find({ where: filters });
  }
}
