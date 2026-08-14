import { Global, Module } from '@nestjs/common';
import { DbService } from './db.service';
import { SessionRepository } from './session.repository';
import { UsageRepository } from './usage.repository';

@Global()
@Module({
  providers: [DbService, SessionRepository, UsageRepository],
  exports: [DbService, SessionRepository, UsageRepository],
})
export class PersistenceModule {}
