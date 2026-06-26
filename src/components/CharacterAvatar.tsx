import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CHARACTERS, DEFAULT_CHARACTER_ID } from '../constants/characters';

interface Props {
  characterId?: string;
  size?: number;
}

export default function CharacterAvatar({
  characterId = DEFAULT_CHARACTER_ID,
  size = 80,
}: Props) {
  const character = CHARACTERS.find((c) => c.id === characterId);
  const initial = character?.name.charAt(0) ?? 'ハ';

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: '#F5C97A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
