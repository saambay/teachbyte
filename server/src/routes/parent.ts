import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { UpdateParentSettingsRequestSchema } from '@teachbyte/shared';
import { authMiddleware, verifyStudentBelongsToParent } from '../middleware/auth';
import { getStreakData } from '../services/progressService';

const prisma = new PrismaClient();

export async function parentRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', authMiddleware);

  // GET /api/parent/dashboard/:studentId
  app.get<{ Params: { studentId: string } }>(
    '/api/parent/dashboard/:studentId',
    async (request, reply) => {
      const { studentId } = request.params;

      const isOwner = await verifyStudentBelongsToParent(studentId, request.parentId!);
      if (!isOwner) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      // Get recent sessions (last 7)
      const recentSessions = await prisma.session.findMany({
        where: {
          student_id: studentId,
          status: 'completed',
        },
        include: { topic: true },
        orderBy: { started_at: 'desc' },
        take: 7,
      });

      // Get topic progress
      const topicProgress = await prisma.studentProgress.findMany({
        where: { student_id: studentId },
        include: { topic: true },
        orderBy: { last_attempted_at: 'desc' },
      });

      // Get streak data
      const streakData = await getStreakData(studentId);

      // Calculate total time this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const weekSessions = await prisma.session.findMany({
        where: {
          student_id: studentId,
          status: 'completed',
          started_at: { gte: oneWeekAgo },
        },
        select: { duration_seconds: true },
      });

      const totalTimeThisWeekSeconds = weekSessions.reduce(
        (sum, s) => sum + s.duration_seconds,
        0,
      );

      return {
        recentSessions,
        topicProgress,
        streakData,
        totalTimeThisWeekSeconds,
      };
    },
  );

  // PUT /api/parent/settings
  app.put('/api/parent/settings', async (request, reply) => {
    const parsed = UpdateParentSettingsRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request', details: parsed.error.issues });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.notificationsEnabled !== undefined) {
      updateData.notifications_enabled = parsed.data.notificationsEnabled;
    }
    if (parsed.data.dailySessionReminder !== undefined) {
      updateData.daily_session_reminder = parsed.data.dailySessionReminder;
    }
    if (parsed.data.reminderTime !== undefined) {
      updateData.reminder_time = parsed.data.reminderTime;
    }

    const parent = await prisma.parent.update({
      where: { id: request.parentId! },
      data: updateData,
    });

    return {
      settings: {
        notificationsEnabled: parent.notifications_enabled,
        dailySessionReminder: parent.daily_session_reminder,
        reminderTime: parent.reminder_time,
      },
    };
  });
}
