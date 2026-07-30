import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { SwipeLimitsModule } from '../swipe-limits/swipe-limits.module';
import { ScoringEngine } from './strategies/scoring-engine';
import { SkillMatchStrategy } from './strategies/skill-match.strategy';
import { ComplementaryRoleStrategy } from './strategies/complementary-role.strategy';
import { ActivityLevelStrategy } from './strategies/activity-level.strategy';
import { ReputationStrategy } from './strategies/reputation.strategy';
import { LocationStrategy } from './strategies/location.strategy';
import { CollaborationHistoryStrategy } from './strategies/collab-history.strategy';

@Module({
  imports: [NotificationsModule, SwipeLimitsModule],
  providers: [
    MatchingService,
    ScoringEngine,
    SkillMatchStrategy,
    ComplementaryRoleStrategy,
    ActivityLevelStrategy,
    ReputationStrategy,
    LocationStrategy,
    CollaborationHistoryStrategy,
    {
      provide: 'MATCHING_STRATEGIES',
      useFactory: (
        skill: SkillMatchStrategy,
        complementary: ComplementaryRoleStrategy,
        activity: ActivityLevelStrategy,
        reputation: ReputationStrategy,
        location: LocationStrategy,
        collabHistory: CollaborationHistoryStrategy,
      ) => [skill, complementary, activity, reputation, location, collabHistory],
      inject: [
        SkillMatchStrategy,
        ComplementaryRoleStrategy,
        ActivityLevelStrategy,
        ReputationStrategy,
        LocationStrategy,
        CollaborationHistoryStrategy,
      ],
    },
  ],
  controllers: [MatchingController],
})
export class MatchingModule {}
