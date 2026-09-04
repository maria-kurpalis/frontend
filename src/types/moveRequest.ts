export type RequestType = 'MOVE_IN' | 'MOVE_OUT';
export type RequestStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'NEEDS_CHANGES' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export interface FieldError { field: string; message: string }
export interface ApiResponse<T> { success: true; data: T }
export interface Pagination { page: number; limit: number; total: number; totalPages: number }
export interface Resident { id: string; name: string; email?: string; phone?: string; residentType?: 'OWNER' | 'TENANT' }
export interface Community { id: string; name: string; code: string }
export interface Unit { id: string; unitNumber: string; tower: string | null; floor: number | null }
export interface MoveDetails {
  vehicleCount: number | null; vehicleDetails: JsonValue[] | { [key: string]: JsonValue } | null;
  occupantCount: number | null; notes: string | null;
}
export interface MoveRequest {
  id: string; residentId: string; communityId: string; unitId: string;
  type: RequestType; status: RequestStatus; requestedDate: string | null; requestedTimeSlot: string | null;
  createdAt: string; updatedAt: string; rejectionReason?: string | null;
  resident?: Resident; community?: Community; unit?: Unit; details?: MoveDetails | null;
}
export interface ResidentDashboardData {
  resident: Pick<Resident, 'id' | 'name'>; community: Community | null; unit: Unit | null;
  totalRequests: number; draftRequests: number; needsChangesRequests: number; approvedRequests: number;
  submittedRequests: number; rejectedRequests: number; completedRequests: number; recentRequests: MoveRequest[];
}
export interface WorkflowConfig {
  requiredFields: string[]; requiredDocuments: string[]; allowedDays: string[];
  allowedTimeSlots: { start: string; end: string }[]; instructions: string;
}
export interface RequestDocument {
  verifiedBy?: string | null; verifiedAt?: string | null; verifier?: { id: string; name: string } | null;
  id: string; documentType: string; fileUrl: string; status: 'PENDING' | 'VERIFIED' | 'REJECTED'; uploadedAt: string;
}
export interface ChecklistItem { id: string; key: string; label: string; status: 'PENDING' | 'COMPLETED' | 'NOT_APPLICABLE' }
export interface ProgressItem { key: string; completed: boolean }
export interface RequestProgressData {
  canCancel: boolean;
  workflowConfig: WorkflowConfig | null;
  sections: {
    moveDetails: { completed: boolean; items: ProgressItem[] };
    documents: { completed: boolean; items: ProgressItem[] };
    checklist: { completed: boolean; items: ChecklistItem[] };
  };
  missingFields: string[]; missingDocuments: string[]; errors: FieldError[]; readyToSubmit: boolean;
}
export interface StatusHistory {
  id: string; fromStatus: RequestStatus | null; toStatus: RequestStatus; changedByType: string;
  changedById: string | null; reason: string | null; createdAt: string;
}
export interface RequestComment { id: string; authorType: 'RESIDENT' | 'ADMIN' | 'AGENT'; comment: string; createdAt: string }
export interface ResidentNotification {
  id: string; moveRequestId: string | null; title: string; message: string; createdAt: string;
  channel: 'IN_APP' | 'EMAIL'; status: 'PENDING' | 'SENT' | 'FAILED';
}
export interface Conversation { id: string; role: 'USER' | 'AGENT' | 'ADMIN'; message: string; createdAt: string }
export type UpdateMoveRequest = Partial<MoveDetails & Pick<MoveRequest, 'requestedDate' | 'requestedTimeSlot'>>;
export interface ChatResponse {
  message: string; extractedFields: UpdateMoveRequest; appliedFields: UpdateMoveRequest;
  missingFields: string[]; requiresClarification: boolean; validationErrors: FieldError[]; conversationId: string;
}
export type RunAction = (operation: () => Promise<unknown>, successMessage: string) => Promise<boolean>;
