import { Body, Controller, Get, Param, Patch, Put, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SetSkillsDto } from './dto/set-skills.dto';
import { EndorseDto } from './dto/endorse.dto';
import { SyncGitHubDto } from './dto/sync-github.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.getMe(userId);
  }

  @Get(':id/profile')
  getProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/skills')
  setSkills(@CurrentUser('id') userId: string, @Body() dto: SetSkillsDto) {
    return this.usersService.setSkills(userId, dto.skills);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/endorse')
  endorse(
    @CurrentUser('id') endorserId: string,
    @Param('id') targetId: string,
    @Body() dto: EndorseDto,
  ) {
    return this.usersService.endorseSkill(targetId, endorserId, dto.skill, dto.message);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/sync-github')
  syncGitHub(@CurrentUser('id') userId: string, @Body() dto: SyncGitHubDto) {
    return this.usersService.syncGitHub(userId, dto.username);
  }

  @Get('search')
  searchProfiles(@Query('q') q: string, @Query('limit') limit?: string, @Query('offset') offset?: string, @Query('cursor') cursor?: string) {
    return this.usersService.searchProfiles(q, limit ? parseInt(limit, 10) : undefined, offset ? parseInt(offset, 10) : undefined, cursor);
  }
}
