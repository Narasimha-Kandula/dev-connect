import type { Metadata } from 'next';

const BASE_URL = 'https://devconnect.dev';

interface SEOProps {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
  publishedTime?: string;
  author?: string;
}

/**
 * Generates a comprehensive Metadata object for Next.js App Router.
 * Every public page MUST use this to ensure canonical URLs and rich meta.
 */
export function generateMetadata({
  title,
  description,
  path,
  keywords,
  ogImage,
  noIndex,
  publishedTime,
  author,
}: SEOProps): Metadata {
  const url = `${BASE_URL}${path}`;
  const imageUrl = ogImage ?? `${BASE_URL}/og-default.png`;

  return {
    title,
    description,
    keywords: keywords?.join(', '),
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'DevConnect',
      locale: 'en_US',
      type: publishedTime ? 'article' : 'website',
      ...(publishedTime && { publishedTime }),
      ...(author && { authors: [author] }),
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

/**
 * Pre-built metadata for high-intent keyword pages.
 */
export const LANDING_META = generateMetadata({
  title: 'DevConnect — Find Your Next Tech Co-Founder',
  description:
    'Discover, match, and collaborate with AI-vetted developers in real-time. The #1 developer collaboration platform for finding your next co-founder.',
  path: '/',
  keywords: [
    'developer collaboration platform',
    'find developers to collaborate',
    'developer matching platform',
    'tech co-founder',
    'dev tinder',
    'open source developer network',
    'developer networking',
  ],
});

export const FEATURES_META = generateMetadata({
  title: 'Features — DevConnect',
  description:
    'Explore DevConnect features: AI-powered developer matching, real-time chat, collaborative coding rooms, skill-based discovery, and more.',
  path: '/features',
  keywords: [
    'developer matching features',
    'AI developer matching',
    'collaboration tools for developers',
    'developer platform features',
  ],
});

export const HOW_IT_WORKS_META = generateMetadata({
  title: 'How It Works — DevConnect',
  description:
    'Learn how DevConnect works: create a profile, discover developers, match with collaborators, and build projects together. Get started in minutes.',
  path: '/how-it-works',
  keywords: [
    'how to find developer collaborators',
    'developer matching platform guide',
    'start collaborating on projects',
  ],
});

export const FAQ_META = generateMetadata({
  title: 'FAQ — DevConnect',
  description:
    'Frequently asked questions about DevConnect. Learn about developer matching, collaboration tools, privacy, safety, and how to get started.',
  path: '/faq',
  keywords: ['DevConnect FAQ', 'developer collaboration questions', 'matching platform help'],
});

export const ABOUT_META = generateMetadata({
  title: 'About — DevConnect',
  description:
    'DevConnect is the AI-powered platform connecting developers worldwide. Find your next co-founder, collaborator, or team member.',
  path: '/about',
  keywords: ['about DevConnect', 'developer platform mission', 'tech co-founder platform'],
});

export const CONTACT_META = generateMetadata({
  title: 'Contact Us — DevConnect',
  description: 'Get in touch with the DevConnect team. Support, partnerships, and general inquiries.',
  path: '/contact',
});

export const PRIVACY_META = generateMetadata({
  title: 'Privacy Policy — DevConnect',
  description:
    'DevConnect privacy policy. Learn how we collect, use, and protect your personal data.',
  path: '/privacy',
});

export const TERMS_META = generateMetadata({
  title: 'Terms of Service — DevConnect',
  description:
    'DevConnect terms of service governing the use of our developer collaboration platform.',
  path: '/terms',
});

export const SAFETY_META = generateMetadata({
  title: 'Safety Guidelines — DevConnect',
  description:
    'Stay safe on DevConnect. Learn about our community guidelines, reporting mechanisms, and safety best practices.',
  path: '/safety',
  keywords: ['developer safety', 'online collaboration safety', 'DevConnect community guidelines'],
});

export const SECURITY_META = generateMetadata({
  title: 'Security — DevConnect',
  description:
    'DevConnect security practices. End-to-end encryption, secure authentication, and data protection for our developer community.',
  path: '/security',
  keywords: ['developer platform security', 'secure collaboration', 'data protection developers'],
});
