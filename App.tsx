import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { requestPersonalizedAdsPermission } from './src/services/trackingPermission';
import { getAppSettings } from './src/storage/settingsStorage';

// React.lazy: the import() factory only runs when <RootNavigator> is first rendered,
// which happens after requestPersonalizedAdsPermission() completes (isReady=true).
// This defers evaluation of react-native-google-mobile-ads and all ad-related modules
// until after ATT — no static import of ./src/navigation at module load time.
const RootNavigator = React.lazy(() => import('./src/navigation'));

class NavigatorErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error('[App] RootNavigator failed to load:', error);
  }
  render() {
    if (this.state.hasError) {
      // Fallback: plain background so the app is never stuck on a blank screen.
      return <View style={{ flex: 1, backgroundColor: '#FFFAF5' }} />;
    }
    return this.props.children;
  }
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function prepare() {
      try {
        // ATT fires here — before RootNavigator / AdBanner are even imported.
        // GADDelayAppMeasurementInit=true ensures the AdMob native SDK also waits.
        // getAppSettings pre-warms the cache so HomeScreen renders with correct data.
        await Promise.all([
          requestPersonalizedAdsPermission(),
          getAppSettings(),
        ]);

        // Dynamic import — GADDelayAppMeasurementInit=true means the native SDK
        // is deliberately left uninitialized until now. A static top-level
        // import of react-native-google-mobile-ads here would re-introduce the
        // exact problem the RootNavigator/AdBanner lazy-import was meant to
        // avoid: ad-SDK code evaluating before ATT has resolved.
        try {
          const mobileAdsModule = await import('react-native-google-mobile-ads');
          await mobileAdsModule.default().initialize();
        } catch (error) {
          console.warn('[App] MobileAds initialize failed', error);
        }
      } catch {
        // Never block launch on errors.
      } finally {
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [isReady, contentOpacity]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {isReady && (
        <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
          <SafeAreaProvider>
            <NavigationContainer>
              <NavigatorErrorBoundary>
                <Suspense fallback={<View style={{ flex: 1, backgroundColor: '#FFFAF5' }} />}>
                  <RootNavigator />
                </Suspense>
              </NavigatorErrorBoundary>
            </NavigationContainer>
          </SafeAreaProvider>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFAF5',
  },
});
