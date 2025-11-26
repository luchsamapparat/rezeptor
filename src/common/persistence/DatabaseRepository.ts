// import { Prisma } from '@prisma/client';

import { ATTR_EXCEPTION_MESSAGE, ATTR_EXCEPTION_STACKTRACE, ATTR_EXCEPTION_TYPE } from '@opentelemetry/semantic-conventions/incubating';
import { Prisma } from '@prisma/client';
import type { Logger } from '../../application/server/logging';

export abstract class DatabaseRepository {
  constructor(
    private readonly log: Logger,
  ) { }

  protected handleMissingEntityError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (
        error.code === 'P2002'
        || error.code === 'P2025'
      ) {
        this.log.error({
          err: error,
          [ATTR_EXCEPTION_TYPE]: error.name,
          [ATTR_EXCEPTION_MESSAGE]: error.message,
          [ATTR_EXCEPTION_STACKTRACE]: error.stack,
        });

        return null;
      }
    }
    throw error;
  }
}