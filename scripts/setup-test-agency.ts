import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { CognitoAuthService } from '../src/auth/cognito-auth.service';

async function main() {
  if (
    process.env.NODE_ENV !== 'local' ||
    !['localhost', '127.0.0.1'].includes(process.env.DATABASE_HOST ?? '')
  ) {
    throw new Error(
      'This fixture may only run against the localhost database with NODE_ENV=local.',
    );
  }
  const email = (
    process.argv.find((arg) => arg.startsWith('--email='))?.slice(8) ??
    'michael.elder@kw.com'
  ).toLowerCase();
  const seats = Number(
    process.argv.find((arg) => arg.startsWith('--seats='))?.slice(8) ?? 3,
  );
  if (!Number.isInteger(seats) || seats < 1 || seats > 100)
    throw new Error('Use --seats=1 through --seats=100.');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });
  try {
    const prisma = app.get(PrismaService);
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: { agency: true },
    });
    if (!user || user.role !== 'PLATFORM_ADMIN' || user.status !== 'ACTIVE')
      throw new Error(
        'The fixture owner must be an existing active platform administrator.',
      );
    const identity = await app
      .get(CognitoAuthService)
      .getVerifiedCognitoUserBySub(user.cognitoSub);
    if (identity.email.toLowerCase() !== email)
      throw new Error(
        'Verified Cognito identity does not match the intended owner.',
      );
    const name = 'Local Test Agency';
    if (user.agency && user.agency.name !== name)
      throw new Error(
        'This account already belongs to another agency. No changes made.',
      );
    const agency = await prisma.$transaction(async (tx) => {
      const target = user.agency
        ? await tx.agency.update({
            where: { id: user.agency.id },
            data: { updatedAt: new Date() },
          })
        : await tx.agency.create({
            data: {
              name,
              seatLimit: seats,
              primaryColor: '#144552',
              secondaryColor: '#ffffff',
              accentColor: '#c65d3b',
              brokerage: {
                create: {
                  name: 'Local Test Brokerage',
                  licenseNumber: 'TEST-ONLY',
                  city: 'Test City',
                  state: 'TX',
                },
              },
            },
          });
      const used = await tx.agent.count({ where: { agencyId: target.id } });
      const reserved = await tx.invitation.count({
        where: {
          agencyId: target.id,
          redeemedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      });
      if (used + reserved > seats)
        throw new Error(
          'Cannot lower the limit below occupied and reserved seats.',
        );
      await tx.agency.update({
        where: { id: target.id },
        data: { seatLimit: seats },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { agencyId: target.id },
      });
      // The local test agency is immediately usable by agents accepting its invitations.
      const existing = await tx.accessEntitlement.findFirst({
        where: {
          agencyId: target.id,
          status: 'ACTIVE',
          revokedAt: null,
          expiresAt: null,
        },
      });
      if (!existing)
        await tx.accessEntitlement.create({
          data: {
            agencyId: target.id,
            type: 'BETA',
            status: 'ACTIVE',
            startsAt: new Date(),
            grantedBySub: user.cognitoSub,
          },
        });
      await tx.auditLog.create({
        data: {
          actorSub: user.cognitoSub,
          action: 'LOCAL_TEST_AGENCY_CONFIGURED',
          targetType: 'Agency',
          targetId: target.id,
          metadata: { seats },
        },
      });
      return {
        id: target.id,
        name,
        seatLimit: seats,
        occupied: used,
        reserved,
      };
    });
    console.log(JSON.stringify({ owner: email, ...agency }, null, 2));
  } finally {
    await app.close();
  }
}
main().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
