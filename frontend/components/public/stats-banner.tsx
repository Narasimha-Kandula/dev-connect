'use client';

import { motion } from 'framer-motion';
import { Users, TrendingUp, Clock, Zap } from 'lucide-react';
import { AnimatedCounter } from './animated-counter';

const STATS = [
  { icon: Users, value: 50000, suffix: '+', label: 'Developers' },
  { icon: TrendingUp, value: 15000, suffix: '+', label: 'Successful Matches' },
  { icon: Clock, value: 4, suffix: '.2 days', label: 'Avg time to match' },
  { icon: Zap, value: 94, suffix: '%', label: 'Satisfaction rate' },
];

export function StatsBanner() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-border bg-card p-6 text-center"
          >
            <s.icon className="mx-auto mb-3 text-primary" size={28} />
            <p className="text-3xl font-bold">
              <AnimatedCounter target={s.value} suffix={s.suffix} duration={2500} />
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
