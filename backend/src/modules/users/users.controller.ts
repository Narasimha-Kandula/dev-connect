import { Body, Controller, Get, Param, Patch, Put, Post, Delete, Query, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
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
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const name = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only JPEG, PNG, GIF, and WebP images are allowed'), false);
        }
      },
    }),
  )
  uploadAvatar(@CurrentUser('id') userId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    return this.usersService.uploadAvatar(userId, file.filename);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/sync-github')
  syncGitHub(@CurrentUser('id') userId: string, @Body() dto: SyncGitHubDto) {
    return this.usersService.syncGitHub(userId, dto.username);
  }

  @Get('search')
  searchProfiles(
    @Query('q') q: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('cursor') cursor?: string,
    @Query('sort') sort?: string,
  ) {
    return this.usersService.searchProfiles(
      q,
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
      cursor,
      sort,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/block')
  blockUser(@CurrentUser('id') userId: string, @Param('id') targetId: string) {
    return this.usersService.blockUser(userId, targetId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/block')
  unblockUser(@CurrentUser('id') userId: string, @Param('id') targetId: string) {
    return this.usersService.unblockUser(userId, targetId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/blocked')
  getBlockedUsers(@CurrentUser('id') userId: string) {
    return this.usersService.getBlockedUsers(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/save')
  saveProfile(@CurrentUser('id') userId: string, @Param('id') targetId: string) {
    return this.usersService.saveProfile(userId, targetId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/save')
  unsaveProfile(@CurrentUser('id') userId: string, @Param('id') targetId: string) {
    return this.usersService.unsaveProfile(userId, targetId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/saved')
  getSavedProfiles(@CurrentUser('id') userId: string) {
    return this.usersService.getSavedProfiles(userId);
  }
}
