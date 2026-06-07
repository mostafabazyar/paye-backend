"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/profile.routes.ts
const express_1 = require("express");
const profile_controller_1 = require("../controllers/profile.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Protected routes
router.post('/setup', auth_middleware_1.authMiddleware, profile_controller_1.setupProfile);
router.post('/create', auth_middleware_1.authMiddleware, profile_controller_1.createListing);
router.get('/explore', auth_middleware_1.authMiddleware, profile_controller_1.exploreProfiles);
router.get('/me', auth_middleware_1.authMiddleware, profile_controller_1.getProfile);
exports.default = router;
