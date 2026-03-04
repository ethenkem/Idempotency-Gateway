import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentAudit } from './models/audit-log.model';

@Module({
  controllers: [AuditController],
  imports: [TypeOrmModule.forFeature([PaymentAudit])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
