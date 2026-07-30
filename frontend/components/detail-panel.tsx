'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Briefcase, Star, Globe, Github, Linkedin, ExternalLink } from 'lucide-react';
import { Avatar } from '@/lib/avatar';
import { SkillsList } from '@/components/profile-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export interface DetailPanelUser {
  userId: string;
  displayName: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
  experienceLevel?: string | null;
  availability?: string | null;
  reputationScore: number;
  skills: { name: string; proficiency: number }[];
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  githubUsername?: string | null;
}

interface DetailPanelProps {
  user: DetailPanelUser | null;
  onClose: () => void;
  onSwipe?: (direction: 'left' | 'right' | 'super') => void;
}

export function DetailPanel({ user, onClose, onSwipe }: DetailPanelProps) {
  return (
    <AnimatePresence>
      {user && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 lg:bg-transparent"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-2xl overflow-y-auto"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between bg-card/80 backdrop-blur-sm px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold">Profile Details</h2>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted/30 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <Avatar src={user.avatarUrl} name={user.displayName} size="xl" className="shrink-0 shadow-sm ring-2 ring-border" />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold truncate">{user.displayName}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.headline || 'Developer'}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <span className="text-xs font-medium text-muted-foreground">{user.reputationScore}</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</h3>
                  <p className="text-sm leading-relaxed text-foreground/90">{user.bio}</p>
                </div>
              )}

              {/* Location & Experience */}
              <div className="flex flex-wrap gap-3">
                {user.location && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin size={14} />
                    <span>{user.location}</span>
                  </div>
                )}
                {user.experienceLevel && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Briefcase size={14} />
                    <span className="capitalize">{user.experienceLevel}</span>
                  </div>
                )}
                {user.availability && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600">
                    <Globe size={12} /> Available
                  </span>
                )}
              </div>

              {/* Skills */}
              {user.skills.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Skills</h3>
                  <SkillsList skills={user.skills} max={20} />
                </div>
              )}

              {/* Links */}
              {(user.githubUrl || user.linkedinUrl || user.portfolioUrl) && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Links</h3>
                  <div className="space-y-2">
                    {user.githubUrl && (
                      <a href={user.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Github size={16} /> GitHub {user.githubUsername && <>(@{user.githubUsername})</>}
                      </a>
                    )}
                    {user.linkedinUrl && (
                      <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Linkedin size={16} /> LinkedIn
                      </a>
                    )}
                    {user.portfolioUrl && (
                      <a href={user.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ExternalLink size={16} /> Portfolio
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Link href={`/profile/${user.userId}`} className="flex-1">
                  <Button size="sm" className="w-full">View Full Profile</Button>
                </Link>
                <Link href={`/chat`} className="flex-1">
                  <Button size="sm" variant="secondary" className="w-full">Send Message</Button>
                </Link>
              </div>
              {onSwipe && (
                <div className="flex justify-center gap-4 pt-2">
                  <button onClick={() => onSwipe('left')} className="p-3 rounded-full bg-danger/10 text-danger hover:bg-danger/20 transition-colors">
                    <X size={20} />
                  </button>
                  <button onClick={() => onSwipe('right')} className="p-3 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    <Star size={20} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
