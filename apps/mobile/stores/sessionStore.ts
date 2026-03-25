import { create } from 'zustand';
import * as sessionService from '../services/sessionService';

interface Message {
  id: string;
  role: 'student' | 'agent';
  content: string;
  agentType?: string;
  timestamp: Date;
}

interface TopicOption {
  id: string;
  title: string;
  description: string;
}

interface SessionState {
  currentSessionId: string | null;
  sessionStatus: string | null;
  messages: Message[];
  topicOptions: TopicOption[];
  isLoading: boolean;
  error: string | null;

  startSession: (studentId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  completeSession: () => Promise<{ teachingScore: unknown; summary: string } | null>;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  currentSessionId: null,
  sessionStatus: null,
  messages: [],
  topicOptions: [],
  isLoading: false,
  error: null,

  startSession: async (studentId: string) => {
    set({ isLoading: true, error: null, messages: [], topicOptions: [] });
    try {
      const result = await sessionService.startSession(studentId);
      set({
        currentSessionId: result.sessionId,
        sessionStatus: result.status,
        messages: [result.message],
        topicOptions: result.topicOptions || [],
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false, error: 'Failed to start session' });
    }
  },

  sendMessage: async (content: string) => {
    const { currentSessionId } = get();
    if (!currentSessionId) return;

    // Add student message immediately
    const studentMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'student',
      content,
      timestamp: new Date(),
    };
    set((state) => ({
      messages: [...state.messages, studentMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const result = await sessionService.sendMessage(currentSessionId, content);
      set((state) => ({
        messages: [...state.messages, result.message],
        sessionStatus: result.sessionStatus,
        topicOptions: result.topicOptions || state.topicOptions,
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false, error: 'Failed to send message' });
    }
  },

  completeSession: async () => {
    const { currentSessionId } = get();
    if (!currentSessionId) return null;

    set({ isLoading: true, error: null });
    try {
      const result = await sessionService.completeSession(currentSessionId);
      set({
        sessionStatus: 'completed',
        isLoading: false,
      });
      return result;
    } catch (error) {
      set({ isLoading: false, error: 'Failed to complete session' });
      return null;
    }
  },

  reset: () => {
    set({
      currentSessionId: null,
      sessionStatus: null,
      messages: [],
      topicOptions: [],
      isLoading: false,
      error: null,
    });
  },
}));
