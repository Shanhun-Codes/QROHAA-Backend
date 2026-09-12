import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentAgentId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest();

    return request.user.agentId;
  },
);
