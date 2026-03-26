import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AgentType, SessionStatus } from '@teachbyte/shared';
import { sendAIRequest } from './aiGateway';
import { assembleContext } from './contextAssembler';
import { validateResponse, validateStudentMessage } from './guardrails';
import { coachAgent } from '../agents/coach';
import { teachingBuddyAgent } from '../agents/teachingBuddy';
import { explorerAgent } from '../agents/explorer';
import pino from 'pino';

const prisma = new PrismaClient();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const MAX_API_CALLS_PER_SESSION = 50;
const ABANDON_TIMEOUT_MINUTES = 30;

interface SessionMessageResult {
  message: {
    id: string;
    role: 'agent';
    content: string;
    agentType: AgentType;
    timestamp: Date;
  };
  sessionStatus: SessionStatus;
  topicOptions?: { id: string; title: string; description: string }[];
}

export async function startSession(studentId: string): Promise<{
  sessionId: string;
  status: SessionStatus;
  message: SessionMessageResult['message'];
}> {
  // Verify student exists
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
  });

  // Create new session
  const session = await prisma.session.create({
    data: {
      id: randomUUID(),
      student_id: studentId,
      status: SessionStatus.COACH_GREETING,
      started_at: new Date(),
    },
  });

  // Generate Coach greeting
  const { systemPrompt, messages } = await assembleContext(
    studentId,
    session.id,
    AgentType.COACH,
  );

  const aiResponse = await sendAIRequest({
    agentType: AgentType.COACH,
    systemPrompt,
    messages: messages.length > 0 ? messages : [{ role: 'user', content: 'Start the session.' }],
  });

  const guardrailResult = validateResponse(aiResponse.content);
  const content = guardrailResult.safe
    ? (guardrailResult.filteredContent || aiResponse.content)
    : "Hey there! I'm so excited to see you today! Ready to teach something amazing?";

  // Save the greeting message
  const greetingMessage = await prisma.sessionMessage.create({
    data: {
      id: randomUUID(),
      session_id: session.id,
      role: 'agent',
      content,
      agent_type: AgentType.COACH,
    },
  });

  // Transition to topic selection
  await prisma.session.update({
    where: { id: session.id },
    data: { status: SessionStatus.TOPIC_SELECTION },
  });

  // Get recommended topics
  const topics = await getRecommendedTopicsForSession(studentId);

  return {
    sessionId: session.id,
    status: SessionStatus.TOPIC_SELECTION,
    message: {
      id: greetingMessage.id,
      role: 'agent',
      content,
      agentType: AgentType.COACH,
      timestamp: greetingMessage.created_at,
    },
  };
}

