import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';

@Controller()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @UseGuards(JwtAuthGuard)
  @Post('reports')
  createReport(
    @CurrentUser('id') userId: string,
    @Body('targetType') targetType: string,
    @Body('targetId') targetId: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.createReport(userId, targetType, targetId, reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @Get('admin/users')
  listUsers(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.adminService.listUsers(page ? parseInt(page, 10) : undefined, pageSize ? parseInt(pageSize, 10) : undefined);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/users/:id/suspend')
  suspend(@CurrentUser('id') modId: string, @Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.suspendUser(id, modId, reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/users/:id/ban')
  ban(@CurrentUser('id') modId: string, @Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.banUser(id, modId, reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/users/:id/reinstate')
  reinstate(@Param('id') id: string) {
    return this.adminService.reinstateUser(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @Get('admin/reports')
  listReports(@Query('status') status?: string) {
    return this.adminService.listReports(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @Patch('admin/reports/:id/resolve')
  resolveReport(@Param('id') id: string, @Body('status') status: 'reviewed' | 'actioned' | 'dismissed') {
    return this.adminService.resolveReport(id, status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @Get('admin/analytics/summary')
  analyticsSummary() {
    return this.adminService.getAnalyticsSummary();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/audit-logs')
  auditLogs(@Query('page') page?: string) {
    return this.adminService.getAuditLogs(page ? parseInt(page, 10) : undefined);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  @Get('admin/analytics/detailed')
  detailedAnalytics() {
    return this.adminService.getDetailedAnalytics();
  }
}
