import { PrismaClient } from '@prisma/client';
import pino from 'pino';

const prisma = new PrismaClient();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const ABANDON_TIMEOUT_MINUTES = 30;

export async function checkAndAbandonStaleSessions(): Promise<number> {
  const cutoff = new Date(Date.now() - ABANDON_TIMEOUT_MINUTES * 60 * 1000);

  const result = await prisma.session.updateMany({
    where: {
      status: { notIn: ['completed', 'abandoned'] },
      updated_at: { lt: cutoff },
    },
    data: { status: 'abandoned' },
  });

  if (result.count > 0) {
    logger.info({ count: result.count }, 'Abandoned stale sessions');
  }

  return result.count;
}

export async function getActiveSession(studentId: string) {
  return prisma.session.findFirst({
    where: {
      student_id: studentId,
      status: { notIn: ['completed', 'abandoned'] },
    },
    include: {
      topic: true,
      messages: { orderBy: { created_at: 'asc' } },
    },
    orderBy: { started_at: 'desc' },
  });
}
