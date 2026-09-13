export const AUDIT_ACTIONS = [
  "ADMIN_LOGIN",
  "CREATE_ADMIN",
  "DELETE_ADMIN",
  "CREATE_USER",
  "UPDATE_USER",
  "BLOCK_USER",
  "UNBLOCK_USER",
  "VERIFY_USER",
  "UNVERIFY_USER",
  "DELETE_USER",
  "UPDATE_LISTING",
  "CLOSE_LISTING",
  "REACTIVATE_LISTING",
  "DELETE_LISTING",
  "APPROVE_REQUEST",
  "REJECT_REQUEST",
  "PENDING_REQUEST",
  "DELETE_REQUEST",
  "IMPERSONATE_USER",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_TARGET_TYPES = [
  "ADMIN",
  "USER",
  "LISTING",
  "REQUEST",
] as const;

export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[number];

/**
 * Color-code each action group so the table is easy to scan.
 */
export function actionVariant(
  action: string
): "success" | "danger" | "warning" | "info" | "muted" {
  if (action.startsWith("DELETE_")) return "danger";
  if (action.startsWith("CREATE_")) return "success";
  if (action.startsWith("UPDATE_")) return "info";
  if (action === "IMPERSONATE_USER") return "warning";
  if (action === "ADMIN_LOGIN") return "muted";
  if (action.startsWith("BLOCK_") || action.startsWith("REJECT_"))
    return "danger";
  if (action.startsWith("APPROVE_") || action.startsWith("VERIFY_"))
    return "success";
  return "muted";
}