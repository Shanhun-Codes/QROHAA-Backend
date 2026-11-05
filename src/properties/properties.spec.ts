import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));
jest.mock('@nestjs/mapped-types', () => ({
  PartialType: (classRef: unknown) => classRef,
}));

import { PropertiesService } from './properties.service';

describe('Property resource', () => {
  const prisma = {
    property: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
  } as any;
  const service = new PropertiesService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a property with the supplied address and listing price', async () => {
    const dto = {
      street: '310 N Jefferson',
      street2: 'Apt 126',
      city: 'Springfield',
      state: 'MO',
      zip: '65806',
      listingPriceCents: 35000000,
    };
    prisma.property.create.mockResolvedValue(dto);
    await expect(service.create('agent-1', dto)).resolves.toEqual(dto);
    expect(prisma.property.create).toHaveBeenCalledWith({
      data: { ...dto, agent: { connect: { id: 'agent-1' } } },
    });
  });

  it('lists newest properties first and looks up properties by string ID', () => {
    service.findAll();
    service.findPropertyById('property-1');
    expect(prisma.property.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
    expect(prisma.property.findUnique).toHaveBeenCalledWith({
      where: { id: 'property-1' },
    });
  });
});
