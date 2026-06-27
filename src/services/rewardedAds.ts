import { Alert } from 'react-native';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { REWARDED_AD_UNIT_ID } from '../constants/adUnits';
import { requestPersonalizedAdsPermission } from './trackingPermission';

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
    const finish = (earned: boolean) => {
      if (settled) return;
      settled = true;
      resolve(earned);
    };

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
      unsubLoaded();
      unsubReward();
      unsubClosed();
      unsubError();
      finish(rewardEarned);
    });

    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      unsubLoaded();
      unsubReward();
      unsubClosed();
      unsubError();
      Alert.alert(
        '広告を読み込めませんでした',
        '通信状況を確認して、もう一度お試しください。',
        [{ text: 'OK' }],
      );
      finish(false);
    });

    ad.load();
  });
}
