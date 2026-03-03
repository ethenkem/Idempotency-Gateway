import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ProcessPaymentDto {
  @IsNotEmpty()
  @IsNumber()
  amount: Number;

  @IsNotEmpty()
  @IsString()
  currency: string;
}
