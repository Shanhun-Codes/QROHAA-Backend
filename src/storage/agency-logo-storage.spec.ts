const send = jest.fn();
jest.mock('@nestjs/config', () => ({ ConfigService: class {} }));
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send })),
  HeadObjectCommand: jest.fn().mockImplementation((input) => input),
  PutObjectCommand: jest.fn().mockImplementation((input) => input),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('signed-upload'),
}));
import { StorageService } from './storage.service';
const config = {
  getOrThrow: (key: string) =>
    key === 'AWS_REGION' ? 'us-east-1' : 'test-bucket',
};
describe('Agency logo storage', () => {
  beforeEach(() => send.mockReset());
  it('creates a distinct agency logo key and rejects path traversal and foreign keys', async () => {
    const service = new StorageService(config as never);
    const result = await service.createAgencyLogoUploadUrl(
      'agency-a',
      'image/png',
    );
    expect(result.key).toMatch(
      /^agents\/agencies\/agency-a\/logo\/[a-f0-9-]{36}\.png$/,
    );
    expect(service.validateAgencyLogoKey('agency-a', result.key)).toBe(true);
    expect(service.validateAgencyLogoKey('agency-b', result.key)).toBe(false);
    expect(
      service.validateAgencyLogoKey(
        'agency-a',
        'agents/agencies/agency-a/logo/../foreign.png',
      ),
    ).toBe(false);
  });
  it('rejects oversized or non-image objects', async () => {
    const service = new StorageService(config as never);
    send.mockResolvedValue({
      ContentType: 'image/png',
      ContentLength: 6 * 1024 * 1024,
    });
    await expect(service.verifyImageUpload('key')).rejects.toThrow('5 MB');
    send.mockResolvedValue({ ContentType: 'text/html', ContentLength: 100 });
    await expect(service.verifyImageUpload('key')).rejects.toThrow('JPEG');
  });
  it('accepts a stored image within the size limit', async () => {
    send.mockResolvedValue({ ContentType: 'image/webp', ContentLength: 1024 });
    await expect(
      new StorageService(config as never).verifyImageUpload('key'),
    ).resolves.toBeUndefined();
  });
});
