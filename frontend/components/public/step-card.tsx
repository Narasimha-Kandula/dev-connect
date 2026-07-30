'use client';

import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

export function StepCard({
  step,
  icon: Icon,
  title,
  description,
  details,
  index,
}: {
  step: string;
  icon: LucideIcon;
  title: string;
  description: string;
  details: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="relative rounded-xl border border-border bg-card p-6"
    >
      {index < 2 && (
        <div className="absolute top-14 left-7 hidden h-[calc(100%+1.5rem)] w-px bg-gradient-to-b from-primary/30 to-transparent sm:block" />
      )}
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {step}
        </div>
        <div>
          <div className="mb-2 text-primary">
            <Icon size={22} />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
          <p className="mt-2 text-xs text-muted-foreground">{details}</p>
        </div>
      </div>
    </motion.div>
  );
}
