import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface LoginBody {
  emailAddress: string;
  password: string;
}

interface RegisterBody {
  emailAddress: string;
  password: string;
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: LoginBody }>('/login', async (request, reply) => {
    try {
      const { emailAddress, password } = request.body;

      if (!emailAddress || !password) {
        return reply.status(400).send({ error: 'Wrong payload' });
      }

      const user = await prisma.user.findUnique({
        where: { email: emailAddress },
      });

      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const token = fastify.jwt.sign({ 
        id: user.id,
        email: user.email,
        apiKey: user.apiKey
      });

      return { token };
    } catch (error) {
      console.error('Error during login:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.post<{ Body: RegisterBody }>('/register', async (request, reply) => {
    const { emailAddress, password } = request.body;

    if (!emailAddress || !password) {
      return reply.status(400).send({ error: 'Wrong payload' });
    }


    const existingUser = await prisma.user.findUnique({
      where: { email: emailAddress },
    });

    if (existingUser) {
      return reply.status(400).send({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: emailAddress,
        password: hashedPassword,
      },
    });

    return { apiKey: user.apiKey };
  });
} 