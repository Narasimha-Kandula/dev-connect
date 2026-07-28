import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { CreateReportDto, ResolveReportDto, SuspendBanDto } from './dto/admin.dto';

@Controller()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @UseGuards(JwtAuthGuard)
  @Post('reports')
  createReport(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.adminService.createReport(userId, dto.targetType, dto.targetId, dto.reason);
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
  suspend(@CurrentUser('id') modId: string, @Param('id') id: string, @Body() dto: SuspendBanDto) {
    return this.adminService.suspendUser(id, modId, dto.reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/users/:id/ban')
  ban(@CurrentUser('id') modId: string, @Param('id') id: string, @Body() dto: SuspendBanDto) {
    return this.adminService.banUser(id, modId, dto.reason);
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
  resolveReport(@Param('id') id: string, @Body() dto: ResolveReportDto) {
    return this.adminService.resolveReport(id, dto.status);
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
