import 'dotenv/config';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    // eslint-disable-next-line no-console
    console.warn(`[config] Missing env var ${name} — set it in .env before relying on this feature.`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  appName: process.env.APP_NAME || 'BizzGuest',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:4000',
  port: Number(process.env.BACKEND_PORT_INTERNAL || 4000),
  timezone: process.env.TZ || 'Africa/Douala',
  currency: process.env.DEFAULT_CURRENCY || 'XAF',

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  },

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
    max: Number(process.env.RATE_LIMIT_MAX || 100),
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 10)
  },

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '30d'
  },

  encryption: {
    fieldKeyHex: required('FIELD_ENCRYPTION_KEY')
  },

  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
    publicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL || 'http://localhost:4000/uploads'
  },

  // >>> Requires your Campay API credentials — see .env.example <<<
  campay: {
    env: process.env.CAMPAY_ENV || 'sandbox',
    baseUrl: process.env.CAMPAY_BASE_URL || 'https://demo.campay.net',
    appUsername: process.env.CAMPAY_APP_USERNAME || '',
    appPassword: process.env.CAMPAY_APP_PASSWORD || '',
    webhookKey: process.env.CAMPAY_WEBHOOK_KEY || '',
    isConfigured: Boolean(process.env.CAMPAY_APP_USERNAME && process.env.CAMPAY_APP_PASSWORD)
  },

  // >>> Requires your SMTP credentials — see .env.example <<<
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    fromName: process.env.MAIL_FROM_NAME || 'BizzGuest',
    fromAddress: process.env.MAIL_FROM_ADDRESS || 'no-reply@bizzguest.example',
    isConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER)
  }
};
