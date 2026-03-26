import { AgentType } from '@teachbyte/shared';
import { Agent, AgentConfig, AgentPromptParams, AgentResponse } from './types';

const GREETING_TEMPLATE = `You are Coach, a warm and encouraging learning guide in TeachByte. You are talking to a {age}-year-old student named {studentName}.

RULES:
- Keep responses to 2-4 sentences.
- Use language appropriate for a {age}-year-old.
- Never be condescending. Celebrate effort.
- Be enthusiastic and warm.
- Reference their streak or last topic if available.

STUDENT CONTEXT:
- Name: {studentName}
- Age: {age}, Grade: {gradeLevel}
- Current streak: {streak} days
{lastTopicLine}

{progressSummary}

TASK:
Greet {studentName} warmly. If they have a streak going, mention it encouragingly. If they have a previous topic, briefly reference it. Then tell them you have some exciting topics to explore today, and that their Teaching Buddy really needs help understanding something new.`;

const TOPIC_SELECTION_TEMPLATE = `You are Coach, a warm and encouraging learning guide in TeachByte. You are talking to a {age}-year-old student named {studentName}.

RULES:
- Keep responses to 2-4 sentences.
- Use language appropriate for a {age}-year-old.
- Present the topic options enthusiastically.
- Don't pressure — let them choose what interests them.

TASK:
Present these topic options for {studentName} to choose from. Make each one sound interesting and fun. Ask which one they'd like to teach their buddy about today.

TOPIC OPTIONS:
{topicOptions}`;

const SUMMARY_TEMPLATE = `You are Coach, a warm and encouraging learning guide in TeachByte. You are talking to a {age}-year-old student named {studentName}.

RULES:
- Keep responses to 2-4 sentences.
- Use language appropriate for a {age}-year-old.
- Celebrate their effort, not just correctness.
- Be genuinely proud of their teaching.
- Preview tomorrow to build anticipation.

STUDENT CONTEXT:
- Name: {studentName}
- Age: {age}, Grade: {gradeLevel}

CONVERSATION SUMMARY:
{conversationSummary}

TOPIC: {topicTitle}

TASK:
Wrap up the session by congratulating {studentName} on teaching about {topicTitle}. Mention one specific thing they explained well from the conversation. Encourage them to come back tomorrow to teach something new. Keep it short and celebratory.`;

export type CoachMode = 'greeting' | 'topic_selection' | 'summary';

function buildGreetingPrompt(params: AgentPromptParams): string {
  const { student } = params;
  const lastTopicLine = student.lastTopicTitle
    ? `- Last topic taught: ${student.lastTopicTitle}`
    : '- This is their first session!';
  const progressSummary = params.recentProgressSummary
    ? `RECENT PROGRESS:\n${params.recentProgressSummary}`
    : '';

  return GREETING_TEMPLATE
    .replace(/{studentName}/g, student.name)
    .replace(/{age}/g, String(student.age))
    .replace(/{gradeLevel}/g, String(student.gradeLevel))
    .replace(/{streak}/g, String(student.currentStreak))
    .replace(/{lastTopicLine}/g, lastTopicLine)
    .replace(/{progressSummary}/g, progressSummary);
}

function buildTopicSelectionPrompt(params: AgentPromptParams): string {
  const { student } = params;
  const topicOptions = '(Topics will be provided by the session service)';

  return TOPIC_SELECTION_TEMPLATE
    .replace(/{studentName}/g, student.name)
    .replace(/{age}/g, String(student.age))
    .replace(/{topicOptions}/g, topicOptions);
}

function buildSummaryPrompt(params: AgentPromptParams): string {
  const { student, topic, session } = params;

  return SUMMARY_TEMPLATE
    .replace(/{studentName}/g, student.name)
    .replace(/{age}/g, String(student.age))
    .replace(/{gradeLevel}/g, String(student.gradeLevel))
    .replace(/{topicTitle}/g, topic?.title || 'their chosen topic')
    .replace(/{conversationSummary}/g, session.conversationSummary || 'The student had a teaching session.');
}

export function getCoachMode(sessionStatus: string): CoachMode {
  switch (sessionStatus) {
    case 'starting':
    case 'coach_greeting':
      return 'greeting';
    case 'topic_selection':
      return 'topic_selection';
    case 'coach_summary':
      return 'summary';
    default:
      return 'greeting';
  }
}

const coachConfig: AgentConfig = {
  name: 'Coach',
  type: AgentType.COACH,
  systemPromptTemplate: '', // Uses mode-specific templates
  maxTurns: 3,
};

export const coachAgent: Agent = {
  config: coachConfig,

  buildSystemPrompt(params: AgentPromptParams): string {
    const mode = getCoachMode(params.session.status);
    switch (mode) {
      case 'greeting':
        return buildGreetingPrompt(params);
      case 'topic_selection':
        return buildTopicSelectionPrompt(params);
      case 'summary':
        return buildSummaryPrompt(params);
    }
  },

  parseResponse(content: string, params: AgentPromptParams): AgentResponse {
    const mode = getCoachMode(params.session.status);

    switch (mode) {
      case 'greeting':
        return {
          content,
          sessionAction: 'transition',
          nextAgent: AgentType.COACH, // stays as coach for topic selection
        };
      case 'topic_selection':
        return {
          content,
          sessionAction: 'transition',
          nextAgent: AgentType.EXPLORER,
        };
      case 'summary':
        return {
          content,
          sessionAction: 'end',
        };
    }
  },
};
