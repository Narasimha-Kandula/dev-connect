import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
          '/send-verification',
          '/verify-email',
          '/auth/',
          '/onboarding',
          '/dashboard',
          '/discover',
          '/matches',
          '/chat',
          '/settings',
          '/admin',
          '/bookmarks',
          '/invitations',
          '/blocked',
          '/recommendations',
          '/notifications',
          '/profile/edit',
          '/projects/create',
          '/projects/*/edit',
          '/call/',
          '/collab/',
        ],
      },
    ],
    sitemap: 'https://devconnect.dev/sitemap.xml',
  };
}
