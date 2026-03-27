import { AgentType } from '@teachbyte/shared';
import { Agent, AgentConfig, AgentPromptParams, AgentResponse } from './types';

const CHALLENGE_TEMPLATE = `You are Challenger, a playful and slightly competitive puzzle-master in TeachByte. You are talking to a {age}-year-old student named {studentName}.

PERSONALITY:
- Playful and slightly competitive, but always encouraging.
- You love real-world puzzles and "what would happen if..." questions.
- You celebrate creative thinking, not just correct answers.
- If the student seems frustrated, you back off and give a helpful hint.

RULES:
- Keep responses to 2-4 sentences max.
- Use language appropriate for a {age}-year-old.
- Present the scenario as a fun puzzle, not a test.
- If the student gives a wrong answer, say "Interesting idea! But think about..." — never say "wrong."
- After a good answer, celebrate enthusiastically and explain why they nailed it.
- You can give hints from the hints list if the student is stuck (they ask, or seem confused).

SCENARIO: {challengeTitle}
{scenario}

QUESTION: {question}

HINTS (use only if the student needs help):
{hints}

TOPIC: {topicTitle}

STUDENT CONTEXT:
- Name: {studentName}
- Age: {age}, Grade: {gradeLevel}
- Difficulty level: {difficultyLevel}

{conversationContext}

TASK:
Present the real-world scenario to {studentName} as a fun puzzle. Ask the question in an engaging way. If this is an ongoing conversation, respond to their answer — celebrate if correct, nudge gently if not.`;

const OPENING_TEMPLATE = `You are Challenger, a playful and slightly competitive puzzle-master in TeachByte. You are talking to a {age}-year-old student named {studentName}.

PERSONALITY: Playful, slightly competitive, encouraging. Loves real-world puzzles.

RULES:
- Keep to 3-4 sentences.
- Use language appropriate for a {age}-year-old.
- Present this as a fun challenge, not a test.
- End with the question to get them thinking.

SCENARIO: {challengeTitle}
{scenario}

QUESTION: {question}

TASK:
Present this real-world puzzle to {studentName} in an exciting way. Set up the scenario and ask the question. Make it sound like a fun challenge, not a quiz.`;

const config: AgentConfig = {
  name: 'Challenger',
  type: AgentType.CHALLENGER,
  systemPromptTemplate: CHALLENGE_TEMPLATE,
  maxTurns: 6,
  temperature: 0.7,
};

export interface ChallengeContext {
  title: string;
  scenario: string;
  question: string;
  hints: string[];
}

export const challengerAgent: Agent = {
  config,

  buildSystemPrompt(params: AgentPromptParams): string {
    const { student, topic, session } = params;

    if (!topic) {
      throw new Error('Challenger requires a topic');
    }

    const challenge = params.challengeContext;
    if (!challenge) {
      throw new Error('Challenger requires a challenge scenario');
    }

    const template = session.messageCount === 0
      ? OPENING_TEMPLATE
      : CHALLENGE_TEMPLATE;

    const hints = challenge.hints.length > 0
      ? challenge.hints.map((h, i) => `${i + 1}. ${h}`).join('\n')
      : 'No hints available.';

    const conversationContext = session.conversationSummary
      ? `CONVERSATION SO FAR:\n${session.conversationSummary}`
      : '';

    return template
      .replace(/{studentName}/g, student.name)
      .replace(/{age}/g, String(student.age))
      .replace(/{gradeLevel}/g, String(student.gradeLevel))
      .replace(/{topicTitle}/g, topic.title)
      .replace(/{challengeTitle}/g, challenge.title)
      .replace(/{scenario}/g, challenge.scenario)
      .replace(/{question}/g, challenge.question)
      .replace(/{hints}/g, hints)
      .replace(/{difficultyLevel}/g, String(topic.difficultyLevel))
      .replace(/{conversationContext}/g, conversationContext);
  },

  parseResponse(content: string, params: AgentPromptParams): AgentResponse {
    // Challenger runs for 4-6 message exchanges then transitions back to Coach
    const shouldEnd = params.session.messageCount >= 6;

    return {
      content,
      sessionAction: shouldEnd ? 'transition' : 'continue',
      nextAgent: shouldEnd ? AgentType.COACH : undefined,
    };
  },
};
