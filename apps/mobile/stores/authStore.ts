import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import { API_URL, AUTH_MODE, TEST_PARENT_ID } from '../constants/config';

interface AuthState {
  token: string | null;
  parentId: string | null;
  parentName: string | null;
  studentId: string | null;
  studentName: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  devLogin: () => Promise<void>;
  logout: () => Promise<void>;
  onboard: (data: { name: string; age: number; gradeLevel: number }) => Promise<void>;
  setStudent: (id: string, name: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  parentId: null,
  parentName: null,
  studentId: null,
  studentName: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const parentId = await SecureStore.getItemAsync('parentId');
      const parentName = await SecureStore.getItemAsync('parentName');
      const studentId = await SecureStore.getItemAsync('studentId');
      const studentName = await SecureStore.getItemAsync('studentName');

      if (token && parentId) {
        set({
          token,
          parentId,
          parentName,
          studentId,
          studentName,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  devLogin: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/auth/dev-login', {
        parentId: TEST_PARENT_ID,
      });

      const { token, parent } = response.data;

      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('parentId', parent.id);
      await SecureStore.setItemAsync('parentName', parent.name);

      // Check for existing students
      const studentsResponse = await api.get(`/api/students/${get().studentId || ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);

      set({
        token,
        parentId: parent.id,
        parentName: parent.name,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: 'Login failed. Please try again.',
      });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('parentId');
    await SecureStore.deleteItemAsync('parentName');
    await SecureStore.deleteItemAsync('studentId');
    await SecureStore.deleteItemAsync('studentName');

    set({
      token: null,
      parentId: null,
      parentName: null,
      studentId: null,
      studentName: null,
      isAuthenticated: false,
      error: null,
    });
  },

  onboard: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/students', data);
      const { student } = response.data;

      await SecureStore.setItemAsync('studentId', student.id);
      await SecureStore.setItemAsync('studentName', student.name);

      set({
        studentId: student.id,
        studentName: student.name,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: 'Failed to create student profile.',
      });
    }
  },

  setStudent: (id, name) => {
    SecureStore.setItemAsync('studentId', id);
    SecureStore.setItemAsync('studentName', name);
    set({ studentId: id, studentName: name });
  },
}));