export async function sendMessage(
  sessionId: string,
  content: string,
): Promise<SessionMessageResult> {
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: { messages: true },
  });

  // Validate student message
  const studentValidation = validateStudentMessage(content);
  if (!studentValidation.safe) {
    throw new Error(studentValidation.reason || 'Invalid message');
  }
  const sanitizedContent = studentValidation.filteredContent || content;

  // Check API call limit
  const agentMessageCount = session.messages.filter((m) => m.role === 'agent').length;
  if (agentMessageCount >= MAX_API_CALLS_PER_SESSION) {
    throw new Error('Session API call limit reached');
  }

  // Save student message
  await prisma.sessionMessage.create({
    data: {
      id: randomUUID(),
      session_id: sessionId,
      role: 'student',
      content: sanitizedContent,
    },
  });

  // Determine which agent should respond
  const currentStatus = session.status as SessionStatus;
  let agentType: AgentType;
  let newStatus: SessionStatus = currentStatus;
  let topicOptions: { id: string; title: string; description: string }[] | undefined;

  if (currentStatus === SessionStatus.TOPIC_SELECTION) {
    // Student is selecting a topic — find the topic they chose
    const selectedTopic = await findTopicByMessage(sanitizedContent, session.student_id);
    if (selectedTopic) {
      // Set topic and transition to EXPLORING
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          topic_id: selectedTopic.id,
          status: SessionStatus.EXPLORING,
        },
      });

      // Generate Explorer micro-lesson (one-shot)
      const explorerContext = await assembleContext(
        session.student_id,
        sessionId,
        AgentType.EXPLORER,
      );

      const explorerAiResponse = await sendAIRequest({
        agentType: AgentType.EXPLORER,
        systemPrompt: explorerContext.systemPrompt,
        messages: explorerContext.messages.length > 0
          ? explorerContext.messages
          : [{ role: 'user', content: `I want to learn about ${selectedTopic.title}` }],
      });

      const explorerGuardrail = validateResponse(explorerAiResponse.content, selectedTopic.title);
      const explorerContent = explorerGuardrail.safe
        ? (explorerGuardrail.filteredContent || explorerAiResponse.content)
        : `Let me tell you something cool about ${selectedTopic.title} before you teach Buddy! This is a really fascinating topic. Buddy is going to need your help understanding it!`;

      // Save Explorer message
      const explorerMessage = await prisma.sessionMessage.create({
        data: {
          id: randomUUID(),
          session_id: sessionId,
          role: 'agent',
          content: explorerContent,
          agent_type: AgentType.EXPLORER,
        },
      });

      // Immediately transition to TEACHING
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: SessionStatus.TEACHING },
      });

      return {
        message: {
          id: explorerMessage.id,
          role: 'agent',
          content: explorerContent,
          agentType: AgentType.EXPLORER,
          timestamp: explorerMessage.created_at,
        },
        sessionStatus: SessionStatus.TEACHING,
      };
    } else {
      // Couldn't determine topic, ask again
      agentType = AgentType.COACH;
    }
  } else if (currentStatus === SessionStatus.TEACHING) {
    agentType = AgentType.TEACHING_BUDDY;
  } else {
    agentType = AgentType.COACH;
  }

  // Get the updated session for context assembly
  const { systemPrompt, messages } = await assembleContext(
    session.student_id,
    sessionId,
    agentType,
  );

  const aiResponse = await sendAIRequest({
    agentType,
    systemPrompt,
    messages: messages.length > 0 ? messages : [{ role: 'user', content: sanitizedContent }],
  });

  // Run guardrails
  const updatedSession = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: { topic: true },
  });
  const guardrailResult = validateResponse(
    aiResponse.content,
    updatedSession.topic?.title,
  );

  let responseContent: string;
  if (!guardrailResult.safe) {
    responseContent = "Hmm, let me think about that differently. Can you tell me more?";
    logger.warn({ sessionId, reason: guardrailResult.reason }, 'Guardrail filtered agent response');
  } else {
    responseContent = guardrailResult.filteredContent || aiResponse.content;
  }

  // Check if teaching session should end (after 8+ messages)
  const agentLookup = {
    [AgentType.TEACHING_BUDDY]: teachingBuddyAgent,
    [AgentType.EXPLORER]: explorerAgent,
    [AgentType.COACH]: coachAgent,
  };
  const agent = agentLookup[agentType] || coachAgent;
  const allMessages = await prisma.sessionMessage.count({ where: { session_id: sessionId } });
  const agentResponse = agent.parseResponse(responseContent, {
    student: { id: session.student_id, name: '', age: 0, gradeLevel: 0, currentStreak: 0 },
    session: { sessionId, status: newStatus, messageCount: allMessages },
  });

  if (agentResponse.sessionAction === 'transition' && newStatus === SessionStatus.TEACHING) {
    newStatus = SessionStatus.COACH_SUMMARY;
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: SessionStatus.COACH_SUMMARY },
    });
  }

  // Save agent response
  const agentMessage = await prisma.sessionMessage.create({
    data: {
      id: randomUUID(),
      session_id: sessionId,
      role: 'agent',
      content: responseContent,
      agent_type: agentType,
    },
  });

  return {
    message: {
      id: agentMessage.id,
      role: 'agent',
      content: responseContent,
      agentType,
      timestamp: agentMessage.created_at,
    },
    sessionStatus: newStatus,
    topicOptions: currentStatus === SessionStatus.TOPIC_SELECTION ? topicOptions : undefined,
  };
}

