import { PrismaClient, Prisma } from '@prisma/client';

let queryCount = 0;

const RETRYABLE_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017']);
const MAX_RETRIES = 3;

function makeClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? [{ emit: 'event', level: 'query' }]
      : []
  });

  if (process.env.NODE_ENV === 'development') {
    base.$on('query', (e) => {
      queryCount++;
      console.log(`[QUERY ${queryCount}] ${e.query.substring(0, 100)}...`);
    });
  }

  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
              return await query(args);
            } catch (err) {
              const isRetryable =
                err instanceof Prisma.PrismaClientInitializationError ||
                (err instanceof Prisma.PrismaClientKnownRequestError &&
                  RETRYABLE_CODES.has(err.code));

              if (isRetryable && attempt < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, attempt * 500));
                await base.$connect().catch(() => {});
                continue;
              }
              throw err;
            }
          }
        }
      }
    }
  });
}

type ExtendedPrismaClient = ReturnType<typeof makeClient>;
const globalForPrisma = globalThis as unknown as { prisma: ExtendedPrismaClient };

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const getQueryCount = () => queryCount;
export const resetQueryCount = () => { queryCount = 0; };
