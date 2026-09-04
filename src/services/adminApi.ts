import { getData, http, isMissingAssessment } from './http';
import axios from 'axios';
import type { AdminDashboardData, AdminDecision, AdminRequest, AgentSummary, Assessment, AuditLog, RequestFilters } from '../types/admin';
import type { ApiResponse, ChecklistItem, MoveRequest, RequestDocument, RequestComment, ResidentNotification, RequestType, WorkflowConfig } from '../types/moveRequest';

const path = (id: string) => `/admin/move-requests/${encodeURIComponent(id)}`;
export const adminApi = {
  dashboard: (communityId: string) => getData<AdminDashboardData>(`/admin/communities/${encodeURIComponent(communityId)}/dashboard`),
  requests: (communityId: string, filters: RequestFilters) => getData<MoveRequest[]>(`/admin/communities/${encodeURIComponent(communityId)}/move-requests`, filters),
  details: (id: string, adminId: string) => getData<AdminRequest>(path(id), { adminId }),
  notifications: (adminId: string) => getData<ResidentNotification[]>(`/admin/${encodeURIComponent(adminId)}/notifications`),
  workflowConfig: async (communityId: string, type: RequestType): Promise<WorkflowConfig | null> => {
    try { return await getData<WorkflowConfig>(`/communities/${encodeURIComponent(communityId)}/workflow-config/${type}`); }
    catch (error) {
      if (axios.isAxiosError<{ errors?: { field: string }[] }>(error) && error.response?.status === 404 && error.response.data.errors?.some((item) => item.field === 'workflowConfig')) return null;
      throw error;
    }
  },
  saveWorkflowConfig: async (communityId: string, adminId: string, type: RequestType, config: WorkflowConfig) =>
    (await http.put<ApiResponse<WorkflowConfig>>(`/admin/communities/${encodeURIComponent(communityId)}/workflow-config/${type}`, {
      adminId, requiredFields: config.requiredFields, requiredDocuments: config.requiredDocuments,
      allowedDays: config.allowedDays, allowedTimeSlots: config.allowedTimeSlots, instructions: config.instructions,
    })).data.data,
  auditLogs: (id: string, adminId: string) => getData<AuditLog[]>(`${path(id)}/audit-logs`, { adminId }),
  summary: (id: string, adminId: string) => getData<AgentSummary>(`${path(id)}/agent-summary`, { adminId }),
  latestAssessment: async (id: string, adminId: string): Promise<Assessment | null> => {
    try { return await getData<Assessment>(`${path(id)}/agent-assessment`, { adminId }); }
    catch (error) { if (isMissingAssessment(error)) return null; throw error; }
  },
  assess: async (id: string, adminId: string) => {
    try { return (await http.post<ApiResponse<Assessment>>(`${path(id)}/agent-assessment`, { adminId })).data.data; }
    catch (error) {
      if (axios.isAxiosError(error) && (!error.response || error.response.status >= 500 || error.response.status === 429))
        throw new Error('AI assessment is temporarily unavailable. Continue reviewing manually or retry. The assessment does not change request status.');
      throw error;
    }
  },
  decide: async (id: string, adminId: string, action: AdminDecision, text?: string) => (await http.post<ApiResponse<MoveRequest>>(`${path(id)}/${action}`, {
    adminId, ...(text?.trim() ? { [action === 'reject' || action === 'request-changes' ? 'reason' : 'comment']: text.trim() } : {}),
  })).data.data,
  verifyDocument: async (id: string, adminId: string, documentId: string) => (await http.post<ApiResponse<RequestDocument>>(`${path(id)}/documents/${encodeURIComponent(documentId)}/verify`, { adminId })).data.data,
  rejectDocument: async (id: string, adminId: string, documentId: string, reason: string) => (await http.post<ApiResponse<RequestDocument>>(`${path(id)}/documents/${encodeURIComponent(documentId)}/reject`, { adminId, reason })).data.data,
  updateChecklist: async (id: string, adminId: string, checklistId: string, status: ChecklistItem['status']) => (await http.patch<ApiResponse<ChecklistItem>>(`${path(id)}/checklist/${encodeURIComponent(checklistId)}`, { adminId, status })).data.data,
  comment: async (id: string, adminId: string, comment: string) => (await http.post<ApiResponse<RequestComment>>(`/move-requests/${encodeURIComponent(id)}/comments/admin`, { adminId, comment })).data.data,
};

export async function loadAdminRequest(id: string, adminId: string) {
  const request = await adminApi.details(id, adminId);
  return { request, history: request.statusHistories, comments: request.comments };
}
