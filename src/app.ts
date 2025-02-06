import fastify, { FastifyInstance } from 'fastify';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import { authRoutes } from './routes/v1/auth';
import { addressRoutes } from './routes/v1/address';
import { postalCodeRoutes } from './routes/v1/postal-code';

export const createApp = async (): Promise<FastifyInstance> => {
  const app = fastify({
    logger: true,
  });

  // Register plugins
  await app.register(cors, {
    origin: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key',
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
          login: '/api/v1/auth/login'
        },
        lookup: {
          address: '/api/v1/address/lookup',
          postalCode: '/api/v1/postal-code/lookup'
        }
      }
    };
  });

  // Register routes
  app.register(authRoutes, { prefix: '/api/v1/auth' });
  app.register(addressRoutes, { prefix: '/api/v1/address' });
  app.register(postalCodeRoutes, { prefix: '/api/v1/postal-code' });

  return app;
}; 