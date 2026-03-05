import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ProcessPaymentDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  currency: string;
}
