import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsIn(['whatsapp', 'instagram', 'messenger', 'telegram'])
  platform: string;

  @IsString()
  @IsIn(['inbound', 'outbound'])
  direction: string;

  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsOptional()
  @IsString()
  externalId?: string;
}
