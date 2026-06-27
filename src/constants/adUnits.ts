import { Platform } from 'react-native';

// Google's official test IDs — safe to commit, never earn real revenue.
const TEST_UNIT_IDS = {
  ios:     'ca-app-pub-3940256099942544/1712485313',
  android: 'ca-app-pub-3940256099942544/5224354917',
};

const PROD_UNIT_IDS = {
  ios:     'ca-app-pub-2833241675946579/9583050974',
  android: 'ca-app-pub-2833241675946579/7068568270',
};

const unitIds = __DEV__ ? TEST_UNIT_IDS : PROD_UNIT_IDS;

export const REWARDED_AD_UNIT_ID =
  Platform.OS === 'android' ? unitIds.android : unitIds.ios;
