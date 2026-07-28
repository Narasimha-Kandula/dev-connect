import { Module } from '@nestjs/common';
import { CollabService } from './collab.service';
import { CollabController } from './collab.controller';

@Module({
  providers: [CollabService],
  controllers: [CollabController],
})
export class CollabModule {}
