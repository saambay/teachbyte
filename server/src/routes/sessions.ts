import { FastifyInstance } from 'fastify';
import {
  StartSessionRequestSchema,
  SendMessageRequestSchema,
  PaginationSchema,
} from '@teachbyte/shared';
import { authMiddleware, verifyStudentBelongsToParent } from '../middleware/auth';
import {
  startSession,
  sendMessage,
  completeSession,
  getSession,
  getSessionHistory,
  getRecommendedTopicsForSession,
} from '../services/sessionService';

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  // All session routes require auth
  app.addHook('onRequest', authMiddleware);

  // POST /api/sessions/start
  app.post('/api/sessions/start', async (request, reply) => {
    const parsed = StartSessionRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request', details: parsed.error.issues });
    }

    const { studentId } = parsed.data;

    // Verify parent owns this student
    const isOwner = await verifyStudentBelongsToParent(studentId, request.parentId!);
    if (!isOwner) {
      return reply.status(403).send({ error: 'Access denied' });
    }

    try {
      const result = await startSession(studentId);
      const topicOptions = await getRecommendedTopicsForSession(studentId);
      return { ...result, topicOptions };
    } catch (error) {
      app.log.error(error, 'Failed to start session');
      return reply.status(500).send({ error: 'Failed to start session' });
    }
  });

  // POST /api/sessions/:id/message
  app.post<{ Params: { id: string } }>(
    '/api/sessions/:id/message',
    async (request, reply) => {
      const parsed = SendMessageRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Invalid request', details: parsed.error.issues });
      }

      try {
        const result = await sendMessage(request.params.id, parsed.data.content);
        return result;
      } catch (error) {
        app.log.error(error, 'Failed to send message');
        return reply.status(500).send({ error: 'Failed to process message' });
      }
    },
  );

  // POST /api/sessions/:id/complete
  app.post<{ Params: { id: string } }>(
    '/api/sessions/:id/complete',
    async (request, reply) => {
      try {
        const result = await completeSession(request.params.id);
        return result;
      } catch (error) {
        app.log.error(error, 'Failed to complete session');
        return reply.status(500).send({ error: 'Failed to complete session' });
      }
    },
  );

  // GET /api/sessions/:id
  app.get<{ Params: { id: string } }>(
    '/api/sessions/:id',
    async (request, reply) => {
      try {
        const session = await getSession(request.params.id);
        return session;
      } catch (error) {
        return reply.status(404).send({ error: 'Session not found' });
      }
    },
  );

  // GET /api/sessions/history/:studentId
  app.get<{ Params: { studentId: string }; Querystring: { page?: string; pageSize?: string } }>(
    '/api/sessions/history/:studentId',
    async (request, reply) => {
      const { studentId } = request.params;

      const isOwner = await verifyStudentBelongsToParent(studentId, request.parentId!);
      if (!isOwner) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      const pagination = PaginationSchema.safeParse(request.query);
      const page = pagination.success ? pagination.data.page : 1;
      const pageSize = pagination.success ? pagination.data.pageSize : 10;

      const result = await getSessionHistory(studentId, page, pageSize);
      return result;
    },
  );
}
