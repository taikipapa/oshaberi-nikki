import { Alert } from 'react-native';

// TODO: Replace this mock confirmation with real AdMob rewarded ad loading.
// TODO: Resolve true only when the rewarded ad completes and the reward is earned.
// TODO: Handle ad load failure and show a friendly fallback message.

/**
 * Request a rewarded ad for character unlock.
 * Returns true if the reward was earned (user should be unlocked),
 * false if cancelled or ad failed.
 */
export function showRewardedAdForCharacterUnlock(_characterId: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      '広告を見て解放',
      'テスト用にこのキャラクターを解放しますか？',
      [
        { text: 'キャンセル', style: 'cancel', onPress: () => resolve(false) },
        { text: '解放する', onPress: () => resolve(true) },
      ],
      { onDismiss: () => resolve(false) },
    );
  });
}
