import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { TopicListRequestSchema } from '@teachbyte/shared';
import { authMiddleware, verifyStudentBelongsToParent } from '../middleware/auth';
import { getRecommendedTopics } from '../services/progressService';
import { getTopicGraph } from '../services/topicGraphService';

const prisma = new PrismaClient();

export async function topicRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', authMiddleware);

  // GET /api/topics
  app.get('/api/topics', async (request, reply) => {
    const parsed = TopicListRequestSchema.safeParse(request.query);
    const filters = parsed.success ? parsed.data : {};

    const where: Record<string, unknown> = {};
    if (filters.domain) where.domain = filters.domain;
    if (filters.difficulty) where.difficulty_level = filters.difficulty;
    if (filters.minAge) where.age_range_min = { lte: filters.minAge };
    if (filters.maxAge) where.age_range_max = { gte: filters.maxAge };

    const topics = await prisma.topic.findMany({
      where,
      orderBy: [{ difficulty_level: 'asc' }, { title: 'asc' }],
    });

    return { topics };
  });

  // GET /api/topics/:id
  app.get<{ Params: { id: string } }>(
    '/api/topics/:id',
    async (request, reply) => {
      const topic = await prisma.topic.findUnique({
        where: { id: request.params.id },
      });

      if (!topic) {
        return reply.status(404).send({ error: 'Topic not found' });
      }

      return topic;
    },
  );

  // GET /api/topics/:id/graph
  app.get<{ Params: { id: string } }>(
    '/api/topics/:id/graph',
    async (request, reply) => {
      try {
        const graph = await getTopicGraph(request.params.id);
        return graph;
      } catch {
        return reply.status(404).send({ error: 'Topic not found' });
      }
    },
  );

  // GET /api/topics/recommended/:studentId
  app.get<{ Params: { studentId: string } }>(
    '/api/topics/recommended/:studentId',
    async (request, reply) => {
      const { studentId } = request.params;

      const isOwner = await verifyStudentBelongsToParent(studentId, request.parentId!);
      if (!isOwner) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      const topics = await getRecommendedTopics(studentId);
      return { topics };
    },
  );
}
