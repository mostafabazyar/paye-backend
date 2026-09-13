import { Router } from "express";

import authMiddleware from "../../middleware/auth.middleware";
import adminMiddleware from "../../middleware/admin.middleware";

import {
  getAdminListings,
  getAdminListingById,
  updateAdminListing,
  closeAdminListing,
  reactivateAdminListing,
  deleteAdminListing,
} from "../../controllers/admin/adminListing.controller";

const router = Router();

/**
 * All admin listing routes require:
 *
 * 1. Authentication
 * 2. Admin authorization
 */
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * GET /api/admin/listings
 */
router.get(
  "/",
  getAdminListings
);

/**
 * PATCH /api/admin/listings/:id/close
 */
router.patch(
  "/:id/close",
  closeAdminListing
);

/**
 * PATCH /api/admin/listings/:id/reactivate
 */
router.patch(
  "/:id/reactivate",
  reactivateAdminListing
);

/**
 * GET /api/admin/listings/:id
 */
router.get(
  "/:id",
  getAdminListingById
);

/**
 * PUT /api/admin/listings/:id
 */
router.put(
  "/:id",
  updateAdminListing
);

/**
 * DELETE /api/admin/listings/:id
 */
router.delete(
  "/:id",
  deleteAdminListing
);

export default router;