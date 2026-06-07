"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const router = express_1.default.Router();
router.use(auth_middleware_1.default);
// Get all users for discovery
router.get('/', userController_1.getAllUsers);
// Search users
router.get('/search', userController_1.searchUsers);
// Get current user profile
router.get('/me', userController_1.getCurrentUser);
// Get specific user by ID
router.get('/:id', userController_1.getUserById);
// Update current user's photos
router.patch('/photos', userController_1.updateUserPhotos);
exports.default = router;
