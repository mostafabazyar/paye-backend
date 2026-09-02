'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { findUser } from '@/data/users';
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

    // Format phone number
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    
    // Check credentials
    const user = findUser(formattedPhone, password);
    
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
              placeholder="+1234567890"
              className={styles.input}
              required
            />
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
            <p>Demo Users:</p>
            <ul className={styles.demoList}>
              <li>📱 +1234567890 | 🔑 user123</li>
              <li>📱 +0987654321 | 🔑 pass456</li>
              <li>📱 +1122334455 | 🔑 demo789</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}