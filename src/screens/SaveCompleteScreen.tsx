import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ScreenLayout from '../components/ScreenLayout';
import CharacterAvatar from '../components/CharacterAvatar';
import { RootStackParamList } from '../navigation/types';
import { DEFAULT_CHARACTER_ID } from '../constants/characters';
import { getSaveCompleteMessage } from '../utils/speech';
import { getDiaryDateInfo } from '../utils/dateUtils';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'SaveComplete'>;

export default function SaveCompleteScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { targetDate } = route.params;
  const diaryInfo = getDiaryDateInfo(targetDate);

  const message = useMemo(
    () => getSaveCompleteMessage(DEFAULT_CHARACTER_ID),
    [],
  );

  function goCalendar() {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Calendar' } }],
    });
  }

  function goHome() {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  }

  return (
    <ScreenLayout>
      <View style={styles.inner}>
        <View style={styles.avatarWrap}>
          <CharacterAvatar characterId={DEFAULT_CHARACTER_ID} size={100} />
        </View>

        <View style={styles.messageWrap}>
          <Text style={styles.messageText}>{message}</Text>
        </View>

        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
        <Text style={styles.savedTitle}>{diaryInfo.title}</Text>
        {diaryInfo.sub !== null && (
          <Text style={styles.savedDateSub}>{diaryInfo.sub}</Text>
        )}
        <Text style={styles.savedLabel}>保存しました</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goCalendar}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>カレンダーを見る</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={goHome}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>ホームへ戻る</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    paddingTop: 48,
    alignItems: 'center',
  },
  avatarWrap: {
    marginBottom: 24,
  },
  messageWrap: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 18,
    marginHorizontal: 24,
    marginBottom: 32,
  },
  messageText: {
    fontSize: 17,
    color: '#333',
    lineHeight: 26,
    textAlign: 'center',
  },
  checkmark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CAF82',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
    marginTop: 4,
  },
  savedDateSub: {
    fontSize: 13,
    color: '#AAA',
    marginBottom: 4,
  },
  savedLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 40,
  },
  actions: {
    width: '100%',
    paddingHorizontal: 24,
    gap: 14,
  },
  primaryButton: {
    backgroundColor: '#F5A623',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0D8CC',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#888',
  },
});
