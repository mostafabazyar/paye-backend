"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const requestController_1 = require("../controllers/requestController");
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const router = express_1.default.Router();
router.use(auth_middleware_1.default);
router.post('/', requestController_1.sendRequest);
router.get('/received', requestController_1.getUserReceivedRequests);
router.get('/profile/:profileId', requestController_1.getProfileRequests);
router.put('/:id', requestController_1.updateRequestStatus);
exports.default = router;
