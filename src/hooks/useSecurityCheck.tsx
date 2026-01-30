import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { registerDeviceFingerprint, logSecurityEvent } from '@/lib/security';

/**
 * Hook to perform security checks on mount
 * - Registers device fingerprint for anti-fraud
 * - Logs login events
 */
export const useSecurityCheck = () => {
  const { user } = useAuth();

  const performSecurityCheck = useCallback(async () => {
    if (!user) return;

    // Register device fingerprint
    await registerDeviceFingerprint(user.id);

    // Log successful login/session
    await logSecurityEvent(user.id, 'session_active', 'User session active');
  }, [user]);

  useEffect(() => {
    performSecurityCheck();
  }, [performSecurityCheck]);
};
