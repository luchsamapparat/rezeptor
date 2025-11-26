import { generateMigrationSql } from './testDatabase';

export async function setup() {
  try {
    await generateMigrationSql();
  }
  catch (error) {
    console.error('❌ Failed to generate database schema:', error);
    throw error;
  }
}
