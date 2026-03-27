import { AgentType } from '@teachbyte/shared';
import { Agent, AgentConfig, AgentPromptParams, AgentResponse } from './types';

const MICRO_LESSON_TEMPLATE = `You are Explorer, a wide-eyed and enthusiastic guide in TeachByte. You LOVE discovering connections between things. You are talking to a {age}-year-old student named {studentName}.

PERSONALITY:
- Wide-eyed and enthusiastic about everything.
- You love connections between topics — "Did you know...?" is your favorite phrase.
- You make learning feel like an adventure.
- You're amazed by the world and want to share that wonder.

RULES:
- Keep responses to 3-5 sentences.
- Use language appropriate for a {age}-year-old.
- Present the micro-lesson content naturally — do NOT just list bullet points.
- Weave in one fun fact to spark curiosity.
- If there are related topics, mention ONE connection excitedly.
- End by handing off to Buddy: tell the student that Buddy is going to need their help understanding this.

TOPIC: {topicTitle}
{topicDescription}

KEY POINTS TO SHARE:
{explainerPoints}

FUN FACTS:
{funFacts}

{relatedTopicsSection}

STUDENT CONTEXT:
- Name: {studentName}
- Age: {age}, Grade: {gradeLevel}

TASK:
Give {studentName} a quick, exciting preview of {topicTitle} before they teach it to Buddy. Make the key points feel fascinating, not like a lecture. End with something like "Now you know the basics — Buddy is really going to need your help understanding this!"`;

const config: AgentConfig = {
  name: 'Explorer',
  type: AgentType.EXPLORER,
  systemPromptTemplate: MICRO_LESSON_TEMPLATE,
  maxTurns: 3,
  temperature: 0.9,
};

export const explorerAgent: Agent = {
  config,

  buildSystemPrompt(params: AgentPromptParams): string {
    const { student, topic } = params;

    if (!topic) {
      throw new Error('Explorer requires a topic');
    }

    const microLesson = topic.microLesson;
    const explainerPoints = microLesson?.explainerPoints?.length
      ? microLesson.explainerPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')
      : topic.keyConcepts.map((c, i) => `${i + 1}. ${c}`).join('\n');

    const funFacts = microLesson?.funFacts?.length
      ? microLesson.funFacts.map((f, i) => `${i + 1}. ${f}`).join('\n')
      : `1. ${topic.description}`;

    const relatedTopicsSection = params.relatedTopics?.length
      ? `CONNECTED TOPICS:\n${params.relatedTopics.map((rt) => `- ${rt.title} (${rt.relationship})`).join('\n')}`
      : '';

    return MICRO_LESSON_TEMPLATE
      .replace(/{studentName}/g, student.name)
      .replace(/{age}/g, String(student.age))
      .replace(/{gradeLevel}/g, String(student.gradeLevel))
      .replace(/{topicTitle}/g, topic.title)
      .replace(/{topicDescription}/g, topic.description)
      .replace(/{explainerPoints}/g, explainerPoints)
      .replace(/{funFacts}/g, funFacts)
      .replace(/{relatedTopicsSection}/g, relatedTopicsSection);
  },

  parseResponse(content: string): AgentResponse {
    // Explorer is always one-shot: sends micro-lesson, then transitions to Teaching Buddy
    return {
      content,
      sessionAction: 'transition',
      nextAgent: AgentType.TEACHING_BUDDY,
    };
  },
};
