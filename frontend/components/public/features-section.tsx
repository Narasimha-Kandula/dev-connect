'use client';

import { motion } from 'framer-motion';
import { Sparkles, Users, ShieldCheck } from 'lucide-react';
import { FeatureCard } from './feature-card';

export function FeaturesSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}className="mx-auto mb-12 max-w-2xl text-center"
        >
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Built for Developer Partnerships
        </h2>
        <p className="mt-3 text-muted-foreground">
          Every feature is designed to reduce friction and accelerate
          collaboration between technical co-founders.
        </p>
      </motion.div>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          icon={Sparkles}
          title="AI-Driven Matching"
          description="Hyper-relevant matches based on tech stack, experience, and collaboration intent."
          delay={0}
        />
        <FeatureCard
          icon={Users}
          title="Real-Time Collaboration"
          description="Chat, video, and shared coding environments — all built in and ready when you are."
          delay={0.1}
        />
        <FeatureCard
          icon={ShieldCheck}
          title="Enterprise-Grade Security"
          description="RBAC, SSO-ready auth, encrypted sessions, and audited access controls."
          delay={0.2}
        />
      </div>
    </section>
  );
}
