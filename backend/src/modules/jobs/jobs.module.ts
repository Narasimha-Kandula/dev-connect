import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../prisma/prisma.module';
import { SearchModule } from '../search/search.module';
import { JobsService } from './jobs.service';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, SearchModule],
  providers: [JobsService],
})
export class JobsModule {}
