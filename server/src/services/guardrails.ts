import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export interface GuardrailResult {
  safe: boolean;
  filteredContent?: string;
  reason?: string;
}

const BLOCKED_KEYWORDS = [
  'kill', 'murder', 'suicide', 'weapon', 'drug', 'alcohol', 'sex',
  'porn', 'nude', 'naked', 'racist', 'slur', 'damn', 'shit', 'fuck',
  'hate speech', 'self-harm', 'self harm',
];

const MAX_WORD_COUNT = 200;

export function validateResponse(
  content: string,
  currentTopicTitle?: string,
): GuardrailResult {
  // Check for empty content
  if (!content || content.trim().length === 0) {
    return { safe: false, reason: 'Empty response' };
  }

  // Check for inappropriate content
  const lowerContent = content.toLowerCase();
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lowerContent.includes(keyword)) {
      logger.warn({ keyword }, 'Guardrail: blocked keyword detected');
      return {
        safe: false,
        reason: `Response contains inappropriate content`,
      };
    }
  }

  // Check response length
  const wordCount = content.split(/\s+/).length;
  if (wordCount > MAX_WORD_COUNT) {
    // Truncate rather than reject
    const words = content.split(/\s+/).slice(0, MAX_WORD_COUNT);
    const truncated = words.join(' ') + '...';
    logger.warn({ wordCount, maxWords: MAX_WORD_COUNT }, 'Guardrail: response truncated');
    return {
      safe: true,
      filteredContent: truncated,
      reason: 'Response truncated for length',
    };
  }

  // Basic off-topic detection
  if (currentTopicTitle) {
    const topicWords = currentTopicTitle.toLowerCase().split(/\s+/);
    const hasTopicReference = topicWords.some((word) =>
      word.length > 3 && lowerContent.includes(word)
    );

    // Only flag if the response is long enough that we'd expect topic relevance
    if (!hasTopicReference && wordCount > 30) {
      logger.warn({ currentTopicTitle }, 'Guardrail: potential off-topic response');
      // Don't block — just log. The agent prompt should handle this.
    }
  }

  return { safe: true, filteredContent: content };
}

export function validateStudentMessage(content: string): GuardrailResult {
  if (!content || content.trim().length === 0) {
    return { safe: false, reason: 'Empty message' };
  }

  if (content.length > 500) {
    return {
      safe: true,
      filteredContent: content.slice(0, 500),
      reason: 'Message truncated to 500 characters',
    };
  }

  return { safe: true, filteredContent: content };
}
