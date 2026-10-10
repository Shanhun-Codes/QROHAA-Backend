import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthUserService } from '../src/auth/auth-user.service';
import { CognitoAuthService } from '../src/auth/cognito-auth.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function bootstrapPlatformAdmins() {
  const configuredSubs = (process.env.PLATFORM_ADMIN_COGNITO_SUBS ?? '')
    .split(',')
    .map((sub) => sub.trim())
    .filter(Boolean);

  if (configuredSubs.length !== 2 || new Set(configuredSubs).size !== 2) {
    throw new Error(
      'PLATFORM_ADMIN_COGNITO_SUBS must contain exactly two distinct Cognito sub values.',
    );
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  try {
    const cognito = app.get(CognitoAuthService);
    const prisma = app.get(PrismaService);

    const owners = await Promise.all(
      configuredSubs.map((sub) => cognito.getVerifiedCognitoUserBySub(sub)),
    );
    if (
      new Set(owners.map((owner) => owner.sub)).size !== 2 ||
      new Set(owners.map((owner) => owner.email)).size !== 2
    ) {
      throw new Error(
        'The configured platform admins must be distinct Cognito users.',
      );
    }

    const configuredSet = new Set(configuredSubs);
    const existingAdmins = await prisma.user.findMany({
      where: { role: 'PLATFORM_ADMIN' },
      select: { cognitoSub: true },
    });
    if (existingAdmins.some((admin) => !configuredSet.has(admin.cognitoSub))) {
      throw new Error(
        'An unconfigured PLATFORM_ADMIN already exists; resolve it before bootstrap.',
      );
    }

    await prisma.$transaction(async (transaction) => {
      for (const owner of owners) {
        const previous = await transaction.user.findUnique({
          where: { cognitoSub: owner.sub },
          select: { id: true, email: true, role: true, status: true },
        });
        const user = await transaction.user.upsert({
          where: { cognitoSub: owner.sub },
          update: {
            email: owner.email,
            role: 'PLATFORM_ADMIN',
            status: 'ACTIVE',
          },
          create: {
            cognitoSub: owner.sub,
            email: owner.email,
            role: 'PLATFORM_ADMIN',
            status: 'ACTIVE',
          },
          select: { id: true },
        });

        if (
          !previous ||
          previous.email !== owner.email ||
          String(previous.role) !== 'PLATFORM_ADMIN' ||
          String(previous.status) !== 'ACTIVE'
        ) {
          await transaction.auditLog.create({
            data: {
              actorSub: 'system:trusted-bootstrap',
              action: 'PLATFORM_ADMIN_BOOTSTRAPPED',
              targetType: 'User',
              targetId: user.id,
              metadata: { configuredCognitoSub: owner.sub },
            },
          });
        }
      }
    });

    console.log(
      'Platform admin bootstrap completed for both configured owners.',
    );
  } finally {
    await app.close();
  }
}

bootstrapPlatformAdmins().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown bootstrap error.';
  console.error(`Platform admin bootstrap failed: ${message}`);
  process.exitCode = 1;
});
