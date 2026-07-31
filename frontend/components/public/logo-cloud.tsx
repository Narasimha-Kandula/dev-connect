'use client';

import { motion } from 'framer-motion';

const COMPANIES = ['Vercel', 'Railway', 'Supabase', 'Netlify'];

export function LogoCloud() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-muted-foreground"
    >
      <span className="font-medium">Trusted by 500+ engineering teams</span>
      <span className="hidden opacity-30 sm:inline">|</span>
      <div className="flex items-center gap-3 sm:gap-6">
        {COMPANIES.map((name, i) => (
          <motion.span
            key={name}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className={`font-semibold opacity-50 transition-opacity hover:opacity-80 ${i > 0 ? 'hidden sm:inline' : ''}`}
          >
            {name}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}
