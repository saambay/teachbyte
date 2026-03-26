import { PrismaClient } from '@prisma/client';
import { AgentType } from '@teachbyte/shared';
import { Agent, AgentPromptParams, RelatedTopicInfo, StudentContext, TopicContext, SessionContext } from '../agents/types';
import { coachAgent } from '../agents/coach';
import { teachingBuddyAgent } from '../agents/teachingBuddy';
import { explorerAgent } from '../agents/explorer';
import { AIMessage } from './aiGateway';

const prisma = new PrismaClient();

const MAX_SYSTEM_PROMPT_CHARS = 6000; // ~1500 tokens at ~4 chars/token

export async function assembleContext(
  studentId: string,
  sessionId: string,
  agentType: AgentType,
): Promise<{ systemPrompt: string; messages: AIMessage[] }> {
  // Fetch all data in parallel
  const [student, session, streak, recentProgress] = await Promise.all([
    prisma.student.findUniqueOrThrow({ where: { id: studentId } }),
    prisma.session.findUniqueOrThrow({
      where: { id: sessionId },
      include: {
        topic: true,
        messages: { orderBy: { created_at: 'asc' } },
      },
    }),
    prisma.streakData.findUnique({ where: { student_id: studentId } }),
    prisma.studentProgress.findMany({
      where: { student_id: studentId },
      include: { topic: true },
      orderBy: { last_attempted_at: 'desc' },
      take: 5,
    }),
  ]);

  // Build student context
  const lastProgress = recentProgress.find((p) => p.last_attempted_at);
  const studentContext: StudentContext = {
    id: student.id,
    name: student.name,
    age: student.age,
    gradeLevel: student.grade_level,
    currentStreak: streak?.current_streak || 0,
    lastTopicTitle: lastProgress?.topic.title,
  };

  // Build topic context
  let topicContext: TopicContext | undefined;
  if (session.topic) {
    topicContext = {
      id: session.topic.id,
      title: session.topic.title,
      description: session.topic.description,
      keyConcepts: session.topic.key_concepts,
      commonMisconceptions: session.topic.common_misconceptions,
      difficultyLevel: session.topic.difficulty_level,
    };

    // Add micro-lesson data for Explorer
    if (agentType === AgentType.EXPLORER) {
      topicContext.microLesson = {
        explainerPoints: session.topic.micro_lesson_explainer_points,
        funFacts: session.topic.micro_lesson_fun_facts,
        visualDescriptions: session.topic.micro_lesson_visual_descriptions,
      };
    }
  }

  // Build session context
  const sessionContext: SessionContext = {
    sessionId: session.id,
    status: session.status,
    messageCount: session.messages.length,
    conversationSummary: summarizeConversation(session.messages),
  };

  // Build progress summary
  const progressSummary = recentProgress.length > 0
    ? recentProgress.map((p) =>
        `${p.topic.title}: ${p.status} (${p.sessions_completed} sessions)`
      ).join('\n')
    : undefined;

  // Fetch related topics for Explorer
  let relatedTopics: RelatedTopicInfo[] | undefined;
  if (agentType === AgentType.EXPLORER && session.topic_id) {
    relatedTopics = await getTopicRelationships(session.topic_id);
  }

  const params: AgentPromptParams = {
    student: studentContext,
    topic: topicContext,
    session: sessionContext,
    recentProgressSummary: progressSummary,
    relatedTopics,
  };

  // Get the right agent
  const agentMap: Record<string, Agent> = {
    [AgentType.COACH]: coachAgent,
    [AgentType.TEACHING_BUDDY]: teachingBuddyAgent,
    [AgentType.EXPLORER]: explorerAgent,
  };
  const agent = agentMap[agentType] || coachAgent;
  let systemPrompt = agent.buildSystemPrompt(params);

  // Enforce token budget by truncating if needed
  if (systemPrompt.length > MAX_SYSTEM_PROMPT_CHARS) {
    systemPrompt = systemPrompt.slice(0, MAX_SYSTEM_PROMPT_CHARS) + '\n[Context truncated for length]';
  }

  // Convert DB messages to AI messages
  const messages: AIMessage[] = session.messages.map((m) => ({
    role: m.role === 'student' ? 'user' as const : 'assistant' as const,
    content: m.content,
  }));

  return { systemPrompt, messages };
}

function summarizeConversation(
  messages: { role: string; content: string; agent_type: string | null }[],
): string | undefined {
  if (messages.length === 0) return undefined;

  // For short conversations, just note the exchange count
  if (messages.length <= 2) {
    return `${messages.length} messages exchanged so far.`;
  }

  // Build a brief summary from the last few messages
  const recentMessages = messages.slice(-4);
  const summary = recentMessages
    .map((m) => {
      const speaker = m.role === 'student' ? 'Student' : 'Agent';
      const truncated = m.content.length > 100
        ? m.content.slice(0, 100) + '...'
        : m.content;
      return `${speaker}: ${truncated}`;
    })
    .join('\n');

  return `${messages.length} messages exchanged. Recent:\n${summary}`;
}

async function getTopicRelationships(topicId: string): Promise<RelatedTopicInfo[]> {
  const relationships = await prisma.topicRelationship.findMany({
    where: { topic_id: topicId },
    include: { relatedTopic: { select: { title: true } } },
  });

  const typeLabels: Record<string, string> = {
    prerequisite: 'is a foundation for',
    related: 'connects to',
    builds_on: 'builds on',
  };

  return relationships.map((r) => ({
    title: r.relatedTopic.title,
    relationship: typeLabels[r.relationship_type] || 'relates to',
  }));
}

export { summarizeConversation, getTopicRelationships };
