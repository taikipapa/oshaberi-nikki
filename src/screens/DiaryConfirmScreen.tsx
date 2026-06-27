import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenLayout from '../components/ScreenLayout';
import CharacterAvatar from '../components/CharacterAvatar';
import CharacterBubble from '../components/CharacterBubble';
import { RootStackParamList } from '../navigation/types';
import { CHARACTERS } from '../constants/characters';
import { getDiaryDateInfo } from '../utils/dateUtils';
import { getScoreReaction } from '../utils/speech';
import { saveDiaryEntry } from '../storage/diaryStorage';
import { pendingResumeRef } from '../utils/diaryEditState';
import { DiaryEntry } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'DiaryConfirm'>;

function generateId(): string {
  return `diary_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function DiaryConfirmScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { targetDate, score, content, characterId } = route.params;

  const [saving, setSaving] = useState(false);
  const diaryInfo = getDiaryDateInfo(targetDate);
  const characterComment = getScoreReaction(score, characterId);
  const characterName = CHARACTERS.find((c) => c.id === characterId)?.name ?? characterId;
  const expression = score <= 40 ? 'worry' as const : 'normal' as const;

  async function handleSave() {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const entry: DiaryEntry = {
        id: generateId(),
        targetDate,
        score,
        content,
        characterId,
        characterComment,
        createdAt: now,
        updatedAt: now,
      };
      await saveDiaryEntry(entry);
      navigation.navigate('SaveComplete', { targetDate, characterId });
    } catch {
      Alert.alert('エラー', '保存できませんでした。もう一度試してください。');
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    pendingResumeRef.current = { targetDate, score, content, characterComment };
    navigation.goBack();
  }

  return (
    <ScreenLayout scrollable>
      <View style={styles.avatarWrap}>
        <CharacterAvatar characterId={characterId} size={155} bust expression={expression} />
        <Text style={styles.characterName}>{characterName}</Text>
      </View>

      <CharacterBubble
        message={characterComment}
        characterId={characterId}
        showAvatar={false}
      />

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>日付</Text>
          <View style={styles.dateCell}>
            <Text style={styles.value}>{diaryInfo.title}</Text>
            {diaryInfo.sub !== null && (
              <Text style={styles.dateSub}>{diaryInfo.sub}</Text>
            )}
          </View>
        </View>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>点数</Text>
          <View style={[styles.scoreBadge, scoreBadgeColor(score)]}>
            <Text style={styles.scoreBadgeText}>{score}点</Text>
          </View>
        </View>
        <View style={styles.divider} />

        <View style={styles.contentBlock}>
          <Text style={styles.label}>日記</Text>
          {content ? (
            <Text style={styles.contentText}>{content}</Text>
          ) : (
            <Text style={styles.emptyText}>本文なし</Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, saving && styles.disabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>保存する</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, saving && styles.disabled]}
          onPress={handleBack}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>戻って修正する</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

function scoreBadgeColor(score: number) {
  if (score >= 80) return { backgroundColor: '#4CAF82' };
  if (score >= 50) return { backgroundColor: '#F5A623' };
  return { backgroundColor: '#E8736B' };
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
  card: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  dateCell: {
    alignItems: 'flex-end',
    gap: 2,
  },
  dateSub: {
    fontSize: 12,
    color: '#AAA',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EDE8',
    marginVertical: 4,
  },
  contentBlock: {
    paddingVertical: 8,
    gap: 8,
  },
  contentText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
  },
  emptyText: {
    fontSize: 15,
    color: '#CCC',
    fontStyle: 'italic',
  },
  scoreBadge: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 16,
  },
  scoreBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actions: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 12,
    gap: 12,
  },
  primaryButton: {
    alignSelf: 'center',
    backgroundColor: '#F5A623',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 56,
    alignItems: 'center',
    minWidth: 200,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    alignSelf: 'center',
    backgroundColor: '#FFFAF5',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#AAA',
  },
  disabled: {
    opacity: 0.6,
  },
});
