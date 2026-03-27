import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getDifficultyProfile(studentId: string) {
  const profile = await prisma.difficultyProfile.findUnique({
    where: { student_id: studentId },
  });

  if (!profile) {
    return prisma.difficultyProfile.create({
      data: {
        student_id: studentId,
        current_level: 1.0,
        success_rate: 0.0,
      },
    });
  }

  return profile;
}

export async function recordChallengeResult(
  studentId: string,
  correct: boolean,
): Promise<{ newLevel: number; levelChanged: boolean }> {
  const profile = await getDifficultyProfile(studentId);

  const totalChallenges = profile.total_challenges + 1;
  const totalCorrect = profile.total_correct + (correct ? 1 : 0);
  const successRate = totalCorrect / totalChallenges;

  const consecutiveSuccesses = correct ? profile.consecutive_successes + 1 : 0;
  const consecutiveFailures = correct ? 0 : profile.consecutive_failures + 1;

  // Calibration logic
  let newLevel = profile.current_level;
  let levelChanged = false;

  // Level up: 3 consecutive successes and success rate > 70%
  if (consecutiveSuccesses >= 3 && successRate > 0.7 && newLevel < 3) {
    newLevel = Math.min(3, newLevel + 0.5);
    levelChanged = true;
  }

  // Level down: 2 consecutive failures or success rate drops below 30%
  if ((consecutiveFailures >= 2 || (totalChallenges >= 3 && successRate < 0.3)) && newLevel > 1) {
    newLevel = Math.max(1, newLevel - 0.5);
    levelChanged = true;
  }

  await prisma.difficultyProfile.update({
    where: { student_id: studentId },
    data: {
      current_level: newLevel,
      success_rate: successRate,
      consecutive_successes: consecutiveSuccesses,
      consecutive_failures: consecutiveFailures,
      total_challenges: totalChallenges,
      total_correct: totalCorrect,
      last_calibration_at: levelChanged ? new Date() : profile.last_calibration_at,
    },
  });

  return { newLevel, levelChanged };
}

export async function getChallengeForStudent(
  studentId: string,
  topicId: string,
) {
  const profile = await getDifficultyProfile(studentId);
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
  });

  // Find a challenge matching the student's difficulty level and age
  const targetDifficulty = Math.round(profile.current_level);

  // Try exact match first, then nearby difficulties
  const challenge = await prisma.challengeScenario.findFirst({
    where: {
      topic_id: topicId,
      difficulty_level: targetDifficulty,
      age_range_min: { lte: student.age },
      age_range_max: { gte: student.age },
    },
  });

  if (challenge) return challenge;

  // Fallback: any challenge for this topic within age range
  return prisma.challengeScenario.findFirst({
    where: {
      topic_id: topicId,
      age_range_min: { lte: student.age },
      age_range_max: { gte: student.age },
    },
    orderBy: {
      difficulty_level: targetDifficulty <= 2 ? 'asc' : 'desc',
    },
  });
}
