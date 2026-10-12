import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { AgencyService } from './agency.service';
import { UpdateAgencySettingsDto } from './dto/update-agency-settings.dto';

@Injectable()
export class AgencySettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agencies: AgencyService,
    private readonly storage: StorageService,
  ) {}
  async get(sub: string, agencyId: string) {
    await this.agencies.authorize(sub, agencyId);
    const agency = await this.prisma.agency.findUniqueOrThrow({
      where: { id: agencyId },
      select: {
        id: true,
        name: true,
        headline: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        brokerage: {
          select: {
            name: true,
            licenseNumber: true,
            phone: true,
            email: true,
            websiteUrl: true,
            street: true,
            street2: true,
            city: true,
            state: true,
            zip: true,
          },
        },
      },
    });
    return {
      ...agency,
      logoUrl: agency.logoUrl
        ? /^https?:\/\//.test(agency.logoUrl)
          ? agency.logoUrl
          : await this.storage.createReadUrl(agency.logoUrl)
        : null,
    };
  }
  async update(sub: string, agencyId: string, dto: UpdateAgencySettingsDto) {
    await this.agencies.authorize(sub, agencyId);
    if (dto.name !== undefined && !dto.name?.trim())
      throw new BadRequestException('Agency name is required.');
    await this.prisma.$transaction(async (tx) => {
      const data: {
        name?: string;
        headline?: string | null;
        primaryColor?: string | null;
        secondaryColor?: string | null;
        accentColor?: string | null;
      } = {};
      if (dto.name !== undefined) data.name = dto.name.trim();
      if (dto.headline !== undefined)
        data.headline = dto.headline?.trim() || null;
      for (const key of [
        'primaryColor',
        'secondaryColor',
        'accentColor',
      ] as const) {
        if (dto[key] !== undefined)
          data[key] = dto[key]?.trim()
            ? `#${dto[key].replace(/^#/, '').toUpperCase()}`
            : null;
      }
      await tx.agency.update({ where: { id: agencyId }, data });
      if (dto.brokerage) {
        const existing = await tx.brokerage.findUnique({ where: { agencyId } });
        if (dto.brokerage.name !== undefined && !dto.brokerage.name?.trim())
          throw new BadRequestException('Brokerage name is required.');
        const name = dto.brokerage.name?.trim() ?? existing?.name;
        if (!name) throw new BadRequestException('Brokerage name is required.');
        const licenseNumber =
          dto.brokerage.licenseNumber !== undefined
            ? dto.brokerage.licenseNumber?.trim()
            : existing?.licenseNumber?.trim();
        if (!licenseNumber)
          throw new BadRequestException(
            'Brokerage license number is required.',
          );
        const brokerage: Record<string, string | null> = {
          name,
          licenseNumber,
        };
        for (const key of [
          'licenseNumber',
          'phone',
          'email',
          'websiteUrl',
        ] as const) {
          if (dto.brokerage[key] !== undefined)
            brokerage[key] = dto.brokerage[key]?.trim() || null;
        }
        for (const key of [
          'street',
          'street2',
          'city',
          'state',
          'zip',
        ] as const) {
          if (dto.brokerage.address?.[key] !== undefined)
            brokerage[key] = dto.brokerage.address[key]?.trim() || null;
        }
        await tx.brokerage.upsert({
          where: { agencyId },
          create: { agencyId, ...brokerage, name },
          update: brokerage,
        });
      }
      await tx.auditLog.create({
        data: {
          actorSub: sub,
          action: 'AGENCY_SETTINGS_UPDATED',
          targetType: 'Agency',
          targetId: agencyId,
        },
      });
    });
    // Agent profiles resolve agency-owned values when read, so no copying is needed.
    return this.get(sub, agencyId);
  }
  async uploadUrl(sub: string, agencyId: string, contentType: string) {
    await this.agencies.authorize(sub, agencyId);
    return this.storage.createAgencyLogoUploadUrl(agencyId, contentType);
  }
  async completeLogo(sub: string, agencyId: string, key: string) {
    await this.agencies.authorize(sub, agencyId);
    if (!this.storage.validateAgencyLogoKey(agencyId, key))
      throw new BadRequestException('Logo does not belong to this agency.');
    await this.storage.verifyImageUpload(key);
    await this.prisma.$transaction(async (tx) => {
      await tx.agency.update({
        where: { id: agencyId },
        data: { logoUrl: key },
      });
      await tx.auditLog.create({
        data: {
          actorSub: sub,
          action: 'AGENCY_LOGO_UPDATED',
          targetType: 'Agency',
          targetId: agencyId,
        },
      });
    });
    // Keep the previous object so already-generated document URLs remain valid.
    return this.get(sub, agencyId);
  }
}
