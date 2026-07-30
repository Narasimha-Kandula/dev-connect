import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',

  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
    jwksUrl: process.env.SUPABASE_JWKS_URL,
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  meilisearch: {
    host: process.env.MEILISEARCH_HOST ?? 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_API_KEY,
  },

  resend: {
    apiKey: process.env.RESEND_API_KEY,
    emailFrom: process.env.EMAIL_FROM ?? 'DevConnect <no-reply@devconnect.dev>',
  },

  features: {
    aiMatching: process.env.ENABLE_AI_MATCHING === 'true',
    realtime: process.env.ENABLE_REALTIME !== 'false',
  },

  firebase: {
    serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID,
  },

  apns: {
    key: process.env.APNS_KEY,
    keyId: process.env.APNS_KEY_ID,
    teamId: process.env.APNS_TEAM_ID,
    bundleId: process.env.APNS_BUNDLE_ID ?? 'com.devconnect.app',
  },

  fraud: {
    swipeThreshold: parseInt(process.env.FRAUD_SWIPE_THRESHOLD ?? '50', 10),
    requestThreshold: parseInt(process.env.FRAUD_REQUEST_THRESHOLD ?? '200', 10),
    minProfileCompleteness: parseInt(process.env.FRAUD_MIN_PROFILE_COMPLETENESS ?? '20', 10),
    captchaSiteKey: process.env.CAPTCHA_SITE_KEY ?? '',
    captchaSecretKey: process.env.CAPTCHA_SECRET_KEY ?? '',
  },

  swipeLimits: {
    free: parseInt(process.env.SWIPE_LIMIT_FREE ?? '20', 10),
    pro: parseInt(process.env.SWIPE_LIMIT_PRO ?? '100', 10),
  },

  oauth: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      redirectUri: (process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/auth/google/callback').split(',')[0],
    },
  },
}));