export async function completeSession(sessionId: string): Promise<{
  teachingScore: { clarity: number; completeness: number; engagement: number; overall: number };
  summary: string;
}> {
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: { topic: true, messages: true },
  });

  // Generate summary from Coach
  const { systemPrompt, messages } = await assembleContext(
    session.student_id,
    sessionId,
    AgentType.COACH,
  );

  // Calculate teaching score
  const score = await calculateTeachingScore(sessionId);

  const now = new Date();
  const durationSeconds = Math.floor(
    (now.getTime() - session.started_at.getTime()) / 1000,
  );

  // Update session
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      status: SessionStatus.COMPLETED,
      ended_at: now,
      duration_seconds: durationSeconds,
      teaching_score_clarity: score.clarity,
      teaching_score_completeness: score.completeness,
      teaching_score_engagement: score.engagement,
      teaching_score_overall: score.overall,
    },
  });

  // Update progress
  if (session.topic_id) {
    await updateProgress(session.student_id, session.topic_id, score);
  }

  // Update streak
  await updateStreak(session.student_id);

  return {
    teachingScore: score,
    summary: `Great teaching session on ${session.topic?.title || 'today\'s topic'}!`,
  };
}

async function calculateTeachingScore(sessionId: string): Promise<{
  clarity: number;
  completeness: number;
  engagement: number;
  overall: number;
}> {
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: { topic: true, messages: true },
  });

  const studentMessages = session.messages.filter((m) => m.role === 'student');

  // Try to get LLM-based scoring
  try {
    const scoringPrompt = `Based on the student's explanation of ${session.topic?.title || 'the topic'}, evaluate:
1. Clarity (1-5): Could someone else understand this explanation?
2. Completeness (1-5): Were these key concepts addressed: ${session.topic?.key_concepts.join(', ') || 'N/A'}?
3. Engagement (1-5): Did the student actively respond to follow-ups and corrections?

Student messages:
${studentMessages.map((m) => m.content).join('\n')}

Respond in JSON only: { "clarity": N, "completeness": N, "engagement": N, "summary": "one sentence" }`;

    const aiResponse = await sendAIRequest({
      agentType: 'scorer',
      systemPrompt: 'You are a teaching quality evaluator. Respond with JSON only.',
      messages: [{ role: 'user', content: scoringPrompt }],
      maxTokens: 200,
    });

    // Try to parse JSON from response
    const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const clarity = Math.min(5, Math.max(1, Math.round(parsed.clarity || 3)));
      const completeness = Math.min(5, Math.max(1, Math.round(parsed.completeness || 3)));
      const engagement = Math.min(5, Math.max(1, Math.round(parsed.engagement || 3)));
      const overall = (clarity * 0.4 + completeness * 0.35 + engagement * 0.25);

      return { clarity, completeness, engagement, overall: Math.round(overall * 10) / 10 };
    }
  } catch (error) {
    logger.warn({ sessionId, error }, 'LLM scoring failed, using heuristic');
  }

  // Fallback: heuristic scoring
  const messageCount = studentMessages.length;
  const avgLength = studentMessages.reduce((sum, m) => sum + m.content.length, 0) / Math.max(messageCount, 1);

  const engagement = Math.min(5, Math.max(1, Math.round(messageCount / 1.5)));
  const clarity = Math.min(5, Math.max(1, Math.round(avgLength / 30)));
  const completeness = Math.min(5, Math.max(1, Math.round(messageCount / 2)));
  const overall = (clarity * 0.4 + completeness * 0.35 + engagement * 0.25);

  return { clarity, completeness, engagement, overall: Math.round(overall * 10) / 10 };
}

async function updateProgress(
  studentId: string,
  topicId: string,
  score: { clarity: number; completeness: number; engagement: number; overall: number },
): Promise<void> {
  const existing = await prisma.studentProgress.findUnique({
    where: { student_id_topic_id: { student_id: studentId, topic_id: topicId } },
  });

  const sessionsCompleted = (existing?.sessions_completed || 0) + 1;
  const isBetter = !existing?.best_overall || score.overall > existing.best_overall;

  let status = 'in_progress';
  if (score.overall >= 4.0 && sessionsCompleted >= 2) {
    status = 'mastered';
  }

  await prisma.studentProgress.upsert({
    where: { student_id_topic_id: { student_id: studentId, topic_id: topicId } },
    create: {
      student_id: studentId,
      topic_id: topicId,
      status,
      sessions_completed: 1,
      best_clarity: score.clarity,
      best_completeness: score.completeness,
      best_engagement: score.engagement,
      best_overall: score.overall,
      last_attempted_at: new Date(),
    },
    update: {
      status,
      sessions_completed: sessionsCompleted,
      ...(isBetter ? {
        best_clarity: score.clarity,
        best_completeness: score.completeness,
        best_engagement: score.engagement,
        best_overall: score.overall,
      } : {}),
      last_attempted_at: new Date(),
    },
  });
}

