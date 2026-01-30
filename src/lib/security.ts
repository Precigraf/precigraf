/**
 * Security utilities for PreciGraf
 * All security-critical logic is server-side - this file contains client-side helpers
 */

import { supabase } from '@/integrations/supabase/client';
import { logError } from './logger';

/**
 * Generate a device fingerprint hash for anti-fraud detection
 * This is NOT used for authentication - only for fraud detection
 */
export const generateDeviceFingerprint = async (): Promise<string> => {
  const components: string[] = [];

  // Screen properties
  components.push(`${screen.width}x${screen.height}`);
  components.push(`${screen.colorDepth}`);
  components.push(`${window.devicePixelRatio || 1}`);

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  components.push(navigator.language);

  // Platform (generic, not identifying)
  components.push(navigator.platform);

  // Canvas fingerprint (minimal)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('PreciGraf', 2, 2);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch {
    components.push('no-canvas');
  }

  // WebGL renderer (if available)
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown');
      }
    }
  } catch {
    components.push('no-webgl');
  }

  // Hash the components
  const fingerprintString = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprintString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Register device fingerprint with the server
 */
export const registerDeviceFingerprint = async (userId: string): Promise<void> => {
  try {
    const fingerprint = await generateDeviceFingerprint();
    
    await supabase.rpc('check_device_fingerprint', {
      p_user_id: userId,
      p_fingerprint_hash: fingerprint,
      p_ip_address: null, // Server will capture this
      p_user_agent: navigator.userAgent
    });
  } catch (error) {
    // Don't break the app if fingerprinting fails
    logError('Error registering device fingerprint:', error);
  }
};

/**
 * Log a security event
 */
export const logSecurityEvent = async (
  userId: string | null,
  eventType: string,
  description: string,
  metadata?: Record<string, unknown>
): Promise<void> => {
  try {
    await supabase.rpc('log_security_event', {
      p_user_id: userId,
      p_event_type: eventType,
      p_description: description,
      p_ip_address: null,
      p_user_agent: navigator.userAgent,
      p_metadata: JSON.parse(JSON.stringify(metadata || {}))
    });
  } catch (error) {
    // Don't break the app if logging fails
    logError('Error logging security event:', error);
  }
};

/**
 * Validate user plan for a specific feature (server-side validation)
 */
export const validateFeatureAccess = async (
  userId: string,
  feature: string
): Promise<{ allowed: boolean; reason?: string; plan?: string }> => {
  try {
    const { data, error } = await supabase.rpc('validate_user_plan', {
      p_user_id: userId,
      p_feature: feature
    });

    if (error) {
      logError('Error validating feature access:', error);
      return { allowed: false, reason: 'validation_error' };
    }

    return data as { allowed: boolean; reason?: string; plan?: string };
  } catch (error) {
    logError('Error validating feature access:', error);
    return { allowed: false, reason: 'validation_error' };
  }
};

/**
 * Check rate limit for an action
 */
export const checkRateLimit = async (
  identifier: string,
  actionType: string,
  maxRequests: number = 60,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining?: number; retryAfterSeconds?: number }> => {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_action_type: actionType,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds
    });

    if (error) {
      logError('Error checking rate limit:', error);
      // Allow on error to prevent blocking users
      return { allowed: true };
    }

    return data as { allowed: boolean; remaining?: number; retryAfterSeconds?: number };
  } catch (error) {
    logError('Error checking rate limit:', error);
    return { allowed: true };
  }
};

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 255;
};

/**
 * Validate password strength
 */
export const isStrongPassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Senha deve ter pelo menos 8 caracteres' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Senha muito longa' };
  }
  return { valid: true };
};

/**
 * Generate secure random token
 */
export const generateSecureToken = (): string => {
  return crypto.randomUUID();
};
