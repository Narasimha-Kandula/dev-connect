'use client';

import { motion } from 'framer-motion';
import { Sparkles, Users, ShieldCheck } from 'lucide-react';
import { StepCard } from './step-card';

export function StepsSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}className="mx-auto mb-12 max-w-2xl text-center"
        >
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          From Profile to Partnership in Minutes
        </h2>
        <p className="mt-3 text-muted-foreground">
          No cold DMs, no endless job boards. Just three steps to finding your
          next co-founder.
        </p>
      </motion.div>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StepCard
          step="01"
          icon={Sparkles}
          title="Create Your Developer Profile"
          description="Sign up in under 60 seconds. Import GitHub, add skills, set your availability."
          details="GitHub auto-import · Skill tags · Availability toggle"
          index={0}
        />
        <StepCard
          step="02"
          icon={Users}
          title="Discover & Match"
          description="Browse AI-ranked profiles. Mutual interest triggers a match instantly."
          details="AI ranking · Skill filters · Mutual match trigger"
          index={1}
        />
        <StepCard
          step="03"
          icon={ShieldCheck}
          title="Collaborate Instantly"
          description="Chat, video call, and co-code in shared workspaces from day one."
          details="Real-time chat · Video calls · Shared code editor"
          index={2}
        />
      </div>
    </section>
  );
}
