// ──────────────────────────────────────────────
// JSON-LD Structured Data Components
// Use these in Server Components or Client Components
// ──────────────────────────────────────────────

const BASE_URL = 'https://devconnect.dev';

interface JsonLdProps {
  data: Record<string, unknown>;
}

function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}

// ──────────────────────────────────────────────
// Organization Schema
// ──────────────────────────────────────────────

export function OrganizationSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DevConnect',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      'Discover, match, and collaborate with AI-vetted developers in real-time. Build faster, launch stronger.',
    foundingDate: '2025',
    sameAs: [
      'https://github.com/devconnect',
      'https://twitter.com/devconnect',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@devconnect.dev',
      contactType: 'customer support',
    },
  };
  return <JsonLd data={data} />;
}

// ──────────────────────────────────────────────
// WebApplication Schema
// ──────────────────────────────────────────────

export function WebApplicationSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'DevConnect',
    url: BASE_URL,
    description:
      'AI-powered developer collaboration and matching platform. Find your next co-founder or collaborator.',
    applicationCategory: 'SocialNetworking',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
  return <JsonLd data={data} />;
}

// ──────────────────────────────────────────────
// BreadcrumbList Schema
// ──────────────────────────────────────────────

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
  return <JsonLd data={data} />;
}

// ──────────────────────────────────────────────
// FAQPage Schema
// ──────────────────────────────────────────────

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQSchema({ questions }: { questions: FAQItem[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
  return <JsonLd data={data} />;
}

// ──────────────────────────────────────────────
// Person Schema (for user profiles)
// ──────────────────────────────────────────────

interface PersonSchemaProps {
  name: string;
  url: string;
  image?: string;
  jobTitle?: string;
  description?: string;
  sameAs?: string[];
}

export function PersonSchema({
  name,
  url,
  image,
  jobTitle,
  description,
  sameAs,
}: PersonSchemaProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url: `${BASE_URL}${url}`,
  };
  if (image) data.image = image;
  if (jobTitle) data.jobTitle = jobTitle;
  if (description) data.description = description;
  if (sameAs?.length) data.sameAs = sameAs;
  return <JsonLd data={data} />;
}

// ──────────────────────────────────────────────
// Product Schema (for the platform)
// ──────────────────────────────────────────────

export function ProductSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'DevConnect',
    description:
      'AI-powered developer collaboration platform. Match, chat, and build with developers worldwide.',
    brand: {
      '@type': 'Brand',
      name: 'DevConnect',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '256',
      bestRating: '5',
    },
  };
  return <JsonLd data={data} />;
}
