import { describe, it, expect } from 'vitest';
import { AgentType } from '@teachbyte/shared';
import { coachAgent, getCoachMode } from '../src/agents/coach';
import { teachingBuddyAgent } from '../src/agents/teachingBuddy';
import { explorerAgent } from '../src/agents/explorer';
import { challengerAgent } from '../src/agents/challenger';
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

  it('transitions to Explorer on topic_selection', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      session: { sessionId: 's1', status: 'topic_selection', messageCount: 1 },
    };

    const response = coachAgent.parseResponse('Great choices!', params);
    expect(response.sessionAction).toBe('transition');
    expect(response.nextAgent).toBe(AgentType.EXPLORER);
  });
});

describe('Explorer Agent', () => {
  const topicWithMicroLesson: TopicContext = {
    ...mockTopic,
    microLesson: {
      explainerPoints: [
        'Gravity is an invisible force that pulls things toward each other.',
        'The bigger something is, the stronger its gravity.',
        'Without air resistance, a feather and ball fall at the same speed.',
      ],
      funFacts: [
        'You weigh less on the Moon because its gravity is about six times weaker!',
      ],
      visualDescriptions: [
        'Imagine placing a bowling ball on a stretched-out blanket — it makes a dip.',
      ],
    },
  };

  it('builds a prompt with micro-lesson content', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      topic: topicWithMicroLesson,
      session: { sessionId: 's1', status: 'exploring', messageCount: 0 },
    };

    const prompt = explorerAgent.buildSystemPrompt(params);

    expect(prompt).toContain('Explorer');
    expect(prompt).toContain('Alex');
    expect(prompt).toContain('Gravity');
    expect(prompt).toContain('invisible force');
    expect(prompt).toContain('Moon');
  });

  it('falls back to key concepts when no micro-lesson', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      topic: mockTopic,
      session: { sessionId: 's1', status: 'exploring', messageCount: 0 },
    };

    const prompt = explorerAgent.buildSystemPrompt(params);

    expect(prompt).toContain('Gravity pulls objects toward Earth');
  });

  it('includes related topics when provided', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      topic: topicWithMicroLesson,
      session: { sessionId: 's1', status: 'exploring', messageCount: 0 },
      relatedTopics: [
        { title: 'Forces and Motion', relationship: 'connects to' },
        { title: 'Our Solar System', relationship: 'connects to' },
      ],
    };

    const prompt = explorerAgent.buildSystemPrompt(params);

    expect(prompt).toContain('Forces and Motion');
    expect(prompt).toContain('Our Solar System');
  });

  it('throws if no topic provided', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      session: { sessionId: 's1', status: 'exploring', messageCount: 0 },
    };

    expect(() => explorerAgent.buildSystemPrompt(params)).toThrow('Explorer requires a topic');
  });

  it('always returns transition to Teaching Buddy', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      topic: topicWithMicroLesson,
      session: { sessionId: 's1', status: 'exploring', messageCount: 0 },
    };

    const response = explorerAgent.parseResponse('Here is something amazing about gravity!', params);
    expect(response.sessionAction).toBe('transition');
    expect(response.nextAgent).toBe(AgentType.TEACHING_BUDDY);
  });

  it('prompt stays under 1500 token budget', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      topic: topicWithMicroLesson,
      session: { sessionId: 's1', status: 'exploring', messageCount: 0 },
      relatedTopics: [
        { title: 'Forces and Motion', relationship: 'connects to' },
      ],
    };

    const prompt = explorerAgent.buildSystemPrompt(params);
    // ~4 chars per token, 1500 tokens = 6000 chars
    expect(prompt.length).toBeLessThan(6000);
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

describe('Challenger Agent', () => {
  const mockChallenge = {
    title: 'The Moon Jump',
    scenario: 'An astronaut on the Moon can jump six times higher than on Earth.',
    question: 'How high could they jump on the Moon?',
    hints: ['The Moon is smaller than Earth', 'Smaller objects have weaker gravity'],
  };

  it('builds a prompt with challenge scenario', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      topic: mockTopic,
      session: { sessionId: 's1', status: 'challenging', messageCount: 0 },
      challengeContext: mockChallenge,
    };

    const prompt = challengerAgent.buildSystemPrompt(params);

    expect(prompt).toContain('Challenger');
    expect(prompt).toContain('Alex');
    expect(prompt).toContain('The Moon Jump');
    expect(prompt).toContain('astronaut');
  });

  it('throws if no topic provided', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      session: { sessionId: 's1', status: 'challenging', messageCount: 0 },
      challengeContext: mockChallenge,
    };

    expect(() => challengerAgent.buildSystemPrompt(params)).toThrow('Challenger requires a topic');
  });

  it('throws if no challenge context provided', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      topic: mockTopic,
      session: { sessionId: 's1', status: 'challenging', messageCount: 0 },
    };

    expect(() => challengerAgent.buildSystemPrompt(params)).toThrow('Challenger requires a challenge scenario');
  });

  it('signals continue for early conversation', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      topic: mockTopic,
      session: { sessionId: 's1', status: 'challenging', messageCount: 2 },
      challengeContext: mockChallenge,
    };

    const response = challengerAgent.parseResponse('Hmm let me think...', params);
    expect(response.sessionAction).toBe('continue');
  });

  it('signals transition after enough exchanges', () => {
    const params: AgentPromptParams = {
      student: mockStudent,
      topic: mockTopic,
      session: { sessionId: 's1', status: 'challenging', messageCount: 6 },
      challengeContext: mockChallenge,
    };

    const response = challengerAgent.parseResponse('Great job!', params);
    expect(response.sessionAction).toBe('transition');
    expect(response.nextAgent).toBe(AgentType.COACH);
  });
});
