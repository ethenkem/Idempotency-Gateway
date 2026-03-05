import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from './payment/payment.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdempotencyModule } from './idempotency/idempotency.module';
import { SharedModule } from './shared/shared.module';
import { SharedService } from './shared/shared.service';
import { AuditModule } from './audit/audit.module';
import { ConfigModule } from '@nestjs/config';
import { getMongoDbConnectionString } from './shared/shared.constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PaymentModule,
    IdempotencyModule,
    SharedModule,
    AuditModule,
    TypeOrmModule.forRoot({
      type: 'mongodb',
      url: getMongoDbConnectionString(),
      entities: [__dirname + '/**/*.model{.ts,.js}'],
      synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
