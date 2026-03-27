import api from './api';

export async function getTopics(filters?: {
  domain?: string;
  difficulty?: number;
  minAge?: number;
  maxAge?: number;
}) {
  const response = await api.get('/api/topics', { params: filters });
  return response.data;
}

export async function getTopic(topicId: string) {
  const response = await api.get(`/api/topics/${topicId}`);
  return response.data;
}

export async function getRecommendedTopics(studentId: string) {
  const response = await api.get(`/api/topics/recommended/${studentId}`);
  return response.data;
}

export async function getStudentProgress(studentId: string) {
  const response = await api.get(`/api/students/${studentId}/progress`);
  return response.data;
}

export async function getStudentStreak(studentId: string) {
  const response = await api.get(`/api/students/${studentId}/streak`);
  return response.data;
}

export async function getWeeklyDigest(studentId: string) {
  const response = await api.get(`/api/parent/digest/${studentId}`);
  return response.data;
}
