import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ScreenLayout from '../components/ScreenLayout';
import CharacterAvatar from '../components/CharacterAvatar';
import CharacterBubble from '../components/CharacterBubble';
import { getDiaryEntryByDate } from '../storage/diaryStorage';
import { getTimePeriod, getTargetDate, getDiaryDateInfo } from '../utils/dateUtils';
import {
  getMorningGreeting,
  getNightGreeting,
  getAfternoonComment,
  getAlreadyWrittenComment,
} from '../utils/speech';
import { DEFAULT_CHARACTER_ID } from '../constants/characters';
import { RootStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const [message, setMessage] = useState('');
  const [shouldWrite, setShouldWrite] = useState(false);
  const [targetDate, setTargetDate] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        const now = new Date();
        const period = getTimePeriod(now);
        const date = getTargetDate(now);

        if (!active) return;
        setTargetDate(date);

        const existing = await getDiaryEntryByDate(date);

        if (!active) return;

        if (existing) {
          setMessage(getAlreadyWrittenComment(DEFAULT_CHARACTER_ID));
          setShouldWrite(false);
        } else if (period === 'morning') {
          setMessage(getMorningGreeting(DEFAULT_CHARACTER_ID));
          setShouldWrite(true);
        } else if (period === 'daytime') {
          setMessage(getAfternoonComment(DEFAULT_CHARACTER_ID));
          setShouldWrite(false);
        } else {
          setMessage(getNightGreeting(DEFAULT_CHARACTER_ID));
          setShouldWrite(true);
        }
      }

      load();
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <ScreenLayout showAd={false}>
      <View style={styles.inner}>
        <Text style={styles.appTitle}>おしゃべり日記</Text>

        <View style={styles.avatarWrap}>
          <CharacterAvatar characterId={DEFAULT_CHARACTER_ID} size={100} />
          <Text style={styles.characterName}>ハナ</Text>
        </View>

        <CharacterBubble
          message={message || '…'}
          characterId={DEFAULT_CHARACTER_ID}
        />

        <View style={styles.actions}>
          {shouldWrite && targetDate !== '' && (() => {
            const info = getDiaryDateInfo(targetDate);
            return (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('DiaryFlow', { targetDate })}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>{info.title}を書く</Text>
              </TouchableOpacity>
            );
          })()}

          {!shouldWrite && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Calendar' })}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>カレンダーを見る</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    paddingTop: 24,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5C4A2A',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  characterName: {
    fontSize: 14,
    color: '#888',
  },
  actions: {
    paddingHorizontal: 24,
    paddingTop: 24,
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
    borderColor: '#F5A623',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#F5A623',
    fontWeight: '600',
  },
});
