import { http } from './http';
import axios from 'axios';
import type { ApiResponse, ChatResponse, Conversation, Pagination } from '../types/moveRequest';

export const assistantUnavailableMessage = 'The assistant is temporarily unavailable. You can continue by filling in the request details manually.';
export class AssistantUnavailableError extends Error {
  constructor() { super(assistantUnavailableMessage); }
}

export const agentApi = {
  history: async (id: string, residentId: string, page = 1) => (await http.get<ApiResponse<Conversation[]> & { pagination: Pagination }>(
    `/move-requests/${encodeURIComponent(id)}/agent-conversations`, { params: { residentId, page, limit: 20 } },
  )).data,
  chat: async (id: string, residentId: string, message: string): Promise<ChatResponse> => {
    try {
      return (await http.post<ApiResponse<ChatResponse>>(`/agent/move-requests/${encodeURIComponent(id)}/chat`, { residentId, message })).data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && (!error.response || error.response.status >= 500 || error.response.status === 429)) throw new AssistantUnavailableError();
      throw error;
    }
  },
  health: async () => (await http.get<{ agentConfigured: boolean; provider: string | null }>('/agent/health')).data,
};
