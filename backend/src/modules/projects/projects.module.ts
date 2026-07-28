import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { MilestonesService } from './milestones.service';
import { ProjectsController } from './projects.controller';

@Module({
  providers: [ProjectsService, MilestonesService],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
