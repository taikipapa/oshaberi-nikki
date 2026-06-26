import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdBanner from './AdBanner';

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
  showAd?: boolean;
}

export default function ScreenLayout({
  children,
  scrollable = false,
  showAd = true,
}: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {scrollable ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
            {children}
          </ScrollView>
        ) : (
          <View style={styles.content}>{children}</View>
        )}
        {showAd && <AdBanner withBottomInset />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFAF5',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
});
