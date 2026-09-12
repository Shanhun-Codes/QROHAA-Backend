import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

@Injectable()
export class CognitoAuthService {
  private readonly region = 'us-east-1';
  private readonly userPoolId = 'us-east-1_KeUrBrdKN';

  private readonly issuer = `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`;

  private readonly jwks = createRemoteJWKSet(
    new URL(`${this.issuer}/.well-known/jwks.json`),
  );

  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
      });

      if (payload['token_use'] !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
