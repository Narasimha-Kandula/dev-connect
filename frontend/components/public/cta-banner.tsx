'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CtaBanner() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className="mx-auto mb-16 max-w-5xl px-6"
    >
      <div className="gradient-brand rounded-2xl px-6 py-16 text-center text-white sm:px-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Join thousands building the future.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-white/80">
          50,000+ developers have already found their next co-founder on DevConnect.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-primary shadow-md transition-all hover:bg-white/90 hover:shadow-lg"
        >
          Start Building Free <ArrowRight size={18} />
        </Link>
      </div>
    </motion.section>
  );
}
