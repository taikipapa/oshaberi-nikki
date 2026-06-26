import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CharacterAvatar from './CharacterAvatar';

interface Props {
  message: string;
  characterId?: string;
}

export default function CharacterBubble({ message, characterId }: Props) {
  return (
    <View style={styles.row}>
      <CharacterAvatar characterId={characterId} size={56} />
      <View style={styles.bubble}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  bubble: {
    flex: 1,
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
  },
  text: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
});
