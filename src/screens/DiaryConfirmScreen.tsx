import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { getScoreReaction, getSaveCompleteMessage } from '../utils/speech';
import { saveDiaryEntry, updateDiaryEntry } from '../storage/diaryStorage';
import { showDailyInterstitialIfNeeded } from '../services/interstitialAds';
import { pendingResumeRef } from '../utils/diaryEditState';
import { DiaryEntry } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'DiaryConfirm'>;

type Mode = 'confirm' | 'complete';

function generateId(): string {
  return `diary_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function DiaryConfirmScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { targetDate, score, content, characterId, editParams, characterComment: passedComment } = route.params;

  const [mode, setMode] = useState<Mode>('confirm');
  const [saving, setSaving] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  // Mirrors `isLeaving` for the `beforeRemove` listener below, which is only
  // ever re-subscribed when `mode` changes. Reading state directly there
  // would freeze `isLeaving` at whatever it was when `mode` last flipped to
  // 'complete' (always false) — a ref always reflects the latest value.
  const isLeavingRef = useRef(false);
  const diaryInfo = getDiaryDateInfo(targetDate);
  // Frozen once per screen instance: score/characterId never change for the
  // lifetime of this mount, so this must not be recomputed on every render
  // (getScoreReaction picks randomly — recomputing it when `saving`/`isLeaving`
  // change made the bubble flash a different confirm-band line mid-save).
  // Prefer the line the caller already showed the user right after they
  // entered the score (passedComment) so the reaction step and this confirm
  // screen never disagree; only re-roll if no comment was passed in.
  const characterComment = useMemo(
    () => passedComment ?? getScoreReaction(score, characterId),
    [passedComment, score, characterId],
  );
  const completeMessage = useMemo(
    () => getSaveCompleteMessage(characterId),
    [characterId],
  );
  const characterName = CHARACTERS.find((c) => c.id === characterId)?.name ?? characterId;
  const expression = score <= 40 ? 'worry' as const : 'normal' as const;

  // Once saved, block leaving this screen via back-gesture/hardware-back —
  // going "back" to a stale confirm form after a successful save makes no
  // sense, so route it through the same flow as the "ホームへ戻る" button.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: mode !== 'complete' });
  }, [mode, navigation]);

  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (mode !== 'complete') return;
      // Our own handleGoHome() is mid-flight and its navigation.reset() is
      // what's triggering this event — let it proceed instead of blocking it.
      if (isLeavingRef.current) return;
      e.preventDefault();
      handleGoHome();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, mode]);

  async function handleSave() {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (editParams) {
        const updated: DiaryEntry = {
          id: editParams.id,
          targetDate,
          score,
          content,
          characterId: editParams.characterId,
          characterComment,
          createdAt: editParams.createdAt,
          updatedAt: now,
        };
        await updateDiaryEntry(updated);
      } else {
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
      }
      setMode('complete');
    } catch {
      Alert.alert('エラー', '保存できませんでした。もう一度試してください。');
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    if (!editParams) {
      pendingResumeRef.current = { targetDate, score, content, characterComment };
    }
    navigation.goBack();
  }

  async function handleGoHome() {
    if (isLeavingRef.current) return;
    isLeavingRef.current = true;
    setIsLeaving(true);
    try {
      await showDailyInterstitialIfNeeded();
    } catch (error) {
      console.warn('[DiaryConfirmScreen] interstitial ad failed', error);
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
        <CharacterAvatar
          characterId={characterId}
          size={155}
          bust
          expression={mode === 'complete' ? 'happy' : expression}
        />
        <Text style={styles.characterName}>{characterName}</Text>
      </View>

      <CharacterBubble
        message={mode === 'complete' ? completeMessage : characterComment}
        characterId={characterId}
        showAvatar={false}
      />

      {mode === 'confirm' ? (
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
      ) : (
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
      )}

      <View style={styles.actions}>
        {mode === 'confirm' ? (
          <>
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
          </>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, isLeaving && styles.disabled]}
            onPress={handleGoHome}
            disabled={isLeaving}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>ホームへ戻る</Text>
          </TouchableOpacity>
        )}
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
