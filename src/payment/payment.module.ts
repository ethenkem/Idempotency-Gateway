import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { IdempotencyModule } from 'src/idempotency/idempotency.module';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService],
  imports: [IdempotencyModule, AuditModule],
})
export class PaymentModule {}
