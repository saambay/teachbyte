import { describe, it, expect } from 'vitest';
import { validateResponse, validateStudentMessage } from '../src/services/guardrails';

describe('validateResponse', () => {
  it('passes safe content', () => {
    const result = validateResponse(
      'That is a great explanation! Plants use sunlight to make food.',
      'Photosynthesis',
    );
    expect(result.safe).toBe(true);
    expect(result.filteredContent).toBeDefined();
  });

  it('blocks empty responses', () => {
    const result = validateResponse('');
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('Empty');
  });

  it('blocks inappropriate keywords', () => {
    const result = validateResponse('Let me tell you about weapons and violence.');
    expect(result.safe).toBe(false);
    expect(result.reason).toContain('inappropriate');
  });

  it('truncates overly long responses', () => {
    const longResponse = Array(250).fill('word').join(' ');
    const result = validateResponse(longResponse);
    expect(result.safe).toBe(true);
    expect(result.reason).toContain('truncated');
    const wordCount = result.filteredContent!.split(/\s+/).length;
    expect(wordCount).toBeLessThanOrEqual(201); // 200 + "..."
  });

  it('passes topic-relevant content', () => {
    const result = validateResponse(
      'Gravity is the force that pulls objects toward each other. The Earth has gravity that keeps us on the ground.',
      'Gravity',
    );
    expect(result.safe).toBe(true);
  });

  it('handles content without topic context', () => {
    const result = validateResponse('Hello there! How are you today?');
    expect(result.safe).toBe(true);
  });
});

describe('validateStudentMessage', () => {
  it('passes normal messages', () => {
    const result = validateStudentMessage('Plants use sunlight to make food!');
    expect(result.safe).toBe(true);
    expect(result.filteredContent).toBe('Plants use sunlight to make food!');
  });

  it('rejects empty messages', () => {
    const result = validateStudentMessage('');
    expect(result.safe).toBe(false);
  });

  it('truncates messages over 500 characters', () => {
    const longMessage = 'a'.repeat(600);
    const result = validateStudentMessage(longMessage);
    expect(result.safe).toBe(true);
    expect(result.filteredContent!.length).toBe(500);
    expect(result.reason).toContain('truncated');
  });
});
