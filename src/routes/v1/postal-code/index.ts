import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { validateApiKey } from '../../../middleware/auth';

const prisma = new PrismaClient();

interface PostalCodeLookupBody {
  streetName: string;
  houseNumber: string;
  city: string;
}

export async function postalCodeRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: PostalCodeLookupBody }>('/lookup', {
    preHandler: validateApiKey,
  }, async (request, reply) => {
    const { streetName, houseNumber, city } = request.body;

    const address = await prisma.address.findFirst({
      where: {
        streetName,
        houseNumber,
        city,
      },
    });

    if (!address) {
      return reply.status(404).send({ error: 'Address not found' });
    }

    return address;
  });
} 