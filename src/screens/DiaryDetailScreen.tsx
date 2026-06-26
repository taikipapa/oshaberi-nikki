import React, { useCallback, useState } from 'react';
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
import CharacterBubble from '../components/CharacterBubble';
import { RootStackParamList } from '../navigation/types';
import { getDiaryEntryByDate, deleteDiaryEntry } from '../storage/diaryStorage';
import { DiaryEntry } from '../types';
import { getDiaryDateInfo } from '../utils/dateUtils';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'DiaryDetail'>;

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

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      getDiaryEntryByDate(targetDate).then((e) => {
        if (!active) return;
        setEntry(e);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [targetDate]),
  );

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

  function handleEdit() {
    Alert.alert('編集', '日記の編集機能は後で実装します。');
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
            <Text style={styles.backLink}>戻る</Text>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout scrollable>
      {(() => {
        const info = getDiaryDateInfo(entry.targetDate);
        return (
          <View style={styles.header}>
            <Text style={styles.dateLabel}>{info.title}</Text>
            {info.sub !== null && (
              <Text style={styles.dateSub}>{info.sub}</Text>
            )}
          </View>
        );
      })()}

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

      <CharacterBubble
        message={entry.characterComment}
        characterId={entry.characterId}
      />

      <View style={styles.metaBlock}>
        <Text style={styles.metaText}>記録日時: {formatDateTime(entry.createdAt)}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEdit}
          activeOpacity={0.8}
        >
          <Text style={styles.editButtonText}>編集（準備中）</Text>
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
  backLink: {
    fontSize: 15,
    color: '#F5A623',
    textDecorationLine: 'underline',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5C4A2A',
    textAlign: 'center',
  },
  dateSub: {
    fontSize: 13,
    color: '#AAA',
    textAlign: 'center',
    marginTop: 2,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
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
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
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
  divider: {
    height: 1,
    backgroundColor: '#F0EDE8',
    marginVertical: 8,
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
  metaBlock: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#BBB',
  },
  actions: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  editButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0D8CC',
  },
  editButtonText: {
    fontSize: 16,
    color: '#AAA',
  },
  deleteButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
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
