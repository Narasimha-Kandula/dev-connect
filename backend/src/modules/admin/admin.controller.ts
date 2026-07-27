import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MODERATOR')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  listUsers(@Query('page') page?: string) {
    return this.adminService.listUsers(page ? parseInt(page, 10) : undefined);
  }

  @Roles('ADMIN')
  @Patch('users/:id/suspend')
  suspend(@CurrentUser('id') modId: string, @Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.suspendUser(id, modId, reason);
  }

  @Roles('ADMIN')
  @Patch('users/:id/ban')
  ban(@CurrentUser('id') modId: string, @Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.banUser(id, modId, reason);
  }

  @Roles('ADMIN')
  @Patch('users/:id/reinstate')
  reinstate(@Param('id') id: string) {
    return this.adminService.reinstateUser(id);
  }

  @Get('reports')
  listReports(@Query('status') status?: string) {
    return this.adminService.listReports(status);
  }

  @Patch('reports/:id/resolve')
  resolveReport(@Param('id') id: string, @Body('status') status: 'reviewed' | 'actioned' | 'dismissed') {
    return this.adminService.resolveReport(id, status);
  }

  @Get('analytics/summary')
  analyticsSummary() {
    return this.adminService.getAnalyticsSummary();
  }

  @Roles('ADMIN')
  @Get('audit-logs')
  auditLogs(@Query('page') page?: string) {
    return this.adminService.getAuditLogs(page ? parseInt(page, 10) : undefined);
  }
}
