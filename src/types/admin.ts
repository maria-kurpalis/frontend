import type { ChecklistItem, Community, FieldError, JsonValue, MoveRequest, RequestComment, RequestDocument, RequestStatus, RequestType, Resident, StatusHistory, Unit, WorkflowConfig } from './moveRequest';

export interface AdminDashboardData {
  community: Community;
  totalRequests: number; submittedRequests: number; underReviewRequests: number; needsChangesRequests: number;
  approvedRequests: number; rejectedRequests: number; completedRequests: number; moveInRequests: number; moveOutRequests: number;
  recentRequests: MoveRequest[];
}
export interface AdminRequest extends MoveRequest {
  allowedActions: AdminDecision[]; statusHistories: StatusHistory[];
  documents: RequestDocument[]; checklistItems: ChecklistItem[]; comments: RequestComment[];
  workflowConfig: WorkflowConfig | null; submittedAt: string | null; reviewedAt: string | null; reviewedBy: string | null;
}
export interface Assessment {
  id: string; recommendation: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'MANUAL_REVIEW';
  confidence: number | null; reasoning: string; issues: JsonValue | null; createdAt: string;
}
export interface AgentSummary {
  resident: Resident | null;
  requiredDocuments: { documentType: string; status: 'MISSING' | 'PENDING' | 'VERIFIED' | 'REJECTED' }[] | null;
  documentCounts: { required: number | null; uploaded: number; verified: number; rejected: number };
  checklistCounts: { completed: number; pending: number; notApplicable: number };
  moveRequestId: string; type: RequestType; status: RequestStatus; community: Community | null; unit: Unit | null;
  requestedDate: string | null; requestedTimeSlot: string | null; documentCount: number; checklistItemCount: number;
  latestAssessment: Assessment | null; validation: { errors: FieldError[]; reviewWarnings: FieldError[] };
}
export interface AuditLog {
  id: string; actorType: string; actorId: string | null; action: string; createdAt: string;
  previousValue: JsonValue | null; newValue: JsonValue | null; metadata: JsonValue | null;
}
export interface RequestFilters { status?: RequestStatus; type?: RequestType }
export type AdminDecision = 'review' | 'approve' | 'request-changes' | 'reject' | 'complete';
