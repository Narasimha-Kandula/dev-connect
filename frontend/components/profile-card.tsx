'use client';

import Link from 'next/link';
import { Avatar } from '@/lib/avatar';

export interface ProfileCardUser {
  id: string;
  displayName: string;
  headline?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  skills?: { name: string; proficiency?: number }[];
  location?: string | null;
  reputationScore?: number;
}

interface ProfileCardProps {
  user: ProfileCardUser;
  size?: 'sm' | 'md' | 'lg';
  showBio?: boolean;
  showSkills?: boolean;
  showReputation?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function ProfileCard({
  user,
  size = 'md',
  showBio = false,
  showSkills = true,
  showReputation = false,
  href,
  onClick,
  className = '',
}: ProfileCardProps) {
  const avatarSize = size === 'sm' ? 'sm' : size === 'lg' ? 'xl' : 'md';
  const maxSkills = size === 'sm' ? 3 : 6;

  const inner = (
    <div className={`flex items-center gap-3 ${className}`}>
      <Avatar src={user.avatarUrl} name={user.displayName} size={avatarSize} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`truncate font-medium ${size === 'sm' ? 'text-sm' : 'text-base'}`}>{user.displayName}</p>
          {showReputation && user.reputationScore != null && (
            <span className="shrink-0 text-xs text-muted-foreground">{user.reputationScore} pts</span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{user.headline || 'Developer'}</p>
        {showBio && user.bio && (
          <p className="mt-1 text-xs text-muted-foreground/80 line-clamp-2">{user.bio}</p>
        )}
        {showSkills && user.skills && user.skills.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {user.skills.slice(0, maxSkills).map((s, i) => (
              <span key={`${s.name}-${i}`} className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-foreground/80">{s.name}</span>
            ))}
            {user.skills.length > maxSkills && (
              <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">+{user.skills.length - maxSkills}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (href) return <Link href={href} className="block hover:bg-muted/30 rounded-lg transition-colors px-3 py-2">{inner}</Link>;
  if (onClick) return <button onClick={onClick} className="w-full text-left hover:bg-muted/30 rounded-lg transition-colors px-3 py-2">{inner}</button>;
  return <div className="px-3 py-2">{inner}</div>;
}

export function SkillsList({ skills, max = 6, size = 'sm' }: { skills: { name: string; proficiency?: number }[]; max?: number; size?: 'sm' | 'xs' }) {
  if (!skills.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.slice(0, max).map((s, i) => (
        <span key={`${s.name}-${i}`} className={`rounded-full bg-muted/60 px-2.5 py-1 font-medium text-foreground/80 ${size === 'xs' ? 'text-[10px]' : 'text-xs'}`}>{s.name}</span>
      ))}
      {skills.length > max && (
        <span className={`rounded-full bg-muted/60 px-2.5 py-1 font-medium text-muted-foreground ${size === 'xs' ? 'text-[10px]' : 'text-xs'}`}>+{skills.length - max}</span>
      )}
    </div>
  );
}
