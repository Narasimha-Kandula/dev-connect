import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { MilestonesService } from './milestones.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateTaskDto, UpdateTaskStatusDto, RespondToInvitationDto } from './dto/task.dto';

@Controller('projects')
export class ProjectsController {
  constructor(
    private projectsService: ProjectsService,
    private milestonesService: MilestonesService,
  ) {}

  @Get()
  list(@Query('skill') skill?: string, @Query('status') status?: string, @Query('search') search?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.projectsService.list({
      skill,
      status,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.projectsService.getById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my/list')
  getMyProjects(@CurrentUser('id') userId: string) {
    return this.projectsService.getMyProjects(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.projectsService.delete(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  requestToJoin(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.projectsService.requestToJoin(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/tasks')
  createTask(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.projectsService.createTask(id, userId, dto.title, dto.description, dto.assigneeId, dto.dueDate);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('tasks/:taskId')
  updateTask(@CurrentUser('id') userId: string, @Param('taskId') taskId: string, @Body() dto: UpdateTaskStatusDto) {
    return this.projectsService.updateTaskStatus(taskId, userId, dto.status);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/milestones')
  createMilestone(@CurrentUser('id') userId: string, @Param('id') id: string, @Body('title') title: string, @Body('description') description?: string, @Body('dueDate') dueDate?: string) {
    return this.milestonesService.create(id, title, userId, description, dueDate);
  }

  @Get(':id/milestones')
  listMilestones(@Param('id') id: string) {
    return this.milestonesService.list(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('milestones/:id')
  updateMilestone(@CurrentUser('id') userId: string, @Param('id') id: string, @Body('status') status: string) {
    return this.milestonesService.updateStatus(id, status, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('milestones/:id')
  deleteMilestone(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.milestonesService.delete(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/invitations/:invitationId/respond')
  respondToInvitation(@CurrentUser('id') userId: string, @Param('invitationId') invitationId: string, @Body() dto: RespondToInvitationDto) {
    return this.projectsService.respondToInvitation(invitationId, userId, dto.action);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/members')
  addMember(@CurrentUser('id') userId: string, @Param('id') id: string, @Body('targetUserId') targetUserId: string, @Body('role') role?: 'CONTRIBUTOR' | 'VIEWER') {
    return this.projectsService.addMember(id, userId, targetUserId, role);
  }
}
