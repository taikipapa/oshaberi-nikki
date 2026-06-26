import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  // True when the banner is the bottommost element in a stack screen
  // (no tab bar below it). Adds home indicator safe area padding.
  withBottomInset?: boolean;
}

export default function AdBanner({ withBottomInset = false }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        withBottomInset && { paddingBottom: insets.bottom },
      ]}
    >
      <Text style={styles.label}>広告スペース</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    backgroundColor: '#F0EDE8',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#DDD8D0',
  },
  label: {
    fontSize: 12,
    color: '#AAA49C',
    letterSpacing: 1,
  },
});
