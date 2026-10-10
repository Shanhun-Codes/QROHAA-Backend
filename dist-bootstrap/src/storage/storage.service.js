"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto_1 = require("crypto");
let StorageService = class StorageService {
    configService;
    s3;
    bucket;
    constructor(configService) {
        this.configService = configService;
        this.s3 = new client_s3_1.S3Client({
            region: this.configService.getOrThrow('AWS_REGION'),
        });
        this.bucket = this.configService.getOrThrow('S3_AGENT_ASSETS_BUCKET');
    }
    async createAgentUploadUrl(agentId, type, contentType) {
        const extension = this.getExtension(contentType);
        const key = `agents/${agentId}/${type}/` + `${(0, crypto_1.randomUUID)()}.${extension}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
        });
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3, command, {
            expiresIn: 300,
        });
        return {
            key,
            uploadUrl,
        };
    }
    async createReadUrl(key) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        return (0, s3_request_presigner_1.getSignedUrl)(this.s3, command, {
            expiresIn: 3600,
        });
    }
    async delete(key) {
        await this.s3.send(new client_s3_1.DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        }));
    }
    getExtension(contentType) {
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
    validateAgentAssetKey(agentId, type, key) {
        return key.startsWith(`agents/${agentId}/${type}/`);
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map