import type { Prisma } from '@prisma/client';
import { isArray } from 'lodash-es';
import type { Logger } from '../../../../application/server/logging';
import type { DatabaseClient } from '../../../../common/persistence/database';
import { DatabaseRepository } from '../../../../common/persistence/DatabaseRepository';
import type { Cookbook, CookbookChanges, CookbookRepository, NewCookbook } from '../../cookbookManagement';

export class CookbookDatabaseRepository extends DatabaseRepository implements CookbookRepository {
  constructor(
    private readonly database: DatabaseClient,
    log: Logger,
  ) {
    super(log);
  }

  async getAll(): Promise<Cookbook[]> {
    return this.database.cookbook.findMany({
      include: { authors: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async findById(cookbookId: string): Promise<Cookbook | null> {
    return this.database.cookbook.findUnique({
      where: { id: cookbookId },
      include: { authors: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async insert(newCookbook: NewCookbook): Promise<Cookbook> {
    return this.database.cookbook.create({
      data: {
        ...newCookbook,
        authors: {
          createMany: {
            data: newCookbook.authors.map((author, index) => ({
              sortOrder: index,
              ...author,
            })),
          },
        },
      },
      include: { authors: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async insertMany(newCookbooks: NewCookbook[]): Promise<Cookbook[]> {
    // Prisma does not support creating multiple records and multiple related records
    // https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries#create-multiple-records-and-multiple-related-records
    return this.database.$transaction(async (tx: Prisma.TransactionClient) => {
      const cookbooks: Cookbook[] = [];

      for (const newCookbook of newCookbooks) {
        cookbooks.push(await tx.cookbook.create({
          data: {
            ...newCookbook,
            authors: {
              createMany: {
                data: newCookbook.authors.map((author, index) => ({
                  sortOrder: index,
                  ...author,
                })),
              },
            },
          },
          include: { authors: { orderBy: { sortOrder: 'asc' } } },
        }));
      }

      return cookbooks;
    });
  }

  async update(cookbookId: string, cookbookChanges: CookbookChanges): Promise<Cookbook | null> {
    try {
      return await this.database.cookbook.update({
        where: { id: cookbookId },
        data: {
          ...cookbookChanges,
          authors: isArray(cookbookChanges.authors)
            ? {
                deleteMany: {},
                createMany: {
                  data: cookbookChanges.authors.map((author, index) => ({
                    sortOrder: index,
                    ...author,
                  })),
                },
              }
            : undefined,
        },
        include: {
          authors: { orderBy: { sortOrder: 'asc' } },
        },
      });
    }
    catch (error: unknown) {
      return this.handleMissingEntityError(error);
    }
  }

  async delete(cookbookId: string): Promise<Cookbook | null> {
    try {
      return await this.database.cookbook.delete({
        where: { id: cookbookId },
        include: { authors: { orderBy: { sortOrder: 'asc' } } },
      });
    }
    catch (error: unknown) {
      return this.handleMissingEntityError(error);
    }
  }
}
