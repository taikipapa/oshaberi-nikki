import React from 'react';
import { Image } from 'react-native';

// require() paths must be string literals — Metro resolves them at build time.
const CHARACTER_IMAGES: Record<string, { normal: ReturnType<typeof require> }> = {
  leon:     { normal: require('../../assets/characters/leon_normal.png') },
  miria:    { normal: require('../../assets/characters/miria_normal.png') },
  himari:   { normal: require('../../assets/characters/himari_normal.png') },
  chiyobaa: { normal: require('../../assets/characters/chiyobaa_normal.png') },
};

const FALLBACK_IMAGE = CHARACTER_IMAGES['leon'];

interface Props {
  characterId?: string;
  size?: number;
  bust?: boolean;
}

export default function CharacterAvatar({
  characterId = 'leon',
  size = 80,
  bust = false,
}: Props) {
  const imgs = CHARACTER_IMAGES[characterId] ?? FALLBACK_IMAGE;
  return (
    <Image
      source={imgs.normal}
      style={
        bust
          ? { width: size, height: Math.round(size * 1.3) }
          : { width: size, height: size, borderRadius: size / 2 }
      }
      resizeMode="contain"
    />
  );
}
