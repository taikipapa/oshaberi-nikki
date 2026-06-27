import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import ScreenLayout from '../components/ScreenLayout';
import CharacterAvatar from '../components/CharacterAvatar';
import { CHARACTERS } from '../constants/characters';
import { Character } from '../types';
import { getAppSettings, updateAppSettings } from '../storage/settingsStorage';
import { showRewardedAdForCharacterUnlock } from '../services/rewardedAds';

// Bust avatar dimensions at size=88 — must match CharacterAvatar's bust calculation.
const AVATAR_WIDTH = 88;
const AVATAR_HEIGHT = Math.round(88 * 1.3); // 114

export default function CharacterScreen() {
  const [selectedId, setSelectedId] = useState('leon');
  const [unlockedIds, setUnlockedIds] = useState<string[]>(['leon', 'miria', 'himari', 'chiyobaa']);
  // Prevents useFocusEffect async read from overwriting state while a write is in flight.
  const savingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAppSettings().then((s) => {
        if (active && !savingRef.current) {
          setSelectedId(s.selectedCharacterId);
          setUnlockedIds(s.unlockedCharacterIds);
        }
      });
      return () => { active = false; };
    }, []),
  );

  async function handleSelect(id: string) {
    if (id === selectedId || savingRef.current) return;
    savingRef.current = true;
    setSelectedId(id);
    try {
      await updateAppSettings({ selectedCharacterId: id });
    } catch {
      const s = await getAppSettings();
      setSelectedId(s.selectedCharacterId);
    } finally {
      savingRef.current = false;
    }
  }

  async function handleUnlockPress(ch: Character) {
    if (savingRef.current) return;
    const earned = await showRewardedAdForCharacterUnlock(ch.id);
    if (!earned) return;

    savingRef.current = true;
    const newIds = [...unlockedIds, ch.id];
    setUnlockedIds(newIds);
    try {
      await updateAppSettings({ unlockedCharacterIds: newIds });
    } catch {
      const s = await getAppSettings();
      setUnlockedIds(s.unlockedCharacterIds);
    } finally {
      savingRef.current = false;
    }
  }

  const sortedCharacters = [...CHARACTERS].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <ScreenLayout scrollable showAd={false}>
      <View style={styles.header}>
        <Text style={styles.title}>キャラクター</Text>
        <Text style={styles.subtitle}>話し相手を選んでください</Text>
      </View>

      <View style={styles.grid}>
        {sortedCharacters.map((ch) => {
          const isUnlocked = unlockedIds.includes(ch.id);
          const isActive = isUnlocked && ch.id === selectedId;

          if (!isUnlocked) {
            return (
              <TouchableOpacity
                key={ch.id}
                style={[styles.card, styles.cardLocked]}
                onPress={() => handleUnlockPress(ch)}
                activeOpacity={0.85}
              >
                <View style={styles.lockedAvatarWrap}>
                  <CharacterAvatar characterId={ch.id} size={AVATAR_WIDTH} bust />
                  <View style={styles.lockedOverlay}>
                    <Text style={styles.lockEmoji}>🔒</Text>
                  </View>
                </View>

                <Text style={[styles.charName, styles.charNameLocked]}>{ch.name}</Text>
                <Text style={[styles.charDesc, styles.charDescLocked]}>{ch.description}</Text>

                <Text style={styles.lockedLabel}>ロック中</Text>
                <View style={[styles.badge, styles.badgeLocked]}>
                  <Text style={[styles.badgeText, styles.badgeTextLocked]}>広告を見て解放</Text>
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={ch.id}
              style={[styles.card, isActive && styles.cardActive]}
              onPress={() => handleSelect(ch.id)}
              disabled={isActive}
              activeOpacity={0.85}
            >
              <CharacterAvatar characterId={ch.id} size={AVATAR_WIDTH} bust />
              <Text style={styles.charName}>{ch.name}</Text>
              <Text style={styles.charDesc}>{ch.description}</Text>

              {/* Badge: identical container dimensions in both states — only colors change. */}
              <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                  {isActive ? '使用中' : '選ぶ'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5C4A2A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#AAA',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 24,
    gap: 12,
    justifyContent: 'center',
  },
  card: {
    width: 155,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#F0EDE8',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardActive: {
    borderColor: '#F5A623',
    backgroundColor: '#FFFAF5',
  },
  cardLocked: {
    borderColor: '#E0DDD8',
    backgroundColor: '#F8F7F5',
  },
  // Avatar overlay for locked cards.
  lockedAvatarWrap: {
    width: AVATAR_WIDTH,
    height: AVATAR_HEIGHT,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: AVATAR_WIDTH,
    height: AVATAR_HEIGHT,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockEmoji: {
    fontSize: 28,
  },
  charName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  charNameLocked: {
    color: '#BBB',
  },
  charDesc: {
    fontSize: 12,
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 18,
  },
  charDescLocked: {
    color: '#CCC',
  },
  lockedLabel: {
    fontSize: 11,
    color: '#BBB',
    fontWeight: '600',
  },
  // Shared badge container — layout dimensions stay identical across states.
  badge: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginTop: 4,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  badgeInactive: {
    backgroundColor: 'transparent',
    borderColor: '#F5A623',
  },
  badgeLocked: {
    backgroundColor: '#999',
    borderColor: '#999',
    paddingHorizontal: 10,
    minWidth: 0,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F5A623',
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
  badgeTextLocked: {
    color: '#FFFFFF',
    fontSize: 11,
  },
});
