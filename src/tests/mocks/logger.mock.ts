import type { Logger } from '../../application/server/logging';

/**
 * Silent logger for testing that implements the Logger interface
 * but doesn't actually output anything.
 */
export const loggerMock: Logger = {
  level: 'silent',
  trace: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  silent: () => {},
  child: () => loggerMock,
  bindings: () => ({}),
  flush: () => {},
  isLevelEnabled: () => false,
  on: () => loggerMock,
  onChild: () => loggerMock,
} as unknown as Logger;
