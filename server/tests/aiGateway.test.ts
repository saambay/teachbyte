import { describe, it, expect, beforeEach } from 'vitest';
import { sendAIRequest, resetMockState } from '../src/services/aiGateway';

// Set mock provider for tests
process.env.LLM_PROVIDER = 'mock';

describe('AI Gateway (mock provider)', () => {
  beforeEach(() => {
    resetMockState();
  });

  it('returns a response from the mock provider', async () => {
    const response = await sendAIRequest({
      agentType: 'coach',
      systemPrompt: 'You are a coach.',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(response.content).toBeTruthy();
    expect(response.usage.inputTokens).toBeGreaterThan(0);
    expect(response.usage.outputTokens).toBeGreaterThan(0);
  });

  it('cycles through mock responses', async () => {
    const response1 = await sendAIRequest({
      agentType: 'teaching_buddy',
      systemPrompt: 'You are buddy.',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    const response2 = await sendAIRequest({
      agentType: 'teaching_buddy',
      systemPrompt: 'You are buddy.',
      messages: [{ role: 'user', content: 'Tell me more' }],
    });

    expect(response1.content).not.toBe(response2.content);
  });

  it('uses coach responses for unknown agent types', async () => {
    const response = await sendAIRequest({
      agentType: 'unknown_agent',
      systemPrompt: 'You are unknown.',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(response.content).toBeTruthy();
  });
});
