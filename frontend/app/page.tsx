import type { Metadata } from 'next';
import { HeroSection } from '@/components/public/hero-section';
import { FeaturesSection } from '@/components/public/features-section';
import { StepsSection } from '@/components/public/steps-section';
import { StatsBanner } from '@/components/public/stats-banner';
import { CtaBanner } from '@/components/public/cta-banner';
import { TestimonialCarousel } from '@/components/public/testimonial-carousel';

export const metadata: Metadata = {
  title: 'DevConnect — Find Your Next Tech Co-Founder',
  description:
    'Discover, match, and collaborate with AI-vetted developers in real-time. Move beyond job boards and build faster with the right co-founder.',
  openGraph: {
    title: 'DevConnect — Find Your Next Tech Co-Founder',
    description:
      'Discover, match, and collaborate with AI-vetted developers in real-time. Build faster, launch stronger.',
    url: 'https://devconnect.dev',
    siteName: 'DevConnect',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevConnect — Find Your Next Tech Co-Founder',
    description:
      'Discover, match, and collaborate with AI-vetted developers in real-time.',
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'DevConnect',
  url: 'https://devconnect.dev',
  description:
    'Find your next tech co-founder and build something great. AI-powered developer matching platform.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://devconnect.dev/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <HeroSection />
      <FeaturesSection />
      <StepsSection />
      <TestimonialCarousel />
      <StatsBanner />
      <CtaBanner />
    </>
  );
}
