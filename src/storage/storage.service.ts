import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
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
