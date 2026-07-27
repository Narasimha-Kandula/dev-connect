import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  list(@Query('skill') skill?: string) {
    return this.projectsService.list({ skill });
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.projectsService.getById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  requestToJoin(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.projectsService.requestToJoin(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/tasks')
  createTask(@Param('id') id: string, @Body('title') title: string, @Body('description') description?: string) {
    return this.projectsService.createTask(id, title, description);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('tasks/:taskId')
  updateTask(@Param('taskId') taskId: string, @Body('status') status: string) {
    return this.projectsService.updateTaskStatus(taskId, status);
  }
}
