const mockJwtVerify = jest.fn();
const mockCognitoSend = jest.fn();

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => ({})),
  jwtVerify: (...args: unknown[]) => mockJwtVerify(...args),
}));
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));
jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  AdminGetUserCommand: class AdminGetUserCommand {
    constructor(readonly input: unknown) {}
  },
  CognitoIdentityProviderClient: class CognitoIdentityProviderClient {
    send(command: unknown) {
      return mockCognitoSend(command);
    }
  },
}));

import { UnauthorizedException } from '@nestjs/common';
import { CognitoAuthService } from './cognito-auth.service';

function createService() {
  return new CognitoAuthService({
    get: (key: string) =>
      ({
        COGNITO_REGION: 'us-east-1',
        COGNITO_USER_POOL_ID: 'us-east-1_pool',
        COGNITO_CLIENT_ID: 'portal-client',
      })[key],
  } as never);
}

describe('CognitoAuthService invitation identity', () => {
  beforeEach(() => {
    mockJwtVerify.mockReset();
    mockCognitoSend.mockReset();
  });

  it('verifies the ID token and confirms verified email with AdminGetUser', async () => {
    mockJwtVerify.mockResolvedValue({
      payload: {
        token_use: 'id',
        sub: 'cognito-sub',
        email: 'Person@Example.com',
        email_verified: true,
        'cognito:username': 'cognito-username',
      },
    });
    mockCognitoSend.mockResolvedValue({
      Enabled: true,
      UserAttributes: [
        { Name: 'sub', Value: 'cognito-sub' },
        { Name: 'email', Value: 'person@example.com' },
        { Name: 'email_verified', Value: 'true' },
      ],
    });

    await expect(
      createService().verifyInvitationIdentity('id-token', 'cognito-sub'),
    ).resolves.toEqual({ sub: 'cognito-sub', email: 'person@example.com' });
    expect(mockJwtVerify).toHaveBeenCalledWith(
      'id-token',
      expect.anything(),
      expect.objectContaining({
        issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_pool',
        audience: 'portal-client',
        algorithms: ['RS256'],
      }),
    );
    expect(mockCognitoSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          UserPoolId: 'us-east-1_pool',
          Username: 'cognito-username',
        },
      }),
    );
  });

  it('rejects an ID token whose subject differs from the access token', async () => {
    mockJwtVerify.mockResolvedValue({
      payload: {
        token_use: 'id',
        sub: 'different-sub',
        email: 'person@example.com',
        email_verified: true,
        'cognito:username': 'cognito-username',
      },
    });

    await expect(
      createService().verifyInvitationIdentity('id-token', 'access-sub'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(mockCognitoSend).not.toHaveBeenCalled();
  });

  it('rejects an unverified Cognito email from AdminGetUser', async () => {
    mockJwtVerify.mockResolvedValue({
      payload: {
        token_use: 'id',
        sub: 'cognito-sub',
        email: 'person@example.com',
        email_verified: true,
        'cognito:username': 'cognito-username',
      },
    });
    mockCognitoSend.mockResolvedValue({
      Enabled: true,
      UserAttributes: [
        { Name: 'sub', Value: 'cognito-sub' },
        { Name: 'email', Value: 'person@example.com' },
        { Name: 'email_verified', Value: 'false' },
      ],
    });

    await expect(
      createService().verifyInvitationIdentity('id-token', 'cognito-sub'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects invalid or expired ID tokens', async () => {
    mockJwtVerify.mockRejectedValue(new Error('invalid token'));

    await expect(
      createService().verifyInvitationIdentity('bad-token', 'cognito-sub'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(mockCognitoSend).not.toHaveBeenCalled();
  });
});
