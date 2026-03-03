import { Module } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  providers: [IdempotencyService],
  imports: [SharedModule],
})
export class IdempotencyModule {}
