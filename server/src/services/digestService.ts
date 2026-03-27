import { PrismaClient } from '@prisma/client';
import pino from 'pino';

const prisma = new PrismaClient();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export interface WeeklyDigest {
  parentName: string;
  studentName: string;
  weekStartDate: Date;
  weekEndDate: Date;
  sessionsCompleted: number;
  totalTimeMinutes: number;
  topicsWorkedOn: { title: string; status: string; score?: number }[];
  currentStreak: number;
  longestStreak: number;
  newTopicsMastered: string[];
  highlightMessage: string;
}

export async function generateWeeklyDigest(
  parentId: string,
  studentId: string,
): Promise<WeeklyDigest> {
  const parent = await prisma.parent.findUniqueOrThrow({
    where: { id: parentId },
  });

  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
  });

  const weekEnd = new Date();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  // Get sessions from the past week
  const sessions = await prisma.session.findMany({
    where: {
      student_id: studentId,
      status: 'completed',
      started_at: { gte: weekStart },
    },
    include: { topic: true },
    orderBy: { started_at: 'desc' },
  });

  const totalTimeSeconds = sessions.reduce(
    (sum, s) => sum + s.duration_seconds,
    0,
  );

  // Get topics worked on
  const topicsWorkedOn = sessions
    .filter((s) => s.topic)
    .map((s) => ({
      title: s.topic!.title,
      status: s.teaching_score_overall && s.teaching_score_overall >= 4.0 ? 'mastered' : 'in_progress',
      score: s.teaching_score_overall ?? undefined,
    }));

  // Deduplicate topics
  const uniqueTopics = Array.from(
    new Map(topicsWorkedOn.map((t) => [t.title, t])).values(),
  );

  // Get streak data
  const streak = await prisma.streakData.findUnique({
    where: { student_id: studentId },
  });

  // Find newly mastered topics this week
  const masteredThisWeek = await prisma.studentProgress.findMany({
    where: {
      student_id: studentId,
      status: 'mastered',
      last_attempted_at: { gte: weekStart },
    },
    include: { topic: true },
  });

  const newTopicsMastered = masteredThisWeek.map((p) => p.topic.title);

  // Generate highlight
  let highlightMessage: string;
  if (sessions.length === 0) {
    highlightMessage = `${student.name} didn't have any sessions this week. A quick 10-minute session can make a big difference!`;
  } else if (newTopicsMastered.length > 0) {
    highlightMessage = `${student.name} mastered ${newTopicsMastered.join(' and ')} this week! They're building real knowledge.`;
  } else if (sessions.length >= 5) {
    highlightMessage = `${student.name} completed ${sessions.length} sessions this week — that's amazing dedication!`;
  } else {
    highlightMessage = `${student.name} completed ${sessions.length} session${sessions.length === 1 ? '' : 's'} this week. Keep it up!`;
  }

  logger.info({
    parentId,
    studentId,
    sessionsCount: sessions.length,
  }, 'Generated weekly digest');

  return {
    parentName: parent.name,
    studentName: student.name,
    weekStartDate: weekStart,
    weekEndDate: weekEnd,
    sessionsCompleted: sessions.length,
    totalTimeMinutes: Math.round(totalTimeSeconds / 60),
    topicsWorkedOn: uniqueTopics,
    currentStreak: streak?.current_streak ?? 0,
    longestStreak: streak?.longest_streak ?? 0,
    newTopicsMastered,
    highlightMessage,
  };
}

export async function getDigestEligibleParents(): Promise<
  { parentId: string; studentId: string }[]
> {
  const parents = await prisma.parent.findMany({
    where: {
      daily_session_reminder: true,
    },
    include: {
      students: { select: { id: true } },
    },
  });

  return parents.flatMap((p) =>
    p.students.map((s) => ({ parentId: p.id, studentId: s.id })),
  );
}
