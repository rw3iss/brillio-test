import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { API_KEY_HEADER, type ChatRequest, type ServerEvent } from '@brillio/shared';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { CommandDispatcher } from '../transport/command-dispatcher';
import type { EventSink } from '../transport/event-sink';

/** EventSink backed by an SSE (text/event-stream) response. */
class SseEventSink implements EventSink {
  private open = true;
  constructor(private readonly res: Response) {}
  get isOpen(): boolean {
    return this.open && !this.res.writableEnded;
  }
  send(event: ServerEvent): void {
    if (this.isOpen) this.res.write(`data: ${JSON.stringify(event)}\n\n`);
  }
  close(): void {
    if (this.open) {
      this.open = false;
      this.res.end();
    }
  }
}

/**
 * SSE transport for the main POST /chat operation. Streams tokens immediately
 * as an event stream, sharing the exact dispatcher/orchestrator used by WS.
 */
@Controller('chat')
export class ChatController {
  constructor(private readonly dispatcher: CommandDispatcher) {}

  @Post()
  @UseGuards(ApiKeyGuard)
  async chat(@Body() body: ChatRequest, @Req() req: Request, @Res() res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const requestId = uuid();
    const sink = new SseEventSink(res);
    const apiKey = req.header(API_KEY_HEADER) ?? (body as { apiKey?: string }).apiKey ?? '';

    req.on('close', () => {
      void this.dispatcher.dispatch(
        { id: requestId, type: 'cancel', apiKey, payload: { sessionId: body.sessionId ?? '' } },
        sink,
      );
    });

    await this.dispatcher.dispatch({ id: requestId, type: 'chat', apiKey, payload: body }, sink);
    sink.close();
  }
}
