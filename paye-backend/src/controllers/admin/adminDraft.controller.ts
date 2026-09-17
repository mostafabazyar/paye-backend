import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createAuditLog } from "../../utils/auditLog";

const prisma = new PrismaClient();

/**
 * GET /api/admin/drafts
 *
 * Query:
 *   status    = "all" | "inProgress" | "completed" | "abandoned"  (default: all)
 *   search    = phone substring
 *   minStep   = number
 *   maxStep   = number
 *   from      = ISO date
 *   to        = ISO date
 *   page      = number (default 1)
 *   limit     = number (default 20, max 100)
 */
export const listDrafts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status = "all",
      search = "",
      minStep,
      maxStep,
      from,
      to,
      page = "1",
      limit = "20",
    } = req.query as Record<string, string>;

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(
      Math.max(parseInt(limit, 10) || 20, 1),
      100
    );
    const skip = (parsedPage - 1) * parsedLimit;

    const where: any = {};

    // status filter
    if (status === "inProgress") {
      where.completedAt = null;
      where.abandonedAt = null;
    } else if (status === "completed") {
      where.completedAt = { not: null };
    } else if (status === "abandoned") {
      where.abandonedAt = { not: null };
    }

    // search
    if (search && search.trim()) {
      where.phone = { contains: search.trim() };
    }

    // step range
    if (minStep !== undefined) {
      const n = parseInt(minStep, 10);
      if (!Number.isNaN(n)) where.lastStep = { ...(where.lastStep || {}), gte: n };
    }
    if (maxStep !== undefined) {
      const n = parseInt(maxStep, 10);
      if (!Number.isNaN(n)) where.lastStep = { ...(where.lastStep || {}), lte: n };
    }

    // date range (createdAt)
    if (from || to) {
      where.createdAt = {};
      if (from) {
        const d = new Date(String(from));
        if (!Number.isNaN(d.getTime())) where.createdAt.gte = d;
      }
      if (to) {
        const d = new Date(String(to));
        if (!Number.isNaN(d.getTime())) where.createdAt.lte = d;
      }
    }

    const [drafts, total] = await Promise.all([
      prisma.draftUser.findMany({
        where,
        skip,
        take: parsedLimit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.draftUser.count({ where }),
    ]);

    res.json({
      success: true,
      drafts,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error("listDrafts error:", error);
    res.status(500).json({ success: false, message: "Failed to load drafts" });
  }
};

/**
 * GET /api/admin/drafts/:id
 */
export const getDraftById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const draft = await prisma.draftUser.findUnique({ where: { id } });
    if (!draft) {
      res.status(404).json({ success: false, message: "Draft not found" });
      return;
    }

    res.json({ success: true, draft });
  } catch (error) {
    console.error("getDraftById error:", error);
    res.status(500).json({ success: false, message: "Failed to load draft" });
  }
};

/**
 * DELETE /api/admin/drafts/:id
 * Hard delete. Removes the CRM record entirely.
 */
export const deleteDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.draftUser.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Draft not found" });
      return;
    }

    await prisma.draftUser.delete({ where: { id } });

    const admin = (req as any).admin;
    await createAuditLog({
      adminId: admin.id,
      action: "DELETE_DRAFT",
      targetType: "DRAFT",
      targetId: id,
      metadata: { phone: existing.phone, lastStep: existing.lastStep },
      req,
    });

    res.json({ success: true, message: "Draft deleted" });
  } catch (error) {
    console.error("deleteDraft error:", error);
    res.status(500).json({ success: false, message: "Failed to delete draft" });
  }
};