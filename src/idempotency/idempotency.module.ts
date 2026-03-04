import { Module } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';
import { SharedModule } from 'src/shared/shared.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdempotencyModel } from './models/idempotency.model';
import { IdempotencyHelper } from './idempotency.helper';

@Module({
  providers: [IdempotencyService, IdempotencyHelper],
  imports: [SharedModule, TypeOrmModule.forFeature([IdempotencyModel])],
  exports: [IdempotencyService],
})
export class IdempotencyModule {}
