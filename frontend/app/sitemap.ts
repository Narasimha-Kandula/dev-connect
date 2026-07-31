import type { MetadataRoute } from 'next';

const BASE_URL = 'https://devconnect.dev';

// Skill-based SEO pages — expand this list over time
const SKILL_SLUGS = [
  'react', 'nodejs', 'python', 'typescript', 'javascript', 'golang', 'rust',
  'java', 'kotlin', 'swift', 'flutter', 'angular', 'vue', 'nextjs',
  'aws', 'docker', 'kubernetes', 'devops', 'machine-learning', 'ai',
  'blockchain', 'solidity', 'graphql', 'postgresql', 'mongodb', 'redis',
];

// Developer location pages
const LOCATION_SLUGS = [
  'india', 'united-states', 'united-kingdom', 'germany', 'canada',
  'australia', 'france', 'brazil', 'japan', 'singapore',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/features`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/how-it-works`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/safety`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/security`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE_URL}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  // Programmatic SEO: /developers/[skill]
  const skillPages: MetadataRoute.Sitemap = SKILL_SLUGS.map((skill) => ({
    url: `${BASE_URL}/developers/${skill}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // /developers/location/[location]
  const locationPages: MetadataRoute.Sitemap = LOCATION_SLUGS.map((location) => ({
    url: `${BASE_URL}/developers/location/${location}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...skillPages, ...locationPages];
}
