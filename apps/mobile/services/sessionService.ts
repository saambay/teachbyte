import api from './api';

export async function startSession(studentId: string) {
  const response = await api.post('/api/sessions/start', { studentId });
  return response.data;
}

export async function sendMessage(sessionId: string, content: string) {
  const response = await api.post(`/api/sessions/${sessionId}/message`, { content });
  return response.data;
}

export async function completeSession(sessionId: string) {
  const response = await api.post(`/api/sessions/${sessionId}/complete`);
  return response.data;
}

export async function getSession(sessionId: string) {
  const response = await api.get(`/api/sessions/${sessionId}`);
  return response.data;
}

export async function getSessionHistory(studentId: string, page = 1, pageSize = 10) {
  const response = await api.get(`/api/sessions/history/${studentId}`, {
    params: { page, pageSize },
  });
  return response.data;
}
