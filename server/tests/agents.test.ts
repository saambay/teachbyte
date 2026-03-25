import { describe, it, expect } from 'vitest';
import { coachAgent, getCoachMode } from '../src/agents/coach';
import { teachingBuddyAgent } from '../src/agents/teachingBuddy';
import { AgentPromptParams, StudentContext, TopicContext, SessionContext } from '../src/agents/types';

const mockStudent: StudentContext = {
  id: 'student-1',
  name: 'Alex',
  age: 9,
  gradeLevel: 4,
  currentStreak: 3,
  lastTopicTitle: 'Photosynthesis',
};

const mockTopic: TopicContext = {
  id: 'topic-1',
  title: 'Gravity',
  description: 'The invisible force that pulls everything toward the ground.',
  keyConcepts: [
    'Gravity pulls objects toward Earth',
    'Heavier and lighter objects fall at the same speed (without air)',
    'Gravity keeps the Moon orbiting Earth',
  ],
  commonMisconceptions: [
    'Heavier objects fall faster',
    'There is no gravity in space',
  ],
  difficultyLevel: 1,
};

describe('Coach Agent', () => {
  it('builds a greeting prompt with student context', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      session: { sessionId: 's1', status: 'coach_greeting', messageCount: 0 },
    };

    const prompt = coachAgent.buildSystemPrompt(params);

    expect(prompt).toContain('Alex');
    expect(prompt).toContain('9');
    expect(prompt).toContain('3 days');
    expect(prompt).toContain('Photosynthesis');
  });

  it('builds a greeting for first-time students', () => {
    const newStudent: StudentContext = {
      ...mockStudent,
      currentStreak: 0,
      lastTopicTitle: undefined,
    };
    const params: AgentPromptParams = {
      student: newStudent,
      session: { sessionId: 's1', status: 'coach_greeting', messageCount: 0 },
    };

    const prompt = coachAgent.buildSystemPrompt(params);

    expect(prompt).toContain('first session');
  });

  it('builds a summary prompt with topic and conversation', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      topic: mockTopic,
      session: {
        sessionId: 's1',
        status: 'coach_summary',
        messageCount: 8,
        conversationSummary: 'Alex explained gravity and corrected the buddy about heavy objects.',
      },
    };

    const prompt = coachAgent.buildSystemPrompt(params);

    expect(prompt).toContain('Gravity');
    expect(prompt).toContain('Alex explained gravity');
    expect(prompt).toContain('congratulating');
  });

  it('returns correct session action for greeting', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      session: { sessionId: 's1', status: 'coach_greeting', messageCount: 0 },
    };

    const response = coachAgent.parseResponse('Hello Alex!', params);
    expect(response.sessionAction).toBe('transition');
  });

  it('returns end action for summary', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      session: { sessionId: 's1', status: 'coach_summary', messageCount: 8 },
    };

    const response = coachAgent.parseResponse('Great job today!', params);
    expect(response.sessionAction).toBe('end');
  });

  it('correctly determines coach mode', () => {
    expect(getCoachMode('starting')).toBe('greeting');
    expect(getCoachMode('coach_greeting')).toBe('greeting');
    expect(getCoachMode('topic_selection')).toBe('topic_selection');
    expect(getCoachMode('coach_summary')).toBe('summary');
  });
});

describe('Teaching Buddy Agent', () => {
  it('builds an opening prompt for first message', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      topic: mockTopic,
      session: { sessionId: 's1', status: 'teaching', messageCount: 0 },
    };

    const prompt = teachingBuddyAgent.buildSystemPrompt(params);

    expect(prompt).toContain('Buddy');
    expect(prompt).toContain('Alex');
    expect(prompt).toContain('Gravity');
    expect(prompt).toContain('confused');
  });

  it('builds a teaching prompt with full context for ongoing conversation', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      topic: mockTopic,
      session: {
        sessionId: 's1',
        status: 'teaching',
        messageCount: 4,
        conversationSummary: 'Alex started explaining how gravity works.',
      },
    };

    const prompt = teachingBuddyAgent.buildSystemPrompt(params);

    expect(prompt).toContain('Gravity');
    expect(prompt).toContain('Gravity pulls objects toward Earth');
    expect(prompt).toContain('Heavier objects fall faster');
    expect(prompt).toContain('Alex started explaining');
  });

  it('throws if no topic provided', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      session: { sessionId: 's1', status: 'teaching', messageCount: 0 },
    };

    expect(() => teachingBuddyAgent.buildSystemPrompt(params)).toThrow('Teaching Buddy requires a topic');
  });

  it('signals continue for early conversation', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      topic: mockTopic,
      session: { sessionId: 's1', status: 'teaching', messageCount: 2 },
    };

    const response = teachingBuddyAgent.parseResponse('Tell me more!', params);
    expect(response.sessionAction).toBe('continue');
  });

  it('signals transition after enough exchanges', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      topic: mockTopic,
      session: { sessionId: 's1', status: 'teaching', messageCount: 8 },
    };

    const response = teachingBuddyAgent.parseResponse('I get it now!', params);
    expect(response.sessionAction).toBe('transition');
  });
});
