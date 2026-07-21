import { Alert } from 'react-native';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { REWARDED_AD_UNIT_ID } from '../constants/adUnits';
import { requestPersonalizedAdsPermission } from './trackingPermission';

// Upper bound on how long we wait for the ad SDK to load/show before giving
// up — some failure modes (no network, SDK stuck) never fire LOADED or ERROR.
const LOAD_TIMEOUT_MS = 8000;

function showLoadFailedAlert(): void {
  Alert.alert(
    '広告を読み込めませんでした',
    '通信状況を確認して、もう一度お試しください。',
    [{ text: 'OK' }],
  );
}

/**
 * Request a rewarded ad for character unlock.
 * Returns true if the reward was earned, false if cancelled or ad failed.
 *
 * ATT is requested before the first ad load. Subsequent calls use the cached result.
 */
export async function showRewardedAdForCharacterUnlock(_characterId: string): Promise<boolean> {
  const personalized = await requestPersonalizedAdsPermission();

  return new Promise((resolve) => {
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const finish = (earned: boolean) => {
      if (settled) return;
      settled = true;
      if (timeoutId !== null) clearTimeout(timeoutId);
      resolve(earned);
    };

    // The ad SDK's native module may be missing entirely (e.g. a build that
    // wasn't rebuilt after adding the plugin) — createForAdRequest/load can
    // throw synchronously in that case. Without this try/catch, that throw
    // would leave the button's loading state stuck and the caller's promise
    // rejected with no visible feedback ("nothing happens" when tapped).
    try {
      const ad = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: !personalized,
      });

      let rewardEarned = false;

      const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        ad.show();
      });

      const unsubReward = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        rewardEarned = true;
      });

      const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        cleanup();
        finish(rewardEarned);
      });

      const unsubError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
        console.warn('[rewardedAds] failed to load:', error);
        cleanup();
        showLoadFailedAlert();
        finish(false);
      });

      function cleanup() {
        unsubLoaded();
        unsubReward();
        unsubClosed();
        unsubError();
      }

      timeoutId = setTimeout(() => {
        console.warn('[rewardedAds] load timed out');
        cleanup();
        showLoadFailedAlert();
        finish(false);
      }, LOAD_TIMEOUT_MS);

      ad.load();
    } catch (error) {
      console.warn('[rewardedAds] createForAdRequest threw', error);
      showLoadFailedAlert();
      finish(false);
    }
  });
}
