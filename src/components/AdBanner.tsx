import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BANNER_AD_UNIT_ID } from '../constants/adUnits';
import { requestPersonalizedAdsPermission } from '../services/trackingPermission';

interface Props {
  // True when the banner is the bottommost element in a stack screen
  // (no tab bar below it). Adds home indicator safe area padding.
  withBottomInset?: boolean;
}

export default function AdBanner({ withBottomInset = false }: Props) {
  const insets = useSafeAreaInsets();
  // null = ATT not yet resolved; true/false = resolved
  const [personalized, setPersonalized] = useState<boolean | null>(null);

  useEffect(() => {
    // Requests ATT on first render (shows dialog if not yet determined).
    // Subsequent calls return the cached result without showing the dialog again.
    requestPersonalizedAdsPermission().then(setPersonalized);
  }, []);

  if (personalized === null) return null;

  return (
    <View style={[styles.container, withBottomInset && { paddingBottom: insets.bottom }]}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: !personalized }}
        onAdFailedToLoad={() => {/* fail silently */}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFAF5',
  },
});
