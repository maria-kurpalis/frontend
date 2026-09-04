import { http, getData as get } from './http';
import type { ApiResponse, MoveRequest, RequestType, ResidentDashboardData, ResidentNotification, RequestProgressData, UpdateMoveRequest, RequestDocument, StatusHistory, RequestComment } from '../types/moveRequest';

const requestPath = (id: string) => `/move-requests/${encodeURIComponent(id)}`;

export const moveRequestApi = {
  dashboard: (residentId: string) => get<ResidentDashboardData>(`/residents/${encodeURIComponent(residentId)}/dashboard`),
  create: async (residentId: string, type: RequestType) => (await http.post<ApiResponse<MoveRequest>>('/move-requests', { residentId, type })).data.data,
  details: (id: string) => get<MoveRequest>(requestPath(id)),
  progress: (id: string) => get<RequestProgressData>(`${requestPath(id)}/progress`),
  update: async (id: string, input: UpdateMoveRequest) => (await http.patch<ApiResponse<MoveRequest>>(requestPath(id), input)).data.data,
  submit: async (id: string) => (await http.post<ApiResponse<MoveRequest>>(`${requestPath(id)}/submit`)).data.data,
  cancel: async (id: string, residentId: string, reason: string) => (await http.post<ApiResponse<MoveRequest>>(`${requestPath(id)}/cancel`, { residentId, reason })).data.data,
  documents: (id: string) => get<RequestDocument[]>(`${requestPath(id)}/documents`),
  addDocument: async (id: string, documentType: string, fileUrl: string) => (await http.post<ApiResponse<RequestDocument>>(`${requestPath(id)}/documents`, { documentType, fileUrl })).data.data,
  replaceDocument: async (id: string, documentId: string, fileUrl: string) => (await http.patch<ApiResponse<RequestDocument>>(`${requestPath(id)}/documents/${encodeURIComponent(documentId)}`, { fileUrl })).data.data,
  deleteDocument: async (id: string, documentId: string) => (await http.delete<ApiResponse<{ id: string }>>(`${requestPath(id)}/documents/${encodeURIComponent(documentId)}`)).data.data,
  history: (id: string) => get<StatusHistory[]>(`${requestPath(id)}/status-history`),
  comments: (id: string) => get<RequestComment[]>(`${requestPath(id)}/comments`),
  addComment: async (id: string, residentId: string, comment: string) => (await http.post<ApiResponse<RequestComment>>(`${requestPath(id)}/comments`, { residentId, comment })).data.data,
  notifications: (residentId: string) => get<ResidentNotification[]>(`/residents/${encodeURIComponent(residentId)}/notifications`),
};

export async function loadRequestPage(id: string, residentId: string) {
  const request = await moveRequestApi.details(id);
  if (request.residentId.toLowerCase() !== residentId.toLowerCase()) throw new Error('This move request belongs to a different resident. Open your own request from the dashboard.');
  const [progress, documents, history, comments] = await Promise.all([
    moveRequestApi.progress(id), moveRequestApi.documents(id), moveRequestApi.history(id), moveRequestApi.comments(id),
  ]);
  return { request, progress, documents, history, comments };
}
