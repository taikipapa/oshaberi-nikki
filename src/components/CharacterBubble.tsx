import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CharacterAvatar from './CharacterAvatar';

interface Props {
  message: string;
  characterId?: string;
  showAvatar?: boolean;
}

export default function CharacterBubble({ message, characterId, showAvatar = true }: Props) {
  return (
    <View style={styles.row}>
      {showAvatar && <CharacterAvatar characterId={characterId} size={56} />}
      <View style={[styles.bubble, !showAvatar && styles.bubbleNoAvatar]}>
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
  bubbleNoAvatar: {
    borderTopLeftRadius: 16,
  },
  text: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    textAlign: 'center',
  },
});
