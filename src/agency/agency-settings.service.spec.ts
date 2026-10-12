import { ForbiddenException } from '@nestjs/common';
jest.mock('src/prisma/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('src/storage/storage.service', () => ({ StorageService: class {} }));
jest.mock('./agency.service', () => ({ AgencyService: class {} }));
import { AgencySettingsService } from './agency-settings.service';
function setup() {
  const agency = {
    id: 'agency-a',
    name: 'Agency A',
    headline: null,
    logoUrl: 'agencies/agency-a/logo/old.png',
    primaryColor: '#123456',
    secondaryColor: null,
    accentColor: null,
    brokerage: null,
  };
  const tx = {
    agency: {
      update: jest.fn(async ({ data }) => Object.assign(agency, data)),
    },
    brokerage: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn(),
    },
    auditLog: { create: jest.fn() },
  };
  const prisma = {
    agency: { findUniqueOrThrow: jest.fn().mockResolvedValue(agency) },
    $transaction: jest.fn((fn) => fn(tx)),
  };
  const access = { authorize: jest.fn().mockResolvedValue(agency) };
  const storage = {
    createReadUrl: jest.fn(async (key) => `signed:${key}`),
    createAgencyLogoUploadUrl: jest
      .fn()
      .mockResolvedValue({ key: 'agency-key', uploadUrl: 'signed-upload' }),
    validateAgencyLogoKey: jest.fn().mockReturnValue(true),
    verifyImageUpload: jest.fn(),
  };
  return {
    service: new AgencySettingsService(
      prisma as never,
      access as never,
      storage as never,
    ),
    tx,
    prisma,
    access,
    storage,
  };
}
describe('Agency settings ownership and persistence', () => {
  it('denies foreign-agency access before reading or updating settings', async () => {
    const { service, access, prisma } = setup();
    access.authorize.mockRejectedValue(new ForbiddenException());
    await expect(
      service.update('foreign-sub', 'agency-a', { primaryColor: '#ffffff' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.agency.findUniqueOrThrow).not.toHaveBeenCalled();
  });
  it('saves agency colors without changing member records or accepting privileged fields', async () => {
    const { service, tx } = setup();
    const result = await service.update('admin', 'agency-a', {
      name: ' Updated Agency ',
      primaryColor: 'abcdef',
      secondaryColor: '',
      seatLimit: 100,
      logoUrl: 'foreign-key',
    } as never);
    expect(tx.agency.update).toHaveBeenCalledWith({
      where: { id: 'agency-a' },
      data: {
        name: 'Updated Agency',
        primaryColor: '#ABCDEF',
        secondaryColor: null,
      },
    });
    expect(result).toMatchObject({
      name: 'Updated Agency',
      primaryColor: '#ABCDEF',
      logoUrl: 'signed:agencies/agency-a/logo/old.png',
    });
    expect(tx.auditLog.create).toHaveBeenCalled();
  });
  it('creates agency-owned brokerage and permits clearing optional details', async () => {
    const { service, tx } = setup();
    await service.update('admin', 'agency-a', {
      brokerage: {
        name: ' Agency Brokerage ',
        licenseNumber: 'BR-123',
        phone: null,
        address: { city: ' Austin ', street2: null },
      },
    } as never);
    expect(tx.brokerage.upsert).toHaveBeenCalledWith({
      where: { agencyId: 'agency-a' },
      create: {
        agencyId: 'agency-a',
        name: 'Agency Brokerage',
        licenseNumber: 'BR-123',
        phone: null,
        city: 'Austin',
        street2: null,
      },
      update: {
        name: 'Agency Brokerage',
        licenseNumber: 'BR-123',
        phone: null,
        city: 'Austin',
        street2: null,
      },
    });
  });
  it('requires a brokerage name before creating its record', async () => {
    const { service, tx } = setup();
    await expect(
      service.update('admin', 'agency-a', {
        brokerage: { phone: '5555550100' },
      }),
    ).rejects.toThrow('Brokerage name');
    expect(tx.brokerage.upsert).not.toHaveBeenCalled();
  });
  it('cannot attach an image owned by another agency', async () => {
    const { service, storage, prisma } = setup();
    storage.validateAgencyLogoKey.mockReturnValue(false);
    await expect(
      service.completeLogo(
        'admin',
        'agency-a',
        'agencies/agency-b/logo/image.png',
      ),
    ).rejects.toThrow('does not belong');
    expect(storage.verifyImageUpload).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('verifies a completed upload before persisting its logo key', async () => {
    const { service, storage, tx } = setup();
    const result = await service.completeLogo(
      'admin',
      'agency-a',
      'agencies/agency-a/logo/new.png',
    );
    expect(storage.verifyImageUpload).toHaveBeenCalledWith(
      'agencies/agency-a/logo/new.png',
    );
    expect(tx.agency.update).toHaveBeenCalledWith({
      where: { id: 'agency-a' },
      data: { logoUrl: 'agencies/agency-a/logo/new.png' },
    });
    expect(result.logoUrl).toBe('signed:agencies/agency-a/logo/new.png');
  });
  it('requires a license number and rejects clearing an existing one', async () => {
    const { service, tx } = setup();
    await expect(
      service.update('admin', 'agency-a', { brokerage: { name: 'Brokerage' } }),
    ).rejects.toThrow('license number');
    tx.brokerage.findUnique.mockResolvedValue({
      name: 'Brokerage',
      licenseNumber: 'BR-123',
    });
    await expect(
      service.update('admin', 'agency-a', {
        brokerage: { licenseNumber: null },
      } as never),
    ).rejects.toThrow('license number');
    expect(tx.brokerage.upsert).not.toHaveBeenCalled();
  });
});
