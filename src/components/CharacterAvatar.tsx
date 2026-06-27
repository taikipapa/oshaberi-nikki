import React from 'react';
import { Image } from 'react-native';

export type CharacterExpression = 'normal' | 'happy' | 'worry';

// require() paths must be string literals — Metro resolves them at build time.
const CHARACTER_IMAGES: Record<string, Record<CharacterExpression, ReturnType<typeof require>>> = {
  leon: {
    normal: require('../../assets/characters/leon_normal.png'),
    happy:  require('../../assets/characters/leon_happy.png'),
    worry:  require('../../assets/characters/leon_worry.png'),
  },
  miria: {
    normal: require('../../assets/characters/miria_normal.png'),
    happy:  require('../../assets/characters/miria_happy.png'),
    worry:  require('../../assets/characters/miria_worry.png'),
  },
  himari: {
    normal: require('../../assets/characters/himari_normal.png'),
    happy:  require('../../assets/characters/himari_happy.png'),
    worry:  require('../../assets/characters/himari_worry.png'),
  },
  chiyobaa: {
    normal: require('../../assets/characters/chiyobaa_normal.png'),
    happy:  require('../../assets/characters/chiyobaa_happy.png'),
    worry:  require('../../assets/characters/chiyobaa_worry.png'),
  },
};

const LEON_NORMAL = CHARACTER_IMAGES['leon']['normal'];

interface Props {
  characterId?: string;
  size?: number;
  bust?: boolean;
  expression?: CharacterExpression;
}

export default function CharacterAvatar({
  characterId = 'leon',
  size = 80,
  bust = false,
  expression = 'normal',
}: Props) {
  // Fallback chain: requested expression → same character normal → leon normal
  const charImages = CHARACTER_IMAGES[characterId] ?? CHARACTER_IMAGES['leon'];
  const source = charImages[expression] ?? charImages['normal'] ?? LEON_NORMAL;

  return (
    <Image
      source={source}
      style={
        bust
          ? { width: size, height: Math.round(size * 1.3) }
          : { width: size, height: size, borderRadius: size / 2 }
      }
      resizeMode="contain"
    />
  );
}
