// src/prisma/prisma.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { readFileSync } from 'fs';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(@Inject(ConfigService) configService: ConfigService) {
    const nodeEnv = configService.getOrThrow<string>('NODE_ENV');

    const databaseHost = configService.getOrThrow<string>('DATABASE_HOST');

    const databaseName = configService.getOrThrow<string>('DATABASE_NAME');

    const databaseUser = configService.getOrThrow<string>('DATABASE_USER');

    const databasePassword =
      configService.getOrThrow<string>('DATABASE_PASSWORD');

    const databaseUrl =
      `postgresql://${encodeURIComponent(databaseUser)}` +
      `:${encodeURIComponent(databasePassword)}` +
      `@${databaseHost}:5432/${databaseName}`;

    const adapter = new PrismaPg({
      connectionString: databaseUrl,

      ...(nodeEnv === 'qa' || nodeEnv === 'prod'
        ? {
            ssl: {
              ca: readFileSync('./certs/rds-ca-bundle.pem', 'utf8'),
              rejectUnauthorized: true,
            },
          }
        : {}),
    });

    super({ adapter });
  }
}
