import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PROJECT_KEY_ROLES } from '@supaforge/constants';
import { Request } from 'express';

export interface ProjectKeyPayload {
  projectId: string;
  role: typeof PROJECT_KEY_ROLES.ANON | typeof PROJECT_KEY_ROLES.SERVICE_ROLE;
}

@Injectable()
export class ProjectKeyGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const request = ctx.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing API key');
    }
    const token = authHeader.slice(7);

    try {
      const payload = this.jwtService.verify<ProjectKeyPayload>(token, {
        secret: this.configService.get('PROJECT_JWT_SECRET'),
      });

      request['projectKey'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid API key');
    }
  }
}
