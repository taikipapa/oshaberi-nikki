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
import { getAppSettings, updateAppSettings } from '../storage/settingsStorage';

export default function CharacterScreen() {
  const [selectedId, setSelectedId] = useState('leon');
  // savingRef prevents the useFocusEffect's async settings read from overwriting
  // selectedId while a write is in flight.
  const savingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAppSettings().then((s) => {
        // Skip if a save started after this read began — handleSelect already
        // updated selectedId optimistically and the storage has the new value.
        if (active && !savingRef.current) setSelectedId(s.selectedCharacterId);
      });
      return () => { active = false; };
    }, []),
  );

  async function handleSelect(id: string) {
    if (id === selectedId || savingRef.current) return;
    savingRef.current = true;
    // Optimistic update: renders the new selection immediately with no intermediate state.
    setSelectedId(id);
    try {
      await updateAppSettings({ selectedCharacterId: id });
    } catch {
      // Storage write failed — revert to persisted value.
      const s = await getAppSettings();
      setSelectedId(s.selectedCharacterId);
    } finally {
      savingRef.current = false;
    }
  }

  return (
    <ScreenLayout scrollable showAd={false}>
      <View style={styles.header}>
        <Text style={styles.title}>キャラクター</Text>
        <Text style={styles.subtitle}>話し相手を選んでください</Text>
      </View>

      <View style={styles.grid}>
        {CHARACTERS.map((ch) => {
          const isActive = ch.id === selectedId;
          return (
            <TouchableOpacity
              key={ch.id}
              style={[styles.card, isActive && styles.cardActive]}
              onPress={() => handleSelect(ch.id)}
              disabled={isActive}
              activeOpacity={0.85}
            >
              <CharacterAvatar characterId={ch.id} size={88} bust />
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
  charName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  charDesc: {
    fontSize: 12,
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Shared badge container — all layout properties are identical in both states.
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
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F5A623',
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
});