async function updateStreak(studentId: string): Promise<void> {
  const streak = await prisma.streakData.findUnique({
    where: { student_id: studentId },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!streak) {
    await prisma.streakData.create({
      data: {
        student_id: studentId,
        current_streak: 1,
        longest_streak: 1,
        last_session_date: new Date(),
        streak_status: 'active',
      },
    });
    return;
  }

  const lastDate = streak.last_session_date ? new Date(streak.last_session_date) : null;
  if (lastDate) {
    lastDate.setHours(0, 0, 0, 0);
  }

  const daysSinceLastSession = lastDate
    ? Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;

  let newStreak: number;
  let streakStatus: string;

  if (daysSinceLastSession === 0) {
    // Already completed a session today
    newStreak = streak.current_streak;
    streakStatus = 'active';
  } else if (daysSinceLastSession === 1) {
    // Consecutive day
    newStreak = streak.current_streak + 1;
    streakStatus = 'active';
  } else if (daysSinceLastSession === 2) {
    // Missed one day — streak pauses then resets
    newStreak = 1;
    streakStatus = 'active';
  } else {
    // Missed 2+ days — streak broken
    newStreak = 1;
    streakStatus = 'active';
  }

  const longestStreak = Math.max(streak.longest_streak, newStreak);

  await prisma.streakData.update({
    where: { student_id: studentId },
    data: {
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_session_date: new Date(),
      streak_status: streakStatus,
    },
  });
}

async function findTopicByMessage(
  messageContent: string,
  studentId: string,
): Promise<{ id: string; title: string } | null> {
  // Try to match topic by title mention in the student's message
  const topics = await prisma.topic.findMany();
  const lowerContent = messageContent.toLowerCase();

  for (const topic of topics) {
    if (lowerContent.includes(topic.title.toLowerCase())) {
      return { id: topic.id, title: topic.title };
    }
  }

  // Try matching by topic number (if they say "1", "2", "3")
  const numberMatch = lowerContent.match(/\b([1-3])\b/);
  if (numberMatch) {
    const recommended = await getRecommendedTopicsForSession(studentId);
    const index = parseInt(numberMatch[1], 10) - 1;
    if (index >= 0 && index < recommended.length) {
      return { id: recommended[index].id, title: recommended[index].title };
    }
  }

  return null;
}

export async function getRecommendedTopicsForSession(
  studentId: string,
): Promise<{ id: string; title: string; description: string }[]> {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
  });

  // Get topics the student hasn't mastered
  const mastered = await prisma.studentProgress.findMany({
    where: { student_id: studentId, status: 'mastered' },
    select: { topic_id: true },
  });
  const masteredIds = mastered.map((p) => p.topic_id);

  // Get age-appropriate topics
  const candidates = await prisma.topic.findMany({
    where: {
      id: { notIn: masteredIds },
      age_range_min: { lte: student.age },
      age_range_max: { gte: student.age },
    },
    orderBy: { difficulty_level: 'asc' },
  });

  // Mix of new and review topics
  const notStarted = candidates.filter(
    (t) => !masteredIds.includes(t.id),
  );

  // Return top 3
  return notStarted.slice(0, 3).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
  }));
}

export async function getSession(sessionId: string) {
  return prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      topic: true,
      messages: { orderBy: { created_at: 'asc' } },
    },
  });
}

export async function getSessionHistory(
  studentId: string,
  page: number,
  pageSize: number,
) {
  const [sessions, total] = await Promise.all([
    prisma.session.findMany({
      where: { student_id: studentId },
      include: { topic: true },
      orderBy: { started_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.session.count({ where: { student_id: studentId } }),
  ]);

  return { sessions, total, page, pageSize };
}
