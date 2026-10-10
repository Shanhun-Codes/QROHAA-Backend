import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

@Injectable()
export class CognitoAuthService {
  private readonly region: string;
  private readonly userPoolId: string;
  private readonly issuer: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly cognito: CognitoIdentityProviderClient;

  constructor(private readonly config: ConfigService) {
    this.region = this.config.get<string>('COGNITO_REGION') ?? 'us-east-1';
    this.userPoolId =
      this.config.get<string>('COGNITO_USER_POOL_ID') ?? 'us-east-1_KeUrBrdKN';
    this.issuer = `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`;
    this.jwks = createRemoteJWKSet(
      new URL(`${this.issuer}/.well-known/jwks.json`),
    );
    this.cognito = new CognitoIdentityProviderClient({ region: this.region });
  }

  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        algorithms: ['RS256'],
      });

      if (payload['token_use'] !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  async verifyInvitationIdentity(
    idToken: string,
    accessTokenSub: string,
  ): Promise<{ sub: string; email: string }> {
    const clientId = this.config.get<string>('COGNITO_CLIENT_ID');
    if (!clientId) {
      throw new InternalServerErrorException(
        'Cognito client configuration is missing.',
      );
    }

    let sub: string;
    let email: string;
    let cognitoUsername: string;
    try {
      const { payload } = await jwtVerify(idToken, this.jwks, {
        issuer: this.issuer,
        audience: clientId,
        algorithms: ['RS256'],
      });

      if (
        payload['token_use'] !== 'id' ||
        !payload.sub ||
        payload.sub !== accessTokenSub ||
        payload['email_verified'] !== true ||
        typeof payload.email !== 'string' ||
        typeof payload['cognito:username'] !== 'string'
      ) {
        throw new UnauthorizedException('Invalid invitation identity');
      }

      sub = payload.sub;
      email = payload.email;
      cognitoUsername = payload['cognito:username'];
    } catch {
      throw new UnauthorizedException('Invalid invitation identity');
    }

    const cognitoUser = await this.getVerifiedCognitoUser(cognitoUsername);
    if (
      cognitoUser.sub !== sub ||
      this.normalizeEmail(cognitoUser.email) !== this.normalizeEmail(email)
    ) {
      throw new UnauthorizedException('Invalid invitation identity');
    }

    return { sub, email: this.normalizeEmail(cognitoUser.email) };
  }

  async getVerifiedCognitoUserBySub(
    sub: string,
  ): Promise<{ sub: string; email: string }> {
    let users;
    try {
      users = await this.cognito.send(
        new ListUsersCommand({
          UserPoolId: this.userPoolId,
          Filter: `sub = "${sub}"`,
          Limit: 2,
        }),
      );
    } catch {
      throw new UnauthorizedException('Unable to verify Cognito identity');
    }

    const matches = users.Users ?? [];
    if (matches.length !== 1 || !matches[0].Username) {
      throw new UnauthorizedException('Invalid Cognito identity');
    }

    return this.getVerifiedCognitoUser(matches[0].Username);
  }

  private async getVerifiedCognitoUser(
    username: string,
  ): Promise<{ sub: string; email: string }> {
    let cognitoUser;
    try {
      cognitoUser = await this.cognito.send(
        new AdminGetUserCommand({
          UserPoolId: this.userPoolId,
          Username: username,
        }),
      );
    } catch {
      throw new UnauthorizedException('Unable to verify Cognito identity');
    }

    const attributes = new Map<string, string | undefined>(
      (cognitoUser.UserAttributes ?? []).map(({ Name, Value }) => [
        Name,
        Value,
      ]),
    );
    const sub = attributes.get('sub');
    const email = attributes.get('email');
    if (
      cognitoUser.Enabled === false ||
      !sub ||
      attributes.get('email_verified') !== 'true' ||
      !email
    ) {
      throw new UnauthorizedException('Invalid Cognito identity');
    }

    return { sub, email };
  }

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
