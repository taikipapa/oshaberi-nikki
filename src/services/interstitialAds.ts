import AsyncStorage from '@react-native-async-storage/async-storage';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { INTERSTITIAL_AD_UNIT_ID } from '../constants/adUnits';
import { requestPersonalizedAdsPermission } from './trackingPermission';

const STORAGE_KEY = 'interstitial_last_date';

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function hasShownToday(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored === todayString();
  } catch {
    return false;
  }
}

async function markShownToday(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, todayString());
  } catch {
    // ignore — missing the write means we may show again today, which is acceptable
  }
}

/**
 * Show an interstitial ad at most once per calendar day.
 * If already shown today, or if the ad fails to load, resolves immediately.
 * Never blocks the caller — always resolves whether or not the ad was shown.
 */
export async function showDailyInterstitialIfNeeded(): Promise<void> {
  if (await hasShownToday()) return;

  const personalized = await requestPersonalizedAdsPermission();

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: !personalized,
    });

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      ad.show();
    });

    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      cleanup();
      markShownToday().finally(finish);
    });

    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      cleanup();
      finish();
    });

    function cleanup() {
      unsubLoaded();
      unsubClosed();
      unsubError();
    }

    ad.load();
  });
}
