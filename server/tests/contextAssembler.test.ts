import { describe, it, expect } from 'vitest';
import { summarizeConversation } from '../src/services/contextAssembler';

describe('summarizeConversation', () => {
  it('returns undefined for empty messages', () => {
    const result = summarizeConversation([]);
    expect(result).toBeUndefined();
  });

  it('returns message count for short conversations', () => {
    const result = summarizeConversation([
      { role: 'agent', content: 'Hello!', agent_type: 'coach' },
    ]);
    expect(result).toContain('1 messages');
  });

  it('includes recent messages in summary for longer conversations', () => {
    const messages = [
      { role: 'agent', content: 'Hi there, welcome!', agent_type: 'coach' },
      { role: 'student', content: 'Thanks!', agent_type: null },
      { role: 'agent', content: 'What topic would you like?', agent_type: 'coach' },
      { role: 'student', content: 'I want to learn about gravity', agent_type: null },
      { role: 'agent', content: 'Great choice! Let me get your buddy.', agent_type: 'coach' },
    ];

    const result = summarizeConversation(messages);
    expect(result).toContain('5 messages');
    expect(result).toContain('Student:');
    expect(result).toContain('Agent:');
  });

  it('truncates long messages in summary', () => {
    const longContent = 'A'.repeat(200);
    const messages = [
      { role: 'agent', content: 'Hi', agent_type: 'coach' },
      { role: 'student', content: 'Hi', agent_type: null },
      { role: 'agent', content: longContent, agent_type: 'teaching_buddy' },
    ];

    const result = summarizeConversation(messages);
    expect(result).toContain('...');
  });
});
