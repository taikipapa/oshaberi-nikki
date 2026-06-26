import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import ScreenLayout from '../components/ScreenLayout';

const APP_VERSION = '0.1.0';

export default function SettingsScreen() {
  return (
    <ScreenLayout scrollable showAd={false}>
      <View style={styles.header}>
        <Text style={styles.title}>設定</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>アプリ名</Text>
          <Text style={styles.rowValue}>おしゃべり日記</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>バージョン</Text>
          <Text style={styles.rowValue}>{APP_VERSION}</Text>
        </View>
      </View>

      <View style={styles.noticeSection}>
        <Text style={styles.noticeTitle}>今後の予定</Text>
        <View style={styles.noticeCard}>
          <Text style={styles.noticeItem}>🎤 音声入力は今後実装予定</Text>
          <Text style={styles.noticeItem}>📢 広告は今後実装予定</Text>
          <Text style={styles.noticeItem}>🌟 追加キャラクターは今後実装予定</Text>
          <Text style={styles.noticeItem}>☁️ クラウド同期は今後実装予定</Text>
        </View>
      </View>

      <View style={styles.dataSection}>
        <Text style={styles.noticeTitle}>データについて</Text>
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            日記データはこのデバイスにのみ保存されます。アプリを削除するとデータも消えます。
          </Text>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5C4A2A',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowLabel: {
    fontSize: 15,
    color: '#555',
  },
  rowValue: {
    fontSize: 15,
    color: '#888',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EDE8',
    marginHorizontal: 16,
  },
  noticeSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  dataSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 10,
  },
  noticeTitle: {
    fontSize: 13,
    color: '#AAA',
    fontWeight: '600',
    paddingLeft: 4,
  },
  noticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#F0EDE8',
  },
  noticeItem: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  noticeText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 22,
  },
});
