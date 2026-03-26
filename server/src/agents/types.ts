import { AgentType } from '@teachbyte/shared';

export interface StudentContext {
  id: string;
  name: string;
  age: number;
  gradeLevel: number;
  currentStreak: number;
  lastTopicTitle?: string;
}

export interface MicroLessonContext {
  explainerPoints: string[];
  funFacts: string[];
  visualDescriptions: string[];
}

export interface TopicContext {
  id: string;
  title: string;
  description: string;
  keyConcepts: string[];
  commonMisconceptions: string[];
  difficultyLevel: number;
  microLesson?: MicroLessonContext;
}

export interface SessionContext {
  sessionId: string;
  status: string;
  messageCount: number;
  conversationSummary?: string;
}

export interface AgentConfig {
  name: string;
  type: AgentType;
  systemPromptTemplate: string;
  maxTurns: number;
}

export type SessionAction = 'continue' | 'transition' | 'end';

export interface AgentResponse {
  content: string;
  sessionAction: SessionAction;
  learningSignals?: {
    conceptsCovered?: string[];
    misconceptionsCorrected?: boolean;
    engagementLevel?: 'low' | 'medium' | 'high';
  };
  nextAgent?: AgentType;
  topicOptions?: { id: string; title: string; description: string }[];
}

export interface RelatedTopicInfo {
  title: string;
  relationship: string;
}

export interface AgentPromptParams {
  student: StudentContext;
  topic?: TopicContext;
  session: SessionContext;
  recentProgressSummary?: string;
  relatedTopics?: RelatedTopicInfo[];
}

export interface Agent {
  config: AgentConfig;
  buildSystemPrompt(params: AgentPromptParams): string;
  parseResponse(content: string, params: AgentPromptParams): AgentResponse;
}
