import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

const PROD_UNIT_IDS = {
  rewarded:     { ios: 'ca-app-pub-2833241675946579/9583050974', android: 'ca-app-pub-2833241675946579/7068568270' },
  banner:       { ios: 'ca-app-pub-2833241675946579/3654303967', android: 'ca-app-pub-2833241675946579/8906630640' },
  interstitial: { ios: 'ca-app-pub-2833241675946579/7593970431', android: 'ca-app-pub-2833241675946579/9675384460' },
};

function pickId(ids: { ios: string; android: string }): string {
  return Platform.OS === 'android' ? ids.android : ids.ios;
}

// Local debugging override only — forces Google's official test ad unit IDs
// even in a release build. MUST stay `false` for App Store submissions;
// leaving this `true` in a store build means real users only ever see test ads.
const FORCE_TEST_ADS = false;

const useTestAds = __DEV__ || FORCE_TEST_ADS;

export const AD_ID_SOURCE: 'test' | 'prod' = useTestAds ? 'test' : 'prod';

// TestIds.* comes from react-native-google-mobile-ads itself and is already
// resolved for the current platform — Google's own maintained test ad unit
// IDs, rather than hand-copied string literals that could drift out of date.
export const REWARDED_AD_UNIT_ID     = useTestAds ? TestIds.REWARDED : pickId(PROD_UNIT_IDS.rewarded);
export const BANNER_AD_UNIT_ID       = useTestAds ? TestIds.BANNER : pickId(PROD_UNIT_IDS.banner);
export const INTERSTITIAL_AD_UNIT_ID = useTestAds ? TestIds.INTERSTITIAL : pickId(PROD_UNIT_IDS.interstitial);
