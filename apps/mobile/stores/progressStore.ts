import { create } from 'zustand';
import * as topicService from '../services/topicService';

interface TopicProgress {
  topicId: string;
  topicTitle: string;
  status: string;
  sessionsCompleted: number;
  bestOverall?: number;
}

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string | null;
  streakStatus: string;
}

interface ProgressState {
  progress: TopicProgress[];
  streak: StreakInfo | null;
  isLoading: boolean;

  fetchProgress: (studentId: string) => Promise<void>;
  fetchStreak: (studentId: string) => Promise<void>;
}

export const useProgressStore = create<ProgressState>((set) => ({
  progress: [],
  streak: null,
  isLoading: false,

  fetchProgress: async (studentId: string) => {
    set({ isLoading: true });
    try {
      const data = await topicService.getStudentProgress(studentId);
      const progress = (data.progress || []).map((p: Record<string, unknown>) => ({
        topicId: p.topic_id,
        topicTitle: (p as { topic?: { title?: string } }).topic?.title || 'Unknown',
        status: p.status,
        sessionsCompleted: p.sessions_completed,
        bestOverall: p.best_overall,
      }));
      set({ progress, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchStreak: async (studentId: string) => {
    try {
      const streak = await topicService.getStudentStreak(studentId);
      set({
        streak: {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastSessionDate: streak.lastSessionDate,
          streakStatus: streak.streakStatus,
        },
      });
    } catch {
      // Streak data not critical
    }
  },
}));
