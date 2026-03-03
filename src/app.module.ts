import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentModule } from './payment/payment.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdempotencyModule } from './idempotency/idempotency.module';
import { SharedModule } from './shared/shared.module';
import { SharedService } from './shared/shared.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      entities: [__dirname + '/**/*.model{.ts,.js}'],
      synchronize: true,
    }),
    PaymentModule,
    IdempotencyModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [SharedService],
})
export class AppModule {}
