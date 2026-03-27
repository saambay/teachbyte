// ============================================================
// Enums
// ============================================================

export enum AgentType {
  COACH = 'coach',
  TEACHING_BUDDY = 'teaching_buddy',
  EXPLORER = 'explorer',
  CHALLENGER = 'challenger',
  STORYTELLER = 'storyteller',
}

export enum SessionStatus {
  IDLE = 'idle',
  STARTING = 'starting',
  COACH_GREETING = 'coach_greeting',
  TOPIC_SELECTION = 'topic_selection',
  EXPLORING = 'exploring',
  TEACHING = 'teaching',
  COACH_SUMMARY = 'coach_summary',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

export enum TopicRelationshipType {
  PREREQUISITE = 'prerequisite',
  RELATED = 'related',
  BUILDS_ON = 'builds_on',
}

export enum TopicDomain {
  SCIENCE = 'science',
  MATH = 'math',
  READING = 'reading',
  GENERAL = 'general',
}

export enum MasteryStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  MASTERED = 'mastered',
}

// ============================================================
// Core Interfaces
// ============================================================

export interface Student {
  id: string;
  parentId: string;
  name: string;
  age: number;
  gradeLevel: number;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParentSettings {
  notificationsEnabled: boolean;
  dailySessionReminder: boolean;
  reminderTime?: string; // HH:MM format
}

export interface Parent {
  id: string;
  email: string;
  name: string;
  studentIds: string[];
  settings: ParentSettings;
  createdAt: Date;
}

export interface TeachingScore {
  clarity: number;       // 1-5
  completeness: number;  // 1-5
  engagement: number;    // 1-5
  overall: number;       // Weighted average
}

export interface Message {
  id: string;
  role: 'student' | 'agent';
  content: string;
  agentType?: AgentType;
  timestamp: Date;
}

export interface AgentInteraction {
  agentType: AgentType;
  messages: Message[];
  startedAt: Date;
  endedAt: Date;
}

export interface Session {
  id: string;
  studentId: string;
  startedAt: Date;
  endedAt?: Date;
  status: SessionStatus;
  topicId?: string;
  agentInteractions: AgentInteraction[];
  teachingScore?: TeachingScore;
  durationSeconds: number;
}

export interface MicroLesson {
  explainerPoints: string[];
  funFacts: string[];
  visualDescriptions: string[];
}

export interface TopicRelationship {
  id: string;
  topicId: string;
  relatedTopicId: string;
  relationshipType: TopicRelationshipType;
}

export interface Topic {
  id: string;
  title: string;
  domain: TopicDomain;
  description: string;
  keyConcepts: string[];
  commonMisconceptions: string[];
  difficultyLevel: 1 | 2 | 3;
  ageRange: { min: number; max: number };
  relatedTopicIds?: string[];
  microLesson?: MicroLesson;
}

export interface StudentProgress {
  studentId: string;
  topicId: string;
  status: MasteryStatus;
  sessionsCompleted: number;
  bestTeachingScore?: TeachingScore;
  lastAttemptedAt?: Date;
}

export interface StreakData {
  studentId: string;
  currentStreak: number;
  longestStreak: number;
  lastSessionDate?: Date;
  streakStatus: 'active' | 'paused' | 'broken';
}

// ============================================================
// API Request/Response Types
// ============================================================

// Auth
export interface DevLoginRequest {
  parentId: string;
}

export interface DevLoginResponse {
  token: string;
  parent: Pick<Parent, 'id' | 'email' | 'name'>;
}

// Sessions
export interface StartSessionRequest {
  studentId: string;
}

export interface StartSessionResponse {
  sessionId: string;
  status: SessionStatus;
  message: Message;
}

export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  message: Message;
  sessionStatus: SessionStatus;
  topicOptions?: Pick<Topic, 'id' | 'title' | 'description'>[];
}

export interface CompleteSessionResponse {
  session: Session;
  teachingScore: TeachingScore;
  streakData: StreakData;
}

export interface SessionHistoryResponse {
  sessions: Session[];
  total: number;
  page: number;
  pageSize: number;
}

// Students
export interface UpdateStudentRequest {
  name?: string;
  age?: number;
  gradeLevel?: number;
}

export interface StudentProgressResponse {
  progress: StudentProgress[];
}

// Topics
export interface TopicListRequest {
  domain?: TopicDomain;
  difficulty?: 1 | 2 | 3;
  minAge?: number;
  maxAge?: number;
}

export interface RecommendedTopicsResponse {
  topics: Topic[];
}

// Parent Dashboard
export interface ParentDashboardResponse {
  recentSessions: Session[];
  topicProgress: StudentProgress[];
  streakData: StreakData;
  totalTimeThisWeekSeconds: number;
}

export interface UpdateParentSettingsRequest {
  notificationsEnabled?: boolean;
  dailySessionReminder?: boolean;
  reminderTime?: string;
}

// Onboarding
export interface CreateStudentRequest {
  name: string;
  age: number;
  gradeLevel: number;
}

export interface CreateStudentResponse {
  student: Student;
}

// Phase 2: Explorer + Topic Graph
export interface ExplorerMicroLessonResponse {
  microLesson: MicroLesson;
  connections: string[];
}

export interface TopicGraphResponse {
  topic: Topic;
  relationships: TopicRelationship[];
}
