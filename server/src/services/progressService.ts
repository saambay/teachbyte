import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getStudentProgress(studentId: string) {
  return prisma.studentProgress.findMany({
    where: { student_id: studentId },
    include: { topic: true },
    orderBy: { last_attempted_at: 'desc' },
  });
}

export async function getStreakData(studentId: string) {
  const streak = await prisma.streakData.findUnique({
    where: { student_id: studentId },
  });

  if (!streak) {
    return {
      studentId,
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: null,
      streakStatus: 'broken' as const,
    };
  }

  // Check if streak should be considered paused or broken based on time
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streakStatus = streak.streak_status;
  if (streak.last_session_date) {
    const lastDate = new Date(streak.last_session_date);
    lastDate.setHours(0, 0, 0, 0);
    const daysSince = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSince === 0) {
      streakStatus = 'active';
    } else if (daysSince === 1) {
      streakStatus = 'paused'; // at risk
    } else {
      streakStatus = 'broken';
    }
  }

  return {
    studentId: streak.student_id,
    currentStreak: streak.current_streak,
    longestStreak: streak.longest_streak,
    lastSessionDate: streak.last_session_date,
    streakStatus,
  };
}

export async function getRecommendedTopics(studentId: string, count = 3) {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
  });

  // Get student's progress
  const progress = await prisma.studentProgress.findMany({
    where: { student_id: studentId },
  });

  const masteredIds = progress
    .filter((p) => p.status === 'mastered')
    .map((p) => p.topic_id);

  const inProgressIds = progress
    .filter((p) => p.status === 'in_progress')
    .map((p) => p.topic_id);

  // Get age-appropriate topics
  const allTopics = await prisma.topic.findMany({
    where: {
      age_range_min: { lte: student.age },
      age_range_max: { gte: student.age },
    },
  });

  // Prioritize: 1 review topic (in_progress) + 2 new topics
  const reviewTopics = allTopics
    .filter((t) => inProgressIds.includes(t.id))
    .slice(0, 1);

  const newTopics = allTopics
    .filter((t) => !masteredIds.includes(t.id) && !inProgressIds.includes(t.id))
    .sort((a, b) => a.difficulty_level - b.difficulty_level)
    .slice(0, count - reviewTopics.length);

  return [...reviewTopics, ...newTopics].slice(0, count);
}
