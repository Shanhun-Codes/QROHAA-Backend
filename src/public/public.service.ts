import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  findPublicAgentBySlug(slug: string) {
    return this.prisma.agent.findUnique({
      where: { slug },
      select: {
        slug: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        brokerageName: true,
        headline: true,
        logoUrl: true,
        headshotUrl: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });
  }

  findOpenHouseByPublicCode(publicCode: string) {
    return this.prisma.openHouse.findUnique({ where: { publicCode } });
  }

  async getConfigurationData(slug: string, publicCode: string) {
    const agentData = await this.prisma.agent.findUnique({
      where: { slug },
      select: {
        slug: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        brokerageName: true,
        headline: true,
        logoUrl: true,
        headshotUrl: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    const openHouseData = await this.prisma.openHouse.findUnique({
      where: { publicCode },
      select: {
        publicCode: true,
        startsAt: true,
        endsAt: true,
        property: {
          select: {
            street: true,
            street2: true,
            city: true,
            state: true,
            zip: true,
            listingPriceCents: true,
          },
        },
      },
    });
    return {
      agent: agentData,
      openHouse: openHouseData && {
        publicCode: openHouseData.publicCode,
        startsAt: openHouseData.startsAt,
        endsAt: openHouseData.endsAt,
      },
      property: openHouseData?.property ?? null,
    };
  }
}
