import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { IdempotencyModule } from 'src/idempotency/idempotency.module';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService],
  imports: [IdempotencyModule],
})
export class PaymentModule {}
