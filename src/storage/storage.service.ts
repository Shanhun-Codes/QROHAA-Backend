import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export type AgentAssetType = 'headshot' | 'logo';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.getOrThrow<string>('AWS_REGION'),
    });

    this.bucket = this.configService.getOrThrow<string>(
      'S3_AGENT_ASSETS_BUCKET',
    );
  }

  async createAgentUploadUrl(
    agentId: string,
    type: AgentAssetType,
    contentType: string,
  ) {
    const extension = this.getExtension(contentType);

    const key = `agents/${agentId}/${type}/` + `${randomUUID()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 300,
    });

    return {
      key,
      uploadUrl,
    };
  }

  async createAgencyLogoUploadUrl(agencyId: string, contentType: string) {
    const key = `agents/agencies/${agencyId}/logo/${randomUUID()}.${this.getExtension(contentType)}`;
    const uploadUrl = await getSignedUrl(
      this.s3,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 300 },
    );
    return { key, uploadUrl };
  }

  validateAgencyLogoKey(agencyId: string, key: string): boolean {
    const prefix = `agents/agencies/${agencyId}/logo/`;
    return (
      key.startsWith(prefix) &&
      /^[a-f0-9-]{36}\.(?:jpg|png|webp)$/.test(key.slice(prefix.length))
    );
  }

  async verifyImageUpload(key: string): Promise<void> {
    let object;
    try {
      object = await this.s3.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch {
      throw new BadRequestException(
        'Logo upload was not found. Please upload it again.',
      );
    }
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(
        object.ContentType ?? '',
      ) ||
      !object.ContentLength ||
      object.ContentLength > 5 * 1024 * 1024
    ) {
      throw new BadRequestException(
        'Use a JPEG, PNG, or WebP image up to 5 MB.',
      );
    }
  }

  async createReadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3, command, {
      expiresIn: 3600,
    });
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  private getExtension(contentType: string): string {
    switch (contentType) {
      case 'image/jpeg':
        return 'jpg';

      case 'image/png':
        return 'png';

      case 'image/webp':
        return 'webp';

      default:
        throw new Error(`Unsupported image type: ${contentType}`);
    }
  }

  validateAgentAssetKey(
    agentId: string,
    type: AgentAssetType,
    key: string,
  ): boolean {
    return key.startsWith(`agents/${agentId}/${type}/`);
  }
}
