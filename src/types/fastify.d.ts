import { User, PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
  }

  interface FastifyInstance {
    prisma: PrismaClient;
  }
} 