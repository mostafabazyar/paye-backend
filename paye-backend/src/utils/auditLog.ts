import { PrismaClient, Prisma  } from "@prisma/client";
import { Request } from "express";

const prisma = new PrismaClient();

export type AuditAction =
  | "ADMIN_LOGIN"
  | "CREATE_ADMIN"
  | "DELETE_ADMIN"
  | "CREATE_USER"
  | "UPDATE_USER"
  | "BLOCK_USER"
  | "UNBLOCK_USER"
  | "VERIFY_USER"
  | "UNVERIFY_USER"
  | "DELETE_USER"
  | "UPDATE_LISTING"
  | "CLOSE_LISTING"
  | "REACTIVATE_LISTING"
  | "DELETE_LISTING"
  | "APPROVE_REQUEST"
  | "REJECT_REQUEST"
  | "PENDING_REQUEST"
  | "DELETE_REQUEST"
  | "IMPERSONATE_USER";

export type AuditTargetType =
  | "ADMIN"
  | "USER"
  | "LISTING"
  | "REQUEST";

interface CreateAuditLogParams {
  adminId: string;
  action: AuditAction;
  targetType?: AuditTargetType;
  targetId?: string | number;
  metadata?: Record<string, unknown>;
  req?: Request;
}

const getClientIp = (req: Request): string | null => {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0];
  }

  return req.socket.remoteAddress || null;
};

export const createAuditLog = async ({
  adminId,
  action,
  targetType,
  targetId,
  metadata,
  req,
}: CreateAuditLogParams): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId:
          targetId !== undefined && targetId !== null
            ? String(targetId)
            : undefined,
        // ✅ Cast to Prisma.InputJsonValue
        metadata:
          metadata !== undefined
            ? (metadata as Prisma.InputJsonValue)
            : undefined,
        ipAddress: req ? getClientIp(req) : null,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
};