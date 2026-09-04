'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchOTPByPhone, fetchAllOTPs } from '@/lib/api';
import { isSuccessResponse } from '@/lib/type-guards';
import { User, OTP } from '@/types';
import styles from '@/styles/Dashboard.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [otpData, setOtpData] = useState<OTP | null>(null);
  const [allOtps, setAllOtps] = useState<OTP[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Check if user is logged in
  useEffect(() => {
    const storedUser = sessionStorage.getItem('otpViewerUser');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  // Fetch OTP function
// Fetch OTP function
const fetchOTP = useCallback(async () => {
  if (!user) return;
  
  setLoading(true);
  setError('');
  
  try {
    console.log('📞 Fetching OTP for phone:', user.phone);
    const response = await fetchOTPByPhone(user.phone);
    
    if (isSuccessResponse(response)) {
      console.log('✅ OTP found:', response.data);
      setOtpData(response.data);
      setError('');
    } else {
      console.log('❌ No OTP found:', response.message);
      setOtpData(null);
      setError(response.message || 'No OTP found for this phone number');
    }
  } catch (err) {
    console.error('Error fetching OTP:', err);
    setError('Failed to fetch OTP. Please try again.');
    setOtpData(null);
  } finally {
    setLoading(false);
  }
}, [user]);

  // Fetch all OTPs function
//   const fetchAllOTPs = useCallback(async () => {
//     try {
//       const response = await fetchAllOTPs();
      
//       // Use the type guard for proper type checking
//       if (isSuccessResponse(response)) {
//         setAllOtps(response.data);
//       } else {
//         console.error('Failed to fetch all OTPs:', response.message);
//       }
//     } catch (err) {
//       console.error('Failed to fetch all OTPs:', err);
//     }
//   }, []);

  // Fetch OTPs when user is set or refreshKey changes
  useEffect(() => {
    if (user) {
      fetchOTP();
      fetchAllOTPs();
    }
  }, [user, fetchOTP, fetchAllOTPs, refreshKey]);

  // Auto-refresh
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && user) {
      interval = setInterval(() => {
        fetchOTP();
        fetchAllOTPs();
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, user, fetchOTP, fetchAllOTPs]);

  const handleLogout = () => {
    sessionStorage.removeItem('otpViewerUser');
    router.push('/login');
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('OTP copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('OTP copied to clipboard!');
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getStatusColor = (otp: OTP) => {
    if (otp.used) return '#999';
    if (isExpired(otp.expiresAt)) return '#ff6b6b';
    return '#51cf66';
  };

  const getStatusText = (otp: OTP) => {
    if (otp.used) return 'Used';
    if (isExpired(otp.expiresAt)) return 'Expired';
    return 'Active';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    if (diff <= 0) return 'Expired';
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (!user) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h1>🔐 OTP Viewer</h1>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          </div>
          <p className={styles.subtitle}>Welcome, {user.name} ({user.phone})</p>
        </div>

        <div className={styles.otpSection}>
          <div className={styles.sectionHeader}>
            <h3>Your OTP</h3>
            <div className={styles.controls}>
              <label className={styles.autoRefreshLabel}>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Auto-refresh
              </label>
              <button 
                onClick={handleRefresh} 
                className={styles.refreshButton}
                disabled={loading}
              >
                {loading ? '⏳ Loading...' : '🔄 Refresh'}
              </button>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {otpData ? (
            <div className={styles.otpResult}>
              <div className={styles.otpDisplay}>
                <div className={styles.otpCodeContainer}>
                  <div className={styles.otpCode}>{otpData.otp}</div>
                  <button 
                    onClick={() => handleCopy(otpData.otp)}
                    className={styles.copyButtonSmall}
                  >
                    📋 Copy
                  </button>
                </div>
                <div className={styles.otpInfo}>
                  <div className={styles.otpStatus}>
                    <span className={styles.statusBadge} style={{ 
                      backgroundColor: getStatusColor(otpData) === '#51cf66' ? '#d3f9d8' : 
                                     getStatusColor(otpData) === '#ff6b6b' ? '#ffe3e3' : '#f1f3f5',
                      color: getStatusColor(otpData)
                    }}>
                      {getStatusText(otpData)}
                    </span>
                  </div>
                  <div><strong>Created:</strong> {formatDate(otpData.createdAt)}</div>
                  <div><strong>Expires:</strong> {formatDate(otpData.expiresAt)}</div>
                  <div>
                    <strong>Time remaining:</strong> 
                    {!isExpired(otpData.expiresAt) && !otpData.used ? (
                      <span className={styles.timeRemaining}>
                        {getTimeRemaining(otpData.expiresAt)}
                      </span>
                    ) : (
                      <span style={{ color: '#ff6b6b' }}> Expired</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.noOtp}>
              <p>No active OTP found for this phone number.</p>
              <p className={styles.hint}>
                Please request a new OTP from the main app.
                <br />
                <small>Make sure you've entered the correct phone number in the main app.</small>
              </p>
            </div>
          )}
        </div>

        <hr className={styles.divider} />

        <div className={styles.allOtpsSection}>
          <div className={styles.sectionHeader}>
            <h3>All Active OTPs ({allOtps.length})</h3>
            <button onClick={fetchAllOTPs} className={styles.refreshButton}>
              🔄 Refresh
            </button>
          </div>
          
          {allOtps.length > 0 ? (
            <div className={styles.otpList}>
              {allOtps.map((otp) => (
                <div key={otp.id} className={styles.otpItem}>
                  <div className={styles.otpItemPhone}>{otp.phone}</div>
                  <div className={styles.otpItemCode}>{otp.otp}</div>
                  <div className={styles.otpItemStatus}>
                    <span className={styles.statusBadge} style={{ 
                      backgroundColor: getStatusColor(otp) === '#51cf66' ? '#d3f9d8' : 
                                     getStatusColor(otp) === '#ff6b6b' ? '#ffe3e3' : '#f1f3f5',
                      color: getStatusColor(otp)
                    }}>
                      {getStatusText(otp)}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleCopy(otp.otp)}
                    className={styles.smallCopyButton}
                  >
                    📋
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noData}>No active OTPs found</p>
          )}
        </div>
      </div>
    </div>
  );
}