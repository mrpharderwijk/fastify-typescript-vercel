import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { validateApiKey } from '../../../../middleware/auth';
import { validateDomain } from '../../../../middleware/validateDomain';

const prisma = new PrismaClient();

interface AddressLookupBody {
  postalCode: string;
  houseNumber: string;
}

export async function addressRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: AddressLookupBody }>('/', {
    preHandler: [validateApiKey, validateDomain],
  }, async (request, reply) => {
    const { postalCode, houseNumber } = request.body;

    const address = await prisma.address.findFirst({
      where: {
        postalCode,
        houseNumber,
      },
    });

    if (!address) {
      return reply.status(404).send({ error: 'Address not found' });
    }

    return address;
  });
} 