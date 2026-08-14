import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import type { ExportFormat, Session, SessionSummary } from '@brillio/shared';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { SessionService } from './session.service';

@Controller('sessions')
@UseGuards(ApiKeyGuard)
export class SessionController {
  constructor(private readonly sessions: SessionService) {}

  @Get()
  listByUser(@Query('userId') userId: string): SessionSummary[] {
    return this.sessions.listByUser(userId ?? 'anonymous');
  }

  @Get(':id')
  getOne(@Param('id') id: string): Session {
    return this.sessions.getOrThrow(id);
  }

  @Get(':id/export')
  export(
    @Param('id') id: string,
    @Query('format') format: ExportFormat = 'json',
    @Res() res: Response,
  ): void {
    const out = this.sessions.export(id, format === 'csv' ? 'csv' : 'json');
    res.setHeader('Content-Type', out.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${out.filename}"`);
    res.send(out.body);
  }
}
