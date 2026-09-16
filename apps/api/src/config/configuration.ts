export interface AppConfig {
  nodeEnv: string;
  port: number;
  appName: string;
  apiPrefix: string;
  frontendUrl: string;
  apiUrl: string;
  database: {
    url: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    url: string;
  };
  s3: {
    endpoint: string;
    port: number;
    accessKey: string;
    secretKey: string;
    bucket: string;
    useSsl: boolean;
    region: string;
  };
  jwt: {
    accessSecret: string;
    accessExpiration: string;
    refreshSecret: string;
    refreshExpiration: string;
  };
  throttle: {
    ttl: number;
    limit: number;
  };
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  appName: process.env.APP_NAME || 'NEO Employee Management System',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:4000',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://ems_admin:ems_secure_password_123!@localhost:5432/ems_db?schema=public',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'localhost',
    port: parseInt(process.env.S3_PORT || '9000', 10),
    accessKey: process.env.S3_ACCESS_KEY || 'minio_admin',
    secretKey: process.env.S3_SECRET_KEY || 'minio_secure_password_123!',
    bucket: process.env.S3_BUCKET || 'ems-documents',
    useSsl: process.env.S3_USE_SSL === 'true',
    region: process.env.S3_REGION || 'us-east-1',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'ems_super_secret_access_jwt_key_development_only_change_in_prod_123!',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'ems_super_secret_refresh_jwt_key_development_only_change_in_prod_456!',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
});

