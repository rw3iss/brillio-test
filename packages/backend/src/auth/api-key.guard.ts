import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { API_KEY_HEADER } from '@brillio/shared';
import type { Request } from 'express';
import { ApiKeyService } from './api-key.service';

/** Guards REST routes by validating the x-api-key header (or ?apiKey= for SSE GETs). */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeys: ApiKeyService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const headerKey = req.header(API_KEY_HEADER);
    const queryKey = typeof req.query.apiKey === 'string' ? req.query.apiKey : undefined;
    const bodyKey =
      req.body && typeof (req.body as Record<string, unknown>).apiKey === 'string'
        ? ((req.body as Record<string, unknown>).apiKey as string)
        : undefined;
    const key = headerKey ?? queryKey ?? bodyKey;
    if (!this.apiKeys.isValid(key)) {
      throw new UnauthorizedException('Invalid or missing API key');
    }
    return true;
  }
}
