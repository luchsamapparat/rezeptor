import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client';

export type DatabaseClient = PrismaClient;

export function createDatabaseClient(connectionString: string): DatabaseClient {
  const adapter = new PrismaPg ({ connectionString });
  return new PrismaClient({ adapter });
}
