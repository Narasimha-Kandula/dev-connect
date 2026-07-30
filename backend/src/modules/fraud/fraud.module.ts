import { Module } from '@nestjs/common';
import { FraudDetectionService } from './fraud-detection.service';
import { FraudController } from './fraud.controller';

@Module({
  providers: [FraudDetectionService],
  controllers: [FraudController],
  exports: [FraudDetectionService],
})
export class FraudModule {}
