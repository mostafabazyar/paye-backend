'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { findUser, normalizePhone } from '@/data/users';
import styles from '@/styles/Login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Normalize the phone number
    const normalizedPhone = normalizePhone(phone);
    
    // Check credentials with the normalized phone
    const user = findUser(normalizedPhone, password);
    
    if (!user) {
      setError('Invalid phone number or password');
      setLoading(false);
      return;
    }

    // Store user in session
    sessionStorage.setItem('otpViewerUser', JSON.stringify(user));
    router.push('/dashboard');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>🔐 OTP Viewer</h1>
          <p className={styles.subtitle}>Secure OTP Management Tool</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <h3>Login to View OTP</h3>
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09125239708"
              className={styles.input}
              required
            />
            <small className={styles.hint}>
              Enter phone number starting with 0 (e.g., 09125239708)
              <br />
              You can also enter with +98 or 98 and it will be converted
            </small>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={styles.input}
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button 
            type="submit" 
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className={styles.demoInfo}>
            <p>Demo Users (with 0 format):</p>
            <ul className={styles.demoList}>
              <li>📱 09125239708 | 🔑 user123</li>
              <li>📱 09087654321 | 🔑 pass456</li>
              <li>📱 09112233445 | 🔑 demo789</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}