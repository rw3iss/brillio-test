import type { ErrorCode } from '@brillio/shared';

/**
 * Normalized SDK error. All transport/REST failures are funneled through this
 * shape so the UI toast channel handles one consistent type regardless of
 * origin (HTTP status, socket drop, or a server `error` event).
 */
export class BrillioError extends Error {
  readonly code: ErrorCode;
  readonly recoverable: boolean;
  readonly suggestion?: string;
  readonly requestId?: string;

  constructor(params: {
    code: ErrorCode;
    message: string;
    recoverable?: boolean;
    suggestion?: string;
    requestId?: string;
  }) {
    super(params.message);
    this.name = 'BrillioError';
    this.code = params.code;
    this.recoverable = params.recoverable ?? false;
    this.suggestion = params.suggestion;
    this.requestId = params.requestId;
  }
}

export function toBrillioError(err: unknown, fallbackCode: ErrorCode = 'internal'): BrillioError {
  if (err instanceof BrillioError) return err;
  if (err instanceof Error) {
    return new BrillioError({ code: fallbackCode, message: err.message, recoverable: false });
  }
  return new BrillioError({ code: fallbackCode, message: String(err), recoverable: false });
}
