#!/usr/bin/env node
const { execSync } = require('child_process');

// Ensure a valid fallback DATABASE_URL exists during build so Prisma validation never halts build
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/multivendor_ecommerce?schema=public";
}

try {
  execSync('npx prisma generate', {
    stdio: 'inherit',
    env: process.env
  });
} catch (error) {
  console.error('[Prisma Generate] Generation failed:', error);
  process.exit(1);
}
