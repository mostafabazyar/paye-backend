// src/routes/auth.routes.ts
import { Router } from 'express';
import { login, verify } from '../controllers/auth.controller';
import { getOTPByPhone, getAllActiveOTPs } from '../controllers/otp.controller';

const router = Router();

router.post('/login', login);
router.post('/verify', verify);

// OTP viewer routes (temporary/development)
router.get('/otp/view', getOTPByPhone);
router.get('/otp/all', getAllActiveOTPs);

export default router;