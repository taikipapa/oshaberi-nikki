import { Platform } from 'react-native';

// Google's official test IDs — safe to commit, never earn real revenue.
const TEST_UNIT_IDS = {
  rewarded:     { ios: 'ca-app-pub-3940256099942544/1712485313', android: 'ca-app-pub-3940256099942544/5224354917' },
  banner:       { ios: 'ca-app-pub-3940256099942544/2934735716', android: 'ca-app-pub-3940256099942544/6300978111' },
  interstitial: { ios: 'ca-app-pub-3940256099942544/4411468910', android: 'ca-app-pub-3940256099942544/1033173712' },
};

const PROD_UNIT_IDS = {
  rewarded:     { ios: 'ca-app-pub-2833241675946579/9583050974', android: 'ca-app-pub-2833241675946579/7068568270' },
  banner:       { ios: 'ca-app-pub-2833241675946579/3654303967', android: 'ca-app-pub-2833241675946579/8906630640' },
  interstitial: { ios: 'ca-app-pub-2833241675946579/7593970431', android: 'ca-app-pub-2833241675946579/9675384460' },
};

function pickId(ids: { ios: string; android: string }): string {
  return Platform.OS === 'android' ? ids.android : ids.ios;
}

const unitIds = __DEV__ ? TEST_UNIT_IDS : PROD_UNIT_IDS;

export const REWARDED_AD_UNIT_ID     = pickId(unitIds.rewarded);
export const BANNER_AD_UNIT_ID       = pickId(unitIds.banner);
export const INTERSTITIAL_AD_UNIT_ID = pickId(unitIds.interstitial);
