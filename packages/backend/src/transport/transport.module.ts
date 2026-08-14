import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { WsGateway } from './ws.gateway';

/** Owns the WebSocket transport; the SSE transport lives in ChatController. */
@Module({
  imports: [ChatModule],
  providers: [WsGateway],
  exports: [WsGateway],
})
export class TransportModule {}
