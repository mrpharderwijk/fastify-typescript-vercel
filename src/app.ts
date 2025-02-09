import fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './routes/v1/auth';
import { addressRoutes } from './routes/v1/lookup/address';
import { postalCodeRoutes } from './routes/v1/lookup/postal-code';
import { domainRoutes } from './routes/v1/auth/domains';
import { RATE_LIMITS_PER_SECOND } from './constants/config';
import { prisma } from './utils/db';

export const createApp = async (): Promise<FastifyInstance> => {
  const app = fastify({
    logger: true,
  });

  // Add Prisma to Fastify instance
  app.decorate('prisma', prisma);

  // Register plugins
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) {
        // Allow requests with no origin (like mobile apps or curl requests)
        cb(null, true);
        return;
      }

      try {
        const domain = new URL(origin).hostname;
        // Since we can't access request headers in the CORS callback,
        // we'll do the domain validation in the route handlers
        cb(null, true);
      } catch (err) {
        cb(new Error('Invalid origin'), false);
      }
    },
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key',
  });

  // Register rate limit plugin with dynamic limits based on subscription
  await app.register(rateLimit, {
    global: false, // Disable global rate limiting
    max: 1, // Default max (will be overridden)
    timeWindow: 1000, // 1 second
    keyGenerator: (req) => {
      return req.headers['x-api-key'] as string || '';
    },
    hook: 'preHandler',
    enableDraftSpec: true, // Enable draft spec headers
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true
    }
  });

  // Root route
  app.get('/', async () => {
    return {
      status: 'ok',
      message: 'Fastify API is running',
      version: '1.0.0',
      endpoints: {
        auth: {
          register: '/api/v1/auth/register',
          login: '/api/v1/auth/login',
          domains: '/api/v1/auth/domains'
        },
        lookup: {
          address: '/api/v1/lookup/address',
          postalCode: '/api/v1/lookup/postal-code'
        }
      }
    };
  });

  // Configure rate limits for protected routes
  const setRateLimits = (routeOptions: any) => ({
    ...routeOptions,
    config: {
      ...routeOptions.config,
      rateLimit: {
        max: async (req: FastifyRequest, key: string) => {
          if (!key) return 0;
          const user = await app.prisma.user.findUnique({
            where: { apiKey: key },
          });
          if (!user) return 0;
          
          return RATE_LIMITS_PER_SECOND[user.subscriptionPlan] || 0;
        },
        timeWindow: 1000, // 1 second window
        errorResponseBuilder: (req: FastifyRequest, context: { max: number; remaining: number; reset: number }) => ({
          statusCode: 429,
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Your plan (${(req.user as any)?.subscriptionPlan || 'UNKNOWN'}) allows ${context.max} requests per second.`,
          limit: context.max,
          remaining: context.remaining,
          reset: context.reset
        })
      },
    },
  });

  // Register routes with rate limiting
  app.register(authRoutes, { prefix: '/api/v1/auth' });
  app.register(domainRoutes, { prefix: '/api/v1/auth/domains' });
  app.register(addressRoutes, { prefix: '/api/v1/lookup/address', routeConfig: setRateLimits });
  app.register(postalCodeRoutes, { prefix: '/api/v1/lookup/postal-code', routeConfig: setRateLimits });

  return app;
}; 