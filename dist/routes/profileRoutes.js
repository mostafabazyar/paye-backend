"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const profileController_1 = require("../controllers/profileController");
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const router = express_1.default.Router();
router.use(authMiddleware_1.default);
router.post('/', profileController_1.createProfile);
router.get('/my-profiles', profileController_1.getUserProfiles);
router.get('/explore', profileController_1.getAllProfiles);
router.put('/:id', profileController_1.updateProfile);
router.delete('/:id', profileController_1.deleteProfile);
exports.default = router;
