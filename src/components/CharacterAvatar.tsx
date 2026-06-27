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
  serina: {
    normal: require('../../assets/characters/serina_normal.png'),
    happy:  require('../../assets/characters/serina_happy.png'),
    worry:  require('../../assets/characters/serina_worry.png'),
  },
  kaito: {
    normal: require('../../assets/characters/kaito_normal.png'),
    happy:  require('../../assets/characters/kaito_happy.png'),
    worry:  require('../../assets/characters/kaito_worry.png'),
  },
  haru: {
    normal: require('../../assets/characters/haru_normal.png'),
    happy:  require('../../assets/characters/haru_happy.png'),
    worry:  require('../../assets/characters/haru_worry.png'),
  },
  sakura: {
    normal: require('../../assets/characters/sakura_normal.png'),
    happy:  require('../../assets/characters/sakura_happy.png'),
    worry:  require('../../assets/characters/sakura_worry.png'),
  },
  genjii: {
    normal: require('../../assets/characters/genjii_normal.png'),
    happy:  require('../../assets/characters/genjii_happy.png'),
    worry:  require('../../assets/characters/genjii_worry.png'),
  },
  aoi: {
    normal: require('../../assets/characters/aoi_normal.png'),
    happy:  require('../../assets/characters/aoi_happy.png'),
    worry:  require('../../assets/characters/aoi_worry.png'),
  },
  tsubaki: {
    normal: require('../../assets/characters/tsubaki_normal.png'),
    happy:  require('../../assets/characters/tsubaki_happy.png'),
    worry:  require('../../assets/characters/tsubaki_worry.png'),
  },
  yui: {
    normal: require('../../assets/characters/yui_normal.png'),
    happy:  require('../../assets/characters/yui_happy.png'),
    worry:  require('../../assets/characters/yui_worry.png'),
  },
  pontarou: {
    normal: require('../../assets/characters/pontarou_normal.png'),
    happy:  require('../../assets/characters/pontarou_happy.png'),
    worry:  require('../../assets/characters/pontarou_worry.png'),
  },
  takeru: {
    normal: require('../../assets/characters/takeru_normal.png'),
    happy:  require('../../assets/characters/takeru_happy.png'),
    worry:  require('../../assets/characters/takeru_worry.png'),
  },
  emi: {
    normal: require('../../assets/characters/emi_normal.png'),
    happy:  require('../../assets/characters/emi_happy.png'),
    worry:  require('../../assets/characters/emi_worry.png'),
  },
  lulu: {
    normal: require('../../assets/characters/lulu_normal.png'),
    happy:  require('../../assets/characters/lulu_happy.png'),
    worry:  require('../../assets/characters/lulu_worry.png'),
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
