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
exports.CognitoAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const jose_1 = require("jose");
let CognitoAuthService = class CognitoAuthService {
    config;
    region;
    userPoolId;
    issuer;
    jwks;
    cognito;
    constructor(config) {
        this.config = config;
        this.region = this.config.get('COGNITO_REGION') ?? 'us-east-1';
        this.userPoolId =
            this.config.get('COGNITO_USER_POOL_ID') ?? 'us-east-1_KeUrBrdKN';
        this.issuer = `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`;
        this.jwks = (0, jose_1.createRemoteJWKSet)(new URL(`${this.issuer}/.well-known/jwks.json`));
        this.cognito = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({ region: this.region });
    }
    async verifyAccessToken(token) {
        try {
            const { payload } = await (0, jose_1.jwtVerify)(token, this.jwks, {
                issuer: this.issuer,
                algorithms: ['RS256'],
            });
            if (payload['token_use'] !== 'access') {
                throw new common_1.UnauthorizedException('Invalid token type');
            }
            return payload;
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired access token');
        }
    }
    async verifyInvitationIdentity(idToken, accessTokenSub) {
        const clientId = this.config.get('COGNITO_CLIENT_ID');
        if (!clientId) {
            throw new common_1.InternalServerErrorException('Cognito client configuration is missing.');
        }
        let sub;
        let email;
        let cognitoUsername;
        try {
            const { payload } = await (0, jose_1.jwtVerify)(idToken, this.jwks, {
                issuer: this.issuer,
                audience: clientId,
                algorithms: ['RS256'],
            });
            if (payload['token_use'] !== 'id' ||
                !payload.sub ||
                payload.sub !== accessTokenSub ||
                payload['email_verified'] !== true ||
                typeof payload.email !== 'string' ||
                typeof payload['cognito:username'] !== 'string') {
                throw new common_1.UnauthorizedException('Invalid invitation identity');
            }
            sub = payload.sub;
            email = payload.email;
            cognitoUsername = payload['cognito:username'];
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid invitation identity');
        }
        const cognitoUser = await this.getVerifiedCognitoUser(cognitoUsername);
        if (cognitoUser.sub !== sub ||
            this.normalizeEmail(cognitoUser.email) !== this.normalizeEmail(email)) {
            throw new common_1.UnauthorizedException('Invalid invitation identity');
        }
        return { sub, email: this.normalizeEmail(cognitoUser.email) };
    }
    async getVerifiedCognitoUserBySub(sub) {
        let users;
        try {
            users = await this.cognito.send(new client_cognito_identity_provider_1.ListUsersCommand({
                UserPoolId: this.userPoolId,
                Filter: `sub = "${sub}"`,
                Limit: 2,
            }));
        }
        catch {
            throw new common_1.UnauthorizedException('Unable to verify Cognito identity');
        }
        const matches = users.Users ?? [];
        if (matches.length !== 1 || !matches[0].Username) {
            throw new common_1.UnauthorizedException('Invalid Cognito identity');
        }
        return this.getVerifiedCognitoUser(matches[0].Username);
    }
    async getVerifiedCognitoUser(username) {
        let cognitoUser;
        try {
            cognitoUser = await this.cognito.send(new client_cognito_identity_provider_1.AdminGetUserCommand({
                UserPoolId: this.userPoolId,
                Username: username,
            }));
        }
        catch {
            throw new common_1.UnauthorizedException('Unable to verify Cognito identity');
        }
        const attributes = new Map((cognitoUser.UserAttributes ?? []).map(({ Name, Value }) => [
            Name,
            Value,
        ]));
        const sub = attributes.get('sub');
        const email = attributes.get('email');
        if (cognitoUser.Enabled === false ||
            !sub ||
            attributes.get('email_verified') !== 'true' ||
            !email) {
            throw new common_1.UnauthorizedException('Invalid Cognito identity');
        }
        return { sub, email };
    }
    normalizeEmail(email) {
        return email.trim().toLowerCase();
    }
};
exports.CognitoAuthService = CognitoAuthService;
exports.CognitoAuthService = CognitoAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CognitoAuthService);
//# sourceMappingURL=cognito-auth.service.js.map