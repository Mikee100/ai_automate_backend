import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  message?: string;

  @IsString()
  @IsOptional()
  service?: string;

  @IsDateString()
  @IsOptional()
  dateTime?: string;
}
