interface OTPRecord {
  otp: string;
  expiresAt: number;
}

interface OTPResult {
  success: boolean;
  message: string;
}

class OTPService {
  // Store OTPs temporarily (in production use Redis or database)
  private static otpStore = new Map<string, OTPRecord>();

  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static sendOTP(phone: string, otp: string): boolean {
    // In MVP, just console.log the OTP
    console.log(`📱 OTP for ${phone}: ${otp}`);
    return true;
  }

  static async requestOTP(phone: string): Promise<OTPResult> {
    const otp = this.generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    this.otpStore.set(phone, { otp, expiresAt });
    this.sendOTP(phone, otp);

    return { success: true, message: 'OTP sent successfully' };
  }

  static async verifyOTP(phone: string, otp: string): Promise<OTPResult> {
    const record = this.otpStore.get(phone);

    if (!record) {
      return { success: false, message: 'No OTP request found' };
    }

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(phone);
      return { success: false, message: 'OTP has expired' };
    }

    if (record.otp !== otp) {
      return { success: false, message: 'Invalid OTP' };
    }

    this.otpStore.delete(phone);
    return { success: true, message: 'OTP verified successfully' };
  }
}

export default OTPService;
