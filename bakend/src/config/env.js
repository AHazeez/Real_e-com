const dotenv = require('dotenv');

dotenv.config();

const requiredInProduction = [
  'API_BASE_URL',
  'UPLOADS_BASE_URL',
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'CORS_ORIGIN'
];

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  apiBaseUrl: process.env.API_BASE_URL || '',
  uploadsBaseUrl: process.env.UPLOADS_BASE_URL || '',
  db: {
    host: process.env.DB_HOST || '',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10)
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  },
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  uploadDir: process.env.UPLOAD_DIR || 'uploads/products',
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 5)
};

if (env.nodeEnv === 'production') {
  const missing = requiredInProduction.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }

  if (env.jwt.secret === 'development-secret-change-me' || env.jwt.secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }

  if (env.corsOrigin === '*') {
    throw new Error('CORS_ORIGIN cannot be "*" in production.');
  }
}

module.exports = env;
