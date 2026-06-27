import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ScreenLayout from '../components/ScreenLayout';
import CharacterAvatar from '../components/CharacterAvatar';
import CharacterBubble from '../components/CharacterBubble';
import { RootStackParamList } from '../navigation/types';
import { CHARACTERS } from '../constants/characters';
import { getSaveCompleteMessage } from '../utils/speech';
import { getDiaryDateInfo } from '../utils/dateUtils';
import { showDailyInterstitialIfNeeded } from '../services/interstitialAds';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'SaveComplete'>;

export default function SaveCompleteScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { targetDate, characterId } = route.params;
  const diaryInfo = getDiaryDateInfo(targetDate);
  const characterName = CHARACTERS.find((c) => c.id === characterId)?.name ?? characterId;
  const [isLeaving, setIsLeaving] = useState(false);

  const message = useMemo(
    () => getSaveCompleteMessage(characterId),
    [characterId],
  );

  async function handleGoHome() {
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      await showDailyInterstitialIfNeeded();
    } finally {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  }

  return (
    <ScreenLayout scrollable>
      <View style={styles.avatarWrap}>
        <CharacterAvatar characterId={characterId} size={155} bust expression="happy" />
        <Text style={styles.characterName}>{characterName}</Text>
      </View>

      <CharacterBubble
        message={message}
        characterId={characterId}
        showAvatar={false}
      />

      <View style={styles.resultArea}>
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
        <Text style={styles.savedTitle}>{diaryInfo.title}</Text>
        {diaryInfo.sub !== null && (
          <Text style={styles.savedDateSub}>{diaryInfo.sub}</Text>
        )}
        <Text style={styles.savedLabel}>保存しました</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, isLeaving && styles.primaryButtonDisabled]}
          onPress={handleGoHome}
          disabled={isLeaving}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>ホームへ戻る</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  avatarWrap: {
    alignItems: 'center',
    paddingTop: 10,
    marginBottom: 2,
    gap: 6,
  },
  characterName: {
    fontSize: 14,
    color: '#888',
  },
  resultArea: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    gap: 6,
  },
  checkmark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CAF82',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  checkmarkText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  savedTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#5C4A2A',
  },
  savedDateSub: {
    fontSize: 13,
    color: '#AAA',
  },
  savedLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  actions: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#F5A623',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
