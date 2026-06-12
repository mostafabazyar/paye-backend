"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/profile.routes.ts
const express_1 = require("express");
const profile_controller_1 = require("../controllers/profile.controller");
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const router = (0, express_1.Router)();
// Protected routes
router.post('/setup', auth_middleware_1.default, profile_controller_1.setupProfile);
router.post('/create', auth_middleware_1.default, profile_controller_1.createProfileListing);
router.get('/explore', auth_middleware_1.default, profile_controller_1.exploreListings);
router.get('/me', auth_middleware_1.default, profile_controller_1.getProfile);
exports.default = router;
// Create a profile/listing
// Explore listings (optional sport filter)
