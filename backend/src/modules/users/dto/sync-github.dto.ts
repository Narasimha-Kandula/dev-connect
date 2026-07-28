import { IsString, Matches } from 'class-validator';

export class SyncGitHubDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/, { message: 'Invalid GitHub username format' })
  username!: string;
}
