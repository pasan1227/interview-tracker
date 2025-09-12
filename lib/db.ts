import { PrismaClient } from './generated/prisma';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

// Only cache in development to avoid issues in serverless
if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export const db = prisma;