import { FastifyRequest, FastifyReply } from 'fastify';
import { CALL_LIMITS_PER_MONTH } from '../constants/config';
import { prisma } from '../utils/db';
import { validateDomain } from '@/middleware/validateDomain';

export async function validateApiKey(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = request.headers['x-api-key'];

  if (!apiKey || typeof apiKey !== 'string') {
    return reply.status(401).send({ error: 'API key is required' });
  }

  const user = await prisma.user.findUnique({
    where: { apiKey },
  });

  if (!user) {
    return reply.status(401).send({ error: 'Invalid API key' });
  }

  // Check if we need to reset monthly requests
  const now = new Date();
  const lastReset = user.lastRequestReset;
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        monthlyRequests: 0,
        lastRequestReset: now,
      },
    });
    user.monthlyRequests = 0;
  }

  // Check monthly rate limits
  const monthlyLimit = CALL_LIMITS_PER_MONTH[user.subscriptionPlan];
  if (user.monthlyRequests >= monthlyLimit) {
    return reply.status(429).send({ 
      error: 'Monthly limit exceeded',
      limit: monthlyLimit,
      reset: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
    });
  }

  // await validateDomain(request, reply);

  // Increment request count
  await prisma.user.update({
    where: { id: user.id },
    data: {
      monthlyRequests: user.monthlyRequests + 1,
    },
  });

  // Log API usage
  await prisma.apiUsage.create({
    data: {
      userId: user.id,
      endpoint: request.url,
    },
  });

  request.user = user;
} 