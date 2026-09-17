import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createAuditLog } from "../utils/auditLog";

const prisma = new PrismaClient();

/* ------------------------------------------------------------------ *
 * PUBLIC
 * ------------------------------------------------------------------ */

/**
 * GET /api/sports
 * Returns active sports, ordered. Used by the frontend wizard.
 */
export const listSports = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sports = await prisma.sport.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        category: true,
      },
    });

    res.json({ success: true, sports });
  } catch (error) {
    console.error("listSports error:", error);
    res.status(500).json({ success: false, message: "Failed to load sports" });
  }
};

/* ------------------------------------------------------------------ *
 * ADMIN
 * ------------------------------------------------------------------ */

/**
 * GET /api/admin/sports
 * Admin view — includes inactive sports.
 */
export const listSportsAdmin = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sports = await prisma.sport.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    res.json({ success: true, count: sports.length, sports });
  } catch (error) {
    console.error("listSportsAdmin error:", error);
    res.status(500).json({ success: false, message: "Failed to load sports" });
  }
};

/**
 * POST /api/admin/sports
 * Body: { name, slug?, icon?, category?, sortOrder? }
 */
export const createSport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, icon, category, sortOrder } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ success: false, message: "Name is required" });
      return;
    }

    const finalSlug =
      typeof slug === "string" && slug.trim()
        ? slug.trim().toLowerCase()
        : name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    if (!finalSlug) {
      res.status(400).json({ success: false, message: "Could not derive a valid slug" });
      return;
    }

    const exists = await prisma.sport.findFirst({
      where: { OR: [{ name: name.trim() }, { slug: finalSlug }] },
    });

    if (exists) {
      res.status(409).json({
        success: false,
        message: "A sport with this name or slug already exists",
      });
      return;
    }

    const admin = (req as any).admin;

    const sport = await prisma.sport.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        icon: typeof icon === "string" ? icon.trim() : null,
        category: typeof category === "string" ? category.trim() : null,
        sortOrder: Number.isInteger(sortOrder) ? sortOrder : 0,
        createdBy: admin?.userId ?? null,
      },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "CREATE_SPORT",
      targetType: "SPORT",
      targetId: sport.id,
      metadata: { name: sport.name, slug: sport.slug },
      req,
    });

    res.status(201).json({ success: true, message: "Sport created", sport });
  } catch (error) {
    console.error("createSport error:", error);
    res.status(500).json({ success: false, message: "Failed to create sport" });
  }
};

/**
 * PATCH /api/admin/sports/:id
 * Body: any subset of { name, icon, category, sortOrder, isActive }
 */
export const updateSport = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.sport.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Sport not found" });
      return;
    }

    const { name, icon, category, sortOrder, isActive } = req.body;
    const data: any = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json({ success: false, message: "Invalid name" });
        return;
      }
      data.name = name.trim();
    }

    if (icon !== undefined) {
      data.icon = icon === null ? null : String(icon).trim();
    }

    if (category !== undefined) {
      data.category = category === null ? null : String(category).trim();
    }

    if (sortOrder !== undefined) {
      if (!Number.isInteger(sortOrder)) {
        res.status(400).json({ success: false, message: "sortOrder must be an integer" });
        return;
      }
      data.sortOrder = sortOrder;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        res.status(400).json({ success: false, message: "isActive must be a boolean" });
        return;
      }
      data.isActive = isActive;
    }

    if (Object.keys(data).length === 0) {
      res.status(400).json({ success: false, message: "No fields to update" });
      return;
    }

    const sport = await prisma.sport.update({ where: { id }, data });

    const admin = (req as any).admin;
    await createAuditLog({
      adminId: admin.id,
      action: "UPDATE_SPORT",
      targetType: "SPORT",
      targetId: sport.id,
      metadata: { changed: Object.keys(data) },
      req,
    });

    res.json({ success: true, message: "Sport updated", sport });
  } catch (error) {
    console.error("updateSport error:", error);
    res.status(500).json({ success: false, message: "Failed to update sport" });
  }
};

/**
 * DELETE /api/admin/sports/:id
 * Super admin only.
 */
export const deleteSport = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const admin = (req as any).admin;
    if (!admin?.isSuperAdmin) {
      res.status(403).json({
        success: false,
        message: "Only super admins can delete sports",
      });
      return;
    }

    const existing = await prisma.sport.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: "Sport not found" });
      return;
    }

    if (existing._count.users > 0) {
      res.status(409).json({
        success: false,
        message:
          "Cannot delete a sport that is linked to users. Deactivate it instead.",
        data: { linkedUsers: existing._count.users },
      });
      return;
    }

    await prisma.sport.delete({ where: { id } });

    await createAuditLog({
      adminId: admin.id,
      action: "DELETE_SPORT",
      targetType: "SPORT",
      targetId: id,
      metadata: { name: existing.name, slug: existing.slug },
      req,
    });

    res.json({ success: true, message: "Sport deleted" });
  } catch (error) {
    console.error("deleteSport error:", error);
    res.status(500).json({ success: false, message: "Failed to delete sport" });
  }
};