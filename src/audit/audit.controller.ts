import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PaymentAudit } from './models/audit-log.model';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get("/logs")
  async filterAudits(
    @Query('key') idempotencyKey?: string,
    @Query('status') status?: string,
    @Query('ip') ipAddress?: string,
  ): Promise<PaymentAudit[]> {
    // Build a filter object
    const filters: any = {};
    if (idempotencyKey) filters.idempotencyKey = idempotencyKey;
    if (status) filters.status = status;
    if (ipAddress) filters.ipAddress = ipAddress;

    // Call service method to query audits
    return this.auditService.findAudits(filters);
  }
}
