import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import type { JwtPayload } from '@supaforge/types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request['user'];
  },
);
