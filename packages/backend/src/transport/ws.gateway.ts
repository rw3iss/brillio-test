import { Injectable, Logger } from '@nestjs/common';
import { WebSocketServer, WebSocket, type RawData } from 'ws';
import type { Server } from 'node:http';
import { WS_PATH, type ClientCommand, type ServerEvent } from '@brillio/shared';
import { CommandDispatcher } from './command-dispatcher';
import type { EventSink } from './event-sink';

/** EventSink backed by a native WebSocket frame writer. */
class WsEventSink implements EventSink {
  constructor(private readonly socket: WebSocket) {}
  get isOpen(): boolean {
    return this.socket.readyState === WebSocket.OPEN;
  }
  send(event: ServerEvent): void {
    if (this.isOpen) this.socket.send(JSON.stringify(event));
  }
  close(): void {
    if (this.isOpen) this.socket.close();
  }
}

/**
 * Native WebSocket transport. Attaches to the existing HTTP server on WS_PATH
 * and forwards each frame (a ClientCommand) to the shared CommandDispatcher.
 * Streaming happens off the event loop per-message, so the server is never held.
 */
@Injectable()
export class WsGateway {
  private readonly logger = new Logger(WsGateway.name);
  private wss?: WebSocketServer;

  constructor(private readonly dispatcher: CommandDispatcher) {}

  bind(server: Server): void {
    this.wss = new WebSocketServer({ server, path: WS_PATH });
    this.wss.on('connection', (socket) => this.onConnection(socket));
    this.logger.log(`WebSocket gateway listening on ${WS_PATH}`);
  }

  private onConnection(socket: WebSocket): void {
    const sink = new WsEventSink(socket);
    socket.on('message', (raw: RawData) => {
      let command: ClientCommand;
      try {
        command = JSON.parse(raw.toString()) as ClientCommand;
      } catch {
        sink.send({
          type: 'error',
          requestId: 'unknown',
          code: 'bad_request',
          message: 'Malformed command JSON',
          recoverable: false,
        });
        return;
      }
      // Fire-and-forget: each command streams independently without blocking others.
      void this.dispatcher.dispatch(command, sink).catch((err) => {
        this.logger.error(`Dispatch error: ${(err as Error).message}`);
      });
    });
    socket.on('error', (err) => this.logger.warn(`Socket error: ${err.message}`));
  }
}
