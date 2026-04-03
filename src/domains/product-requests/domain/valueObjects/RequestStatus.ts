/**
 * Value Object: حالة طلب المنتج
 */

export const REQUEST_STATUS = [
  "pending",
  "approved",
  "rejected",
  "needs_revision",
] as const;

export type RequestStatus = (typeof REQUEST_STATUS)[number];

export function isValidRequestStatus(s: string): s is RequestStatus {
  return REQUEST_STATUS.includes(s as RequestStatus);
}

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "قيد المراجعة",
  approved: "موافق عليه",
  rejected: "مرفوض",
  needs_revision: "يحتاج تعديل",
};
