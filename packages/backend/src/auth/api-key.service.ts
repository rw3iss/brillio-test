import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/config.service';

/** Central validation for client-facing API keys (REST + WS/SSE commands). */
@Injectable()
export class ApiKeyService {
  constructor(private readonly config: AppConfigService) {}

  isValid(key: string | undefined | null): boolean {
    if (!key) return false;
    return this.config.apiKeys.includes(key);
  }
}
