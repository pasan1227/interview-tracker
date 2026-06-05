import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';
import { env } from './env';

const prismaClientSingleton = () => {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
  });
  return new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export const db = prisma;
