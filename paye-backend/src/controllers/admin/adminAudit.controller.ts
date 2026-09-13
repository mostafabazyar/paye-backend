import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/admin/audit-logs
 *
 * Query:
 * page
 * limit
 * action
 * adminId
 * targetType
 * targetId
 * from
 * to
 */
export const getAuditLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      page = "1",
      limit = "20",
      action,
      adminId,
      targetType,
      targetId,
      from,
      to,
    } = req.query;

    const parsedPage = Math.max(
      parseInt(String(page), 10) || 1,
      1
    );

    const parsedLimit = Math.min(
      Math.max(parseInt(String(limit), 10) || 20, 1),
      100
    );

    const skip = (parsedPage - 1) * parsedLimit;

    const where: any = {};

    if (action) {
      where.action = String(action);
    }

    if (adminId) {
      where.adminId = String(adminId);
    }

    if (targetType) {
      where.targetType = String(targetType);
    }

    if (targetId) {
      where.targetId = String(targetId);
    }

    if (from || to) {
      where.createdAt = {};

      if (from) {
        const fromDate = new Date(String(from));

        if (Number.isNaN(fromDate.getTime())) {
          res.status(400).json({
            success: false,
            message: "Invalid from date",
          });
          return;
        }

        where.createdAt.gte = fromDate;
      }

      if (to) {
        const toDate = new Date(String(to));

        if (Number.isNaN(toDate.getTime())) {
          res.status(400).json({
            success: false,
            message: "Invalid to date",
          });
          return;
        }

        where.createdAt.lte = toDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: parsedLimit,

        orderBy: {
          createdAt: "desc",
        },

        include: {
          admin: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      }),

      prisma.auditLog.count({
        where,
      }),
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error("Get audit logs error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load audit logs",
    });
  }
};

/**
 * GET /api/admin/audit-logs/:id
 */
export const getAuditLogById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = String(req.params.id);

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Audit log ID is required",
      });
      return;
    }

    const log = await prisma.auditLog.findUnique({
      where: {
        id,
      },
      include: {
        admin: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!log) {
      res.status(404).json({
        success: false,
        message: "Audit log not found",
      });
      return;
    }

    res.json({
      success: true,
      log,
    });
  } catch (error) {
    console.error("Get audit log error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load audit log",
    });
  }
};