jest.mock('src/prisma/prisma.service', () => ({ PrismaService: class PrismaService {} }));
jest.mock('@nestjs/mapped-types', () => ({ PartialType: (classRef: unknown) => classRef }));

import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';

describe('Property resource', () => {
  const prisma = { property: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() } } as any;
  const service = new PropertyService(prisma);
  const controller = new PropertyController(service);

  beforeEach(() => jest.clearAllMocks());

  it('creates a property with the supplied address and listing price', async () => {
    const dto = { street: '310 N Jefferson', street2: 'Apt 126', city: 'Springfield', state: 'MO', zip: '65806', listingPriceCents: 35000000 };
    prisma.property.create.mockResolvedValue(dto);
    await expect(service.create(dto)).resolves.toEqual(dto);
    expect(prisma.property.create).toHaveBeenCalledWith({ data: dto });
  });

  it('lists newest properties first and looks up properties by string ID', () => {
    service.findAll();
    service.findPropertyById('property-1');
    expect(prisma.property.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
    expect(prisma.property.findUnique).toHaveBeenCalledWith({ where: { id: 'property-1' } });
  });

  it('forwards controller requests to the property service', () => {
    const create = jest.spyOn(service, 'create');
    controller.create({} as any);
    expect(create).toHaveBeenCalled();
    expect(controller.update('7', {} as any)).toBe('This action updates a #7 property');
    expect(controller.remove('7')).toBe('This action removes a #7 property');
  });
});