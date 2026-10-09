import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentCognitoSub = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest();
    return request.user.cognitoSub;
  },
);
