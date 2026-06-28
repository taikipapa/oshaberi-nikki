import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ScreenLayout from '../components/ScreenLayout';
import CharacterAvatar from '../components/CharacterAvatar';
import CharacterBubble from '../components/CharacterBubble';
import { RootStackParamList } from '../navigation/types';
import { getDiaryEntryByDate, deleteDiaryEntry } from '../storage/diaryStorage';
import { getAppSettings } from '../storage/settingsStorage';
import { DiaryEntry } from '../types';
import { formatDateJa } from '../utils/dateUtils';
import { CHARACTERS } from '../constants/characters';
import { getDetailComment } from '../utils/speech';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'DiaryDetail'>;

function formatDetailDate(targetDate: string): string {
  const [y, m, d] = targetDate.split('-');
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const wd = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  return `${formatDateJa(targetDate)}（${wd}）`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function DiaryDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { targetDate } = route.params;

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  // Current selected character — used for display and edit flow
  const [selectedCharId, setSelectedCharId] = useState<string>('leon');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      Promise.all([
        getDiaryEntryByDate(targetDate),
        getAppSettings(),
      ]).then(([e, settings]) => {
        if (!active) return;
        setEntry(e);
        setSelectedCharId(settings.selectedCharacterId);
        setLoading(false);
      });
      return () => { active = false; };
    }, [targetDate]),
  );

  // Recompute when score or selected character changes
  const characterComment = useMemo(
    () => (entry ? getDetailComment(entry.score, selectedCharId) : ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entry?.score, selectedCharId],
  );

  function handleEdit() {
    if (!entry) return;
    navigation.navigate('DiaryFlow', {
      targetDate,
      initialScore: entry.score,
      initialContent: entry.content,
      editParams: {
        id: entry.id,
        createdAt: entry.createdAt,
        characterId: selectedCharId,  // use current selected, not stored
      },
    });
  }

  function handleDelete() {
    Alert.alert(
      '削除の確認',
      'この日記を削除しますか？この操作は元に戻せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            await deleteDiaryEntry(targetDate);
            navigation.goBack();
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F5A623" />
        </View>
      </ScreenLayout>
    );
  }

  if (!entry) {
    return (
      <ScreenLayout>
        <View style={styles.center}>
          <Text style={styles.notFound}>日記が見つかりませんでした。</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.navLink}>戻る</Text>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    );
  }

  const characterName = CHARACTERS.find((c) => c.id === selectedCharId)?.name ?? selectedCharId;
  const expression = entry.score <= 40 ? 'worry' as const : 'normal' as const;

  return (
    <ScreenLayout scrollable>
      <Text style={styles.dateLabel}>{formatDetailDate(entry.targetDate)}</Text>

      {/* Character: same size/layout as DiaryConfirmScreen */}
      <View style={styles.avatarWrap}>
        <CharacterAvatar characterId={selectedCharId} size={155} bust expression={expression} />
        <Text style={styles.characterName}>{characterName}</Text>
      </View>

      <CharacterBubble
        message={characterComment}
        characterId={selectedCharId}
        showAvatar={false}
      />

      <View style={styles.card}>
        <View style={styles.scoreRow}>
          <Text style={styles.fieldLabel}>点数</Text>
          <View style={[styles.scoreBadge, scoreBadgeColor(entry.score)]}>
            <Text style={styles.scoreBadgeText}>{entry.score}点</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.fieldLabel}>日記</Text>
        {entry.content ? (
          <Text style={styles.contentText}>{entry.content}</Text>
        ) : (
          <Text style={styles.emptyText}>この日は点数だけ記録しました</Text>
        )}
      </View>

      <Text style={styles.metaText}>記録: {formatDateTime(entry.createdAt)}</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEdit}
          activeOpacity={0.8}
        >
          <Text style={styles.editButtonText}>編集</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteButtonText}>削除</Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  notFound: {
    fontSize: 16,
    color: '#888',
  },
  navLink: {
    fontSize: 15,
    color: '#F5A623',
    textDecorationLine: 'underline',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C4A2A',
    textAlign: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  avatarWrap: {
    alignItems: 'center',
    paddingTop: 6,
    marginBottom: 0,
    gap: 4,
  },
  characterName: {
    fontSize: 14,
    color: '#888',
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
    marginBottom: 6,
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
  divider: {
    height: 1,
    backgroundColor: '#F0EDE8',
    marginVertical: 6,
  },
  contentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 14,
    color: '#CCC',
    fontStyle: 'italic',
  },
  metaText: {
    fontSize: 11,
    color: '#CCC',
    textAlign: 'right',
    paddingHorizontal: 24,
    paddingBottom: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 20,
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#F5A623',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8736B',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#E8736B',
    fontWeight: '600',
  },
});
