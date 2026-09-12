import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { CognitoAuthService } from './cognito-auth.service';

@Injectable()
export class CognitoAuthGuard implements CanActivate {
  constructor(private readonly cognitoAuthService: CognitoAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    const payload = await this.cognitoAuthService.verifyAccessToken(token);

    const cognitoSub = payload.sub;

    if (!cognitoSub) {
      throw new UnauthorizedException('Missing Cognito sub');
    }

    request['user'] = {
      cognitoSub,
    };

    return true;
  }
}
