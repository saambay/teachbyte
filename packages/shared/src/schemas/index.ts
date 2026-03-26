import { z } from 'zod';
import { AgentType, SessionStatus, TopicDomain, MasteryStatus } from '../types';

// ============================================================
// Enum Schemas
// ============================================================

export const AgentTypeSchema = z.nativeEnum(AgentType);
export const SessionStatusSchema = z.nativeEnum(SessionStatus);
export const TopicDomainSchema = z.nativeEnum(TopicDomain);
export const MasteryStatusSchema = z.nativeEnum(MasteryStatus);

// ============================================================
// Core Schemas
// ============================================================

export const TeachingScoreSchema = z.object({
  clarity: z.number().int().min(1).max(5),
  completeness: z.number().int().min(1).max(5),
  engagement: z.number().int().min(1).max(5),
  overall: z.number().min(1).max(5),
});

export const MessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['student', 'agent']),
  content: z.string().min(1).max(2000),
  agentType: AgentTypeSchema.optional(),
  timestamp: z.coerce.date(),
});

export const AgentInteractionSchema = z.object({
  agentType: AgentTypeSchema,
  messages: z.array(MessageSchema),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date(),
});

export const StudentSchema = z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid(),
  name: z.string().min(1).max(50),
  age: z.number().int().min(4).max(18),
  gradeLevel: z.number().int().min(0).max(12),
  avatarUrl: z.string().url().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const ParentSettingsSchema = z.object({
  notificationsEnabled: z.boolean(),
  dailySessionReminder: z.boolean(),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export const ParentSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  studentIds: z.array(z.string().uuid()),
  settings: ParentSettingsSchema,
  createdAt: z.coerce.date(),
});

export const SessionSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().optional(),
  status: SessionStatusSchema,
  topicId: z.string().uuid().optional(),
  agentInteractions: z.array(AgentInteractionSchema),
  teachingScore: TeachingScoreSchema.optional(),
  durationSeconds: z.number().int().min(0),
});

export const TopicSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  domain: TopicDomainSchema,
  description: z.string().min(1).max(1000),
  keyConcepts: z.array(z.string()).min(1).max(10),
  commonMisconceptions: z.array(z.string()).min(1).max(10),
  difficultyLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  ageRange: z.object({
    min: z.number().int().min(4),
    max: z.number().int().max(18),
  }),
  relatedTopicIds: z.array(z.string().uuid()).optional(),
});

export const StudentProgressSchema = z.object({
  studentId: z.string().uuid(),
  topicId: z.string().uuid(),
  status: MasteryStatusSchema,
  sessionsCompleted: z.number().int().min(0),
  bestTeachingScore: TeachingScoreSchema.optional(),
  lastAttemptedAt: z.coerce.date().optional(),
});

export const StreakDataSchema = z.object({
  studentId: z.string().uuid(),
  currentStreak: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  lastSessionDate: z.coerce.date().optional(),
  streakStatus: z.enum(['active', 'paused', 'broken']),
});

// ============================================================
// API Request Schemas
// ============================================================

export const DevLoginRequestSchema = z.object({
  parentId: z.string().uuid(),
});

export const StartSessionRequestSchema = z.object({
  studentId: z.string().uuid(),
});

export const SendMessageRequestSchema = z.object({
  content: z.string().min(1).max(500),
});

export const UpdateStudentRequestSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  age: z.number().int().min(4).max(18).optional(),
  gradeLevel: z.number().int().min(0).max(12).optional(),
});

export const CreateStudentRequestSchema = z.object({
  name: z.string().min(1).max(50),
  age: z.number().int().min(4).max(18),
  gradeLevel: z.number().int().min(0).max(12),
});

export const TopicListRequestSchema = z.object({
  domain: TopicDomainSchema.optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  minAge: z.number().int().min(4).optional(),
  maxAge: z.number().int().max(18).optional(),
});

export const UpdateParentSettingsRequestSchema = z.object({
  notificationsEnabled: z.boolean().optional(),
  dailySessionReminder: z.boolean().optional(),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});
