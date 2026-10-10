// prisma7.config.ts

import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const databaseUrl = process.env['DATABASE_URL'] ?? buildDatabaseUrl();

function buildDatabaseUrl(): string | undefined {
  const host = process.env['DATABASE_HOST'];
  const name = process.env['DATABASE_NAME'];
  const user = process.env['DATABASE_USER'];
  const password = process.env['DATABASE_PASSWORD'];

  if (!host || !name || !user) {
    return undefined;
  }

  const credentials = password
    ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
    : encodeURIComponent(user);

  return `postgresql://${credentials}@${host}:5432/${name}`;
}

export default defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },

  datasource: {
    url: databaseUrl,
  },
});
