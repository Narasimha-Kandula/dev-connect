'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TestimonialCard } from './testimonial-card';

const TESTIMONIALS = [
  {
    name: 'Sarah Kim',
    role: 'Co-founder, Techflow',
    avatar: 'SK',
    quote: 'DevConnect replaced three months of networking in three days. We found our lead engineer through a match and shipped our MVP seven weeks later.',
    metric: '3 mo → 3 days',
    metricLabel: 'Time to find co-founder',
  },
  {
    name: 'Marcus Johnson',
    role: 'Independent Developer',
    avatar: 'MJ',
    quote: 'The AI matching is eerily accurate. Every match had relevant skills and genuine interest in the same problem space. It saved hours of manual filtering.',
    metric: '90%',
    metricLabel: 'Match relevance',
  },
  {
    name: 'Priya Patel',
    role: 'CTO, Datalens',
    avatar: 'PP',
    quote: 'We onboarded our entire engineering team through DevConnect. The SSO integration and role-based access made enterprise adoption seamless.',
    metric: '200+',
    metricLabel: 'Team members onboarded',
  },
  {
    name: 'Elena Torres',
    role: 'Open Source Maintainer',
    avatar: 'ET',
    quote: 'I found two co-maintainers for my open source project. The collab workspace with shared code editing made it feel like pair-programming in person.',
    metric: '2x',
    metricLabel: 'Contributions after match',
  },
  {
    name: 'David Park',
    role: 'Founder, Buildright',
    avatar: 'DP',
    quote: 'DevConnect\'s reputation scores and GitHub integration gave me confidence in every match. Found my CTO in under a week.',
    metric: '5/5',
    metricLabel: 'Founder satisfaction',
  },
  {
    name: 'Aisha Okafor',
    role: 'Engineering Manager',
    avatar: 'AO',
    quote: 'The talent quality is consistently higher than traditional job boards, and the time-to-hire is half. We use it as our primary sourcing tool.',
    metric: '50%',
    metricLabel: 'Faster time-to-hire',
  },
];

export function TestimonialCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -360 : 360, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const interval = setInterval(() => {
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 360, behavior: 'smooth' });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold">Trusted by Builders Worldwide</h2>
            <p className="mt-2 text-muted-foreground">
              Real stories from developers who found their match on DevConnect.
            </p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted/30 disabled:opacity-30"
              aria-label="Previous testimonials"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted/30 disabled:opacity-30"
              aria-label="Next testimonials"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex gap-6 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
        >
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="snap-start shrink-0">
              <TestimonialCard testimonial={t} />
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
