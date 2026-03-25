import { randomUUID } from 'crypto';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// ============================================================
// Types
// ============================================================

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  agentType: string;
  systemPrompt: string;
  messages: AIMessage[];
  maxTokens?: number;
  requestId?: string;
}

export interface AIResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

type LLMProvider = 'anthropic' | 'ollama' | 'mock';

// ============================================================
// Provider Implementations
// ============================================================

async function callAnthropic(request: AIRequest): Promise<AIResponse> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: request.maxTokens || 500,
    system: request.systemPrompt,
    messages: request.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  return {
    content: textBlock?.text || '',
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}

async function callOllama(request: AIRequest): Promise<AIResponse> {
  const { default: OpenAI } = await import('openai');
  const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const client = new OpenAI({
    baseURL: `${baseURL}/v1`,
    apiKey: 'ollama', // Ollama doesn't need a real key
  });

  const model = process.env.OLLAMA_MODEL || 'qwen3.5:27b';

  const response = await client.chat.completions.create({
    model,
    max_tokens: request.maxTokens || 500,
    messages: [
      { role: 'system', content: request.systemPrompt },
      ...request.messages,
    ],
  });

  const content = response.choices[0]?.message?.content || '';
  return {
    content,
    usage: {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
    },
  };
}

const MOCK_RESPONSES: Record<string, string[]> = {
  coach: [
    "Hey there! Welcome back to TeachByte! Ready to teach something awesome today?",
    "Great choice! Let me find your Teaching Buddy — they really need your help understanding this topic!",
    "Amazing job today! You explained that really well. Your buddy learned a lot from you!",
  ],
  teaching_buddy: [
    "Oh wow, I heard about this but I don't really get it. Can you explain it to me?",
    "Hmm, that's interesting! But wait — I thought it worked differently. Can you tell me more?",
    "Oh I think I'm starting to understand! So you're saying that... actually, can you explain that part again?",
    "That makes so much sense now! You're a great teacher! I have one more question though...",
  ],
};

let mockIndex: Record<string, number> = {};

function callMock(request: AIRequest): AIResponse {
  const responses = MOCK_RESPONSES[request.agentType] || MOCK_RESPONSES['coach'];
  const key = request.agentType;
  if (!(key in mockIndex)) {
    mockIndex[key] = 0;
  }
  const content = responses[mockIndex[key] % responses.length];
  mockIndex[key]++;

  return {
    content,
    usage: { inputTokens: 100, outputTokens: 50 },
  };
}

export function resetMockState(): void {
  mockIndex = {};
}

// ============================================================
// Gateway
// ============================================================

function getProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER || 'ollama';
  if (!['anthropic', 'ollama', 'mock'].includes(provider)) {
    throw new Error(`Unknown LLM provider: ${provider}`);
  }
  return provider as LLMProvider;
}

async function callProvider(request: AIRequest): Promise<AIResponse> {
  const provider = getProvider();

  switch (provider) {
    case 'anthropic':
      return callAnthropic(request);
    case 'ollama':
      return callOllama(request);
    case 'mock':
      return callMock(request);
  }
}

export async function sendAIRequest(request: AIRequest): Promise<AIResponse> {
  const requestId = request.requestId || randomUUID();
  const provider = getProvider();
  const startTime = Date.now();

  logger.info({
    requestId,
    agentType: request.agentType,
    provider,
    messageCount: request.messages.length,
  }, 'AI request started');

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await callProvider({ ...request, requestId });

      const elapsed = Date.now() - startTime;
      logger.info({
        requestId,
        agentType: request.agentType,
        provider,
        attempt,
        elapsed,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
      }, 'AI request completed');

      return response;
    } catch (error) {
      lastError = error;
      logger.warn({
        requestId,
        agentType: request.agentType,
        provider,
        attempt,
        error: error instanceof Error ? error.message : String(error),
      }, 'AI request failed, retrying');

      if (attempt < 1) {
        // Exponential backoff: 1s for first retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  logger.error({
    requestId,
    agentType: request.agentType,
    provider,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  }, 'AI request failed after retries');

  throw lastError;
}
