import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import ScreenLayout from '../components/ScreenLayout';
import CharacterAvatar from '../components/CharacterAvatar';
import { CHARACTERS } from '../constants/characters';

export default function CharacterScreen() {
  const defaultChar = CHARACTERS[0];

  return (
    <ScreenLayout scrollable showAd={false}>
      <View style={styles.header}>
        <Text style={styles.title}>キャラクター</Text>
      </View>

      <View style={styles.selected}>
        <CharacterAvatar characterId={defaultChar.id} size={96} />
        <Text style={styles.charName}>{defaultChar.name}</Text>
        <View style={styles.activeTag}>
          <Text style={styles.activeTagText}>使用中</Text>
        </View>
        <Text style={styles.charDescription}>{defaultChar.description}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.lockedSection}>
        <Text style={styles.lockedTitle}>今後追加予定</Text>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.lockedCard}>
            <View style={styles.lockedAvatar}>
              <Text style={styles.lockedAvatarText}>?</Text>
            </View>
            <View style={styles.lockedInfo}>
              <Text style={styles.lockedName}>???</Text>
              <View style={styles.lockBadge}>
                <Text style={styles.lockBadgeText}>🔒 近日公開</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          今後、キャラクターを追加予定です
        </Text>
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
  selected: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  charName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  activeTag: {
    backgroundColor: '#4CAF82',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  activeTagText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  charDescription: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EDE8',
    marginHorizontal: 24,
    marginBottom: 24,
  },
  lockedSection: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  lockedTitle: {
    fontSize: 14,
    color: '#AAA',
    fontWeight: '600',
    marginBottom: 4,
  },
  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#F0EDE8',
  },
  lockedAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E0D8CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedAvatarText: {
    fontSize: 22,
    color: '#AAA',
  },
  lockedInfo: {
    gap: 6,
  },
  lockedName: {
    fontSize: 16,
    color: '#CCC',
    fontWeight: '600',
  },
  lockBadge: {
    backgroundColor: '#F5F0EA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  lockBadgeText: {
    fontSize: 12,
    color: '#AAA',
  },
  notice: {
    margin: 24,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
  },
  noticeText: {
    fontSize: 14,
    color: '#C47F00',
    textAlign: 'center',
    lineHeight: 20,
  },
});
