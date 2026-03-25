import { create } from 'zustand';
import { getItem, setItem, deleteItem } from '../utils/storage';
import api from '../services/api';
import { TEST_PARENT_ID } from '../constants/config';

const TEST_STUDENT_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

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
      const token = await getItem('authToken');
      const parentId = await getItem('parentId');
      const parentName = await getItem('parentName');
      const studentId = await getItem('studentId');
      const studentName = await getItem('studentName');

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

      await setItem('authToken', token);
      await setItem('parentId', parent.id);
      await setItem('parentName', parent.name);

      // In dev mode, load the test student directly
      try {
        const studentResponse = await api.get(`/api/students/${TEST_STUDENT_ID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const student = studentResponse.data;
        await setItem('studentId', student.id);
        await setItem('studentName', student.name);

        set({
          token,
          parentId: parent.id,
          parentName: parent.name,
          studentId: student.id,
          studentName: student.name,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        // No student yet — will redirect to onboard
        set({
          token,
          parentId: parent.id,
          parentName: parent.name,
          isAuthenticated: true,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        isLoading: false,
        error: 'Login failed. Please try again.',
      });
    }
  },

  logout: async () => {
    await deleteItem('authToken');
    await deleteItem('parentId');
    await deleteItem('parentName');
    await deleteItem('studentId');
    await deleteItem('studentName');

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

      await setItem('studentId', student.id);
      await setItem('studentName', student.name);

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
    setItem('studentId', id);
    setItem('studentName', name);
    set({ studentId: id, studentName: name });
  },
}));
