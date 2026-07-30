import { IsString, IsIn, IsOptional } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  deviceToken!: string;

  @IsIn(['ios', 'android', 'web'])
  platform!: 'ios' | 'android' | 'web';

  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}
