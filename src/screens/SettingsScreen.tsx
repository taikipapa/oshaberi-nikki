import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import ScreenLayout from '../components/ScreenLayout';
import {
  getAppSettings,
  updateAppSettings,
  AppSettings,
  InputMethod,
} from '../storage/settingsStorage';

const APP_VERSION = '0.1.0';

const DEFAULT_SETTINGS: AppSettings = {
  scoreInputMethod: 'voice',
  contentInputMethod: 'voice',
  selectedCharacterId: 'leon',
  unlockedCharacterIds: ['leon', 'miria', 'himari', 'chiyobaa'],
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getAppSettings().then(setSettings);
  }, []);

  async function handleSet(key: keyof AppSettings, value: InputMethod) {
    const updated = await updateAppSettings({ [key]: value });
    setSettings(updated);
  }

  return (
    <ScreenLayout scrollable showAd={false}>
      <View style={styles.header}>
        <Text style={styles.title}>設定</Text>
      </View>

      {/* ── 点数の入力方法 ── */}
      <View style={styles.inputSection}>
        <Text style={styles.sectionLabel}>点数の入力方法</Text>
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              settings.scoreInputMethod === 'voice' && styles.segmentBtnActive,
            ]}
            onPress={() => handleSet('scoreInputMethod', 'voice')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                settings.scoreInputMethod === 'voice' && styles.segmentTextActive,
              ]}
            >
              🎤 音声で入力
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              settings.scoreInputMethod === 'manual' && styles.segmentBtnActive,
            ]}
            onPress={() => handleSet('scoreInputMethod', 'manual')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                settings.scoreInputMethod === 'manual' && styles.segmentTextActive,
              ]}
            >
              🔢 数字で入力
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 日記内容の入力方法 ── */}
      <View style={styles.inputSection}>
        <Text style={styles.sectionLabel}>日記内容の入力方法</Text>
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              settings.contentInputMethod === 'voice' && styles.segmentBtnActive,
            ]}
            onPress={() => handleSet('contentInputMethod', 'voice')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                settings.contentInputMethod === 'voice' && styles.segmentTextActive,
              ]}
            >
              🎤 音声で入力
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              settings.contentInputMethod === 'manual' && styles.segmentBtnActive,
            ]}
            onPress={() => handleSet('contentInputMethod', 'manual')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                settings.contentInputMethod === 'manual' && styles.segmentTextActive,
              ]}
            >
              ✏️ 文字で入力
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── アプリ情報 ── */}
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

  // ── Input method sections ──────────────────────────────────

  inputSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#AAA',
    fontWeight: '600',
    paddingLeft: 4,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E0D8CC',
  },
  segmentBtnActive: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#AAA',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },

  // ── App info ───────────────────────────────────────────────

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
    borderWidth: 1,
    borderColor: '#F0EDE8',
  },
  noticeText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 22,
  },
});
