import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { validateApiKey } from '../../../middleware/auth';
import { User } from '@prisma/client';
import { RouteGenericInterface } from 'fastify/types/route';

interface AddDomainBody {
  domain: string;
}

interface DeleteDomainParams {
  domainId: string;
}

interface AuthenticatedRequest extends RouteGenericInterface {
  Headers: { 'x-api-key': string };
}

export async function domainRoutes(fastify: FastifyInstance) {
  // Get all allowed domains for the user
  fastify.get<AuthenticatedRequest>('/', {
    preHandler: validateApiKey,
  }, async (request) => {
    const user = request.user as User;
    const domains = await fastify.prisma.allowedDomain.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return domains;
  });

  // Add a new allowed domain
  fastify.post<AuthenticatedRequest & { Body: AddDomainBody }>('/', {
    preHandler: validateApiKey,
  }, async (request, reply) => {
    const user = request.user as User;
    const { domain } = request.body;

    if (!domain) {
      return reply.status(400).send({ error: 'Domain is required' });
    }

    // Validate domain format
    try {
      new URL(`https://${domain}`);
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid domain format' });
    }

    try {
      const newDomain = await fastify.prisma.allowedDomain.create({
        data: {
          domain: domain.toLowerCase(),
          userId: user.id,
        },
      });

      return newDomain;
    } catch (error: any) {
      // Handle unique constraint violation
      if (error.code === 'P2002') {
        return reply.status(400).send({ error: 'Domain already exists for this user' });
      }
      throw error;
    }
  });

  // Delete an allowed domain
  fastify.delete<AuthenticatedRequest & { Params: DeleteDomainParams }>('/:domainId', {
    preHandler: validateApiKey,
  }, async (request, reply) => {
    const user = request.user as User;
    const { domainId } = request.params;

    const domain = await fastify.prisma.allowedDomain.findFirst({
      where: {
        id: domainId,
        userId: user.id,
      },
    });

    if (!domain) {
      return reply.status(404).send({ error: 'Domain not found' });
    }

    await fastify.prisma.allowedDomain.delete({
      where: {
        id: domainId,
      },
    });

    return { success: true };
  });
} 