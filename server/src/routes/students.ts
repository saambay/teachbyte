import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { UpdateStudentRequestSchema, CreateStudentRequestSchema } from '@teachbyte/shared';
import { authMiddleware, verifyStudentBelongsToParent } from '../middleware/auth';
import { getStudentProgress, getStreakData } from '../services/progressService';

const prisma = new PrismaClient();

export async function studentRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', authMiddleware);

  // POST /api/students - create student
  app.post('/api/students', async (request, reply) => {
    const parsed = CreateStudentRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request', details: parsed.error.issues });
    }

    const student = await prisma.student.create({
      data: {
        parent_id: request.parentId!,
        name: parsed.data.name,
        age: parsed.data.age,
        grade_level: parsed.data.gradeLevel,
      },
    });

    // Create initial streak data
    await prisma.streakData.create({
      data: {
        student_id: student.id,
        current_streak: 0,
        longest_streak: 0,
        streak_status: 'broken',
      },
    });

    return { student };
  });

  // GET /api/students/:id
  app.get<{ Params: { id: string } }>(
    '/api/students/:id',
    async (request, reply) => {
      const { id } = request.params;

      const isOwner = await verifyStudentBelongsToParent(id, request.parentId!);
      if (!isOwner) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      const student = await prisma.student.findUnique({ where: { id } });
      if (!student) {
        return reply.status(404).send({ error: 'Student not found' });
      }

      return student;
    },
  );

  // PUT /api/students/:id
  app.put<{ Params: { id: string } }>(
    '/api/students/:id',
    async (request, reply) => {
      const { id } = request.params;

      const isOwner = await verifyStudentBelongsToParent(id, request.parentId!);
      if (!isOwner) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      const parsed = UpdateStudentRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Invalid request', details: parsed.error.issues });
      }

      const updateData: Record<string, unknown> = {};
      if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
      if (parsed.data.age !== undefined) updateData.age = parsed.data.age;
      if (parsed.data.gradeLevel !== undefined) updateData.grade_level = parsed.data.gradeLevel;

      const student = await prisma.student.update({
        where: { id },
        data: updateData,
      });

      return student;
    },
  );

  // GET /api/students/:id/progress
  app.get<{ Params: { id: string } }>(
    '/api/students/:id/progress',
    async (request, reply) => {
      const { id } = request.params;

      const isOwner = await verifyStudentBelongsToParent(id, request.parentId!);
      if (!isOwner) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      const progress = await getStudentProgress(id);
      return { progress };
    },
  );

  // GET /api/students/:id/streak
  app.get<{ Params: { id: string } }>(
    '/api/students/:id/streak',
    async (request, reply) => {
      const { id } = request.params;

      const isOwner = await verifyStudentBelongsToParent(id, request.parentId!);
      if (!isOwner) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      const streak = await getStreakData(id);
      return streak;
    },
  );
}
