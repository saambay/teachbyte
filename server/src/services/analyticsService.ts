import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export type AnalyticsEvent =
  | { type: 'session_started'; studentId: string; sessionId: string }
  | { type: 'session_completed'; studentId: string; sessionId: string; durationSeconds: number; topicId: string }
  | { type: 'topic_mastered'; studentId: string; topicId: string; sessionsToMaster: number }
  | { type: 'streak_milestone'; studentId: string; streakDays: number }
  | { type: 'challenge_attempted'; studentId: string; topicId: string; correct: boolean; difficultyLevel: number }
  | { type: 'agent_interaction'; studentId: string; agentType: string; messageCount: number }
  | { type: 'digest_generated'; parentId: string; studentId: string };

/**
 * Track an analytics event. Currently logs structured events.
 * In production, this would send to Mixpanel/Amplitude/etc.
 * No PII is included — only anonymized IDs and metrics.
 */
export function trackEvent(event: AnalyticsEvent): void {
  logger.info({ analytics: true, ...event }, `analytics:${event.type}`);
}
