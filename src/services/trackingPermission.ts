import {
  requestTrackingPermissionsAsync,
  getTrackingPermissionsAsync,
} from 'expo-tracking-transparency';

// Module-level cache — persists for the app session.
let cached: boolean | null = null;

/**
 * Requests ATT on iOS (shows the system dialog if not yet determined).
 * Returns true if personalized ads are allowed.
 * Safe to call multiple times — subsequent calls return the cached result instantly.
 * On Android or unavailable platforms the library always returns granted=true,
 * so this may return true on Android as well.
 */
export async function requestPersonalizedAdsPermission(): Promise<boolean> {
  if (cached !== null) return cached;
  try {
    const { granted } = await requestTrackingPermissionsAsync();
    cached = granted;
    return cached;
  } catch {
    cached = false;
    return false;
  }
}

/**
 * Checks ATT status without showing a dialog.
 * Returns true only if the user has already authorized tracking.
 * Use this when you need the current status but don't want to trigger the dialog.
 */
export async function getPersonalizedAdsAllowed(): Promise<boolean> {
  if (cached !== null) return cached;
  try {
    const { granted } = await getTrackingPermissionsAsync();
    cached = granted;
    return cached;
  } catch {
    return false;
  }
}
