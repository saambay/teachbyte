import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { DevLoginRequestSchema } from '@teachbyte/shared';
import { generateDevToken } from '../middleware/auth';

const prisma = new PrismaClient();

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Dev login - only available in development
  app.post('/api/auth/dev-login', async (request, reply) => {
    if (process.env.NODE_ENV === 'production') {
      return reply.status(404).send({ error: 'Not found' });
    }

    const parsed = DevLoginRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request', details: parsed.error.issues });
    }

    const parent = await prisma.parent.findUnique({
      where: { id: parsed.data.parentId },
    });

    if (!parent) {
      return reply.status(404).send({ error: 'Parent not found' });
    }

    const token = generateDevToken(parent.id);

    return {
      token,
      parent: {
        id: parent.id,
        email: parent.email,
        name: parent.name,
      },
    };
  });
}
