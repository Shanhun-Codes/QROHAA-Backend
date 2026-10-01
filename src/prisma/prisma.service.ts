// src/prisma/prisma.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(configService: ConfigService) {
    const databaseHost = configService.getOrThrow<string>('DATABASE_HOST');

    const databaseName = configService.getOrThrow<string>('DATABASE_NAME');

    const databaseUser = configService.getOrThrow<string>('DATABASE_USER');

    const databasePassword = configService.get<string>('DATABASE_PASSWORD');

    const credentials = databasePassword
      ? `${encodeURIComponent(databaseUser)}:${encodeURIComponent(databasePassword)}`
      : encodeURIComponent(databaseUser);

    const databaseUrl = `postgresql://${credentials}@${databaseHost}:5432/${databaseName}?sslmode=require`;

    super({
      adapter: new PrismaPg({
        connectionString: databaseUrl,
      }),
    });
  }
}
