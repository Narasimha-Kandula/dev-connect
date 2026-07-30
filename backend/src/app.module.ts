import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import appConfig from './config/app.config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SkillsModule } from './modules/skills/skills.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { MatchingModule } from './modules/matching/matching.module';
import { ChatModule } from './modules/chat/chat.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { CollabModule } from './modules/collab/collab.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { ProfileModule } from './modules/profile/profile.module';
import { InviteModule } from './modules/invite/invite.module';
import { UploadModule } from './modules/upload/upload.module';
import { DevicesModule } from './modules/devices/devices.module';
import { SwipeLimitsModule } from './modules/swipe-limits/swipe-limits.module';
import { FraudModule } from './modules/fraud/fraud.module';
import { SearchModule } from './modules/search/search.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ReputationModule } from './modules/reputation/reputation.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    SkillsModule,
    DiscoveryModule,
    MatchingModule,
    ChatModule,
    ProjectsModule,
    NotificationsModule,
    AdminModule,
    CollabModule,
    RecommendationsModule,
    ProfileModule,
    InviteModule,
    UploadModule,
    DevicesModule,
    SwipeLimitsModule,
    FraudModule,
    SearchModule,
    JobsModule,
    ReputationModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
