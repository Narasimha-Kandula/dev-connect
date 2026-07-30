import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/device.dto';

@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  @Post('register')
  register(@CurrentUser('id') userId: string, @Body() dto: RegisterDeviceDto) {
    return this.devicesService.register(userId, dto.deviceToken, dto.platform, dto.deviceName, dto.userAgent);
  }

  @Post('unregister')
  unregister(
    @CurrentUser('id') userId: string,
    @Body() dto: { deviceToken: string; platform?: string },
  ) {
    return this.devicesService.unregister(userId, dto.deviceToken, dto.platform);
  }
}
