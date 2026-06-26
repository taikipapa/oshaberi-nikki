// Ordered longest-first to avoid prefix collisions (e.g. "じゅう" vs "じゅうい")
const TENS: [string, number][] = [
  ['きゅうじゅう', 90], ['九十', 90],
  ['はちじゅう', 80],   ['八十', 80],
  ['ななじゅう', 70],   ['しちじゅう', 70], ['七十', 70],
  ['ろくじゅう', 60],   ['六十', 60],
  ['ごじゅう', 50],     ['五十', 50],
  ['よんじゅう', 40],   ['しじゅう', 40],  ['四十', 40],
  ['さんじゅう', 30],   ['三十', 30],
  ['にじゅう', 20],     ['二十', 20],
  ['じゅう', 10],       ['十', 10],
];

const ONES: [string, number][] = [
  ['きゅう', 9], ['く', 9], ['九', 9],
  ['はち', 8],             ['八', 8],
  ['なな', 7], ['しち', 7], ['七', 7],
  ['ろく', 6],             ['六', 6],
  ['ご', 5],               ['五', 5],
  ['よん', 4], ['よ', 4], ['し', 4], ['四', 4],
  ['さん', 3],             ['三', 3],
  ['に', 2],               ['二', 2],
  ['いち', 1],             ['一', 1],
  ['ゼロ', 0], ['れい', 0], ['零', 0], ['〇', 0], ['まる', 0],
];

export function parseJapaneseScore(raw: string): number | null {
  const t = raw.replace(/[点てん\s　]/g, '');

  // Direct ASCII / fullwidth integer
  const direct = parseInt(t, 10);
  if (!isNaN(direct) && direct >= 0 && direct <= 100) return direct;

  // 100
  if (['百', 'ひゃく', 'いっぴゃく'].includes(t)) return 100;

  // Explicit zero
  if (['ゼロ', '零', '〇', 'れい', 'まる'].includes(t)) return 0;

  // Tens [+ ones] pattern
  for (const [tStr, tVal] of TENS) {
    if (t.startsWith(tStr)) {
      const rest = t.slice(tStr.length);
      if (rest === '') return tVal;
      for (const [oStr, oVal] of ONES) {
        if (rest === oStr) return tVal + oVal;
      }
      return null;
    }
  }

  // Single digit
  for (const [oStr, oVal] of ONES) {
    if (t === oStr) return oVal;
  }

  return null;
}
