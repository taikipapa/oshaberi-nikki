import { Character, SpeechSet } from '../types';

export const DEFAULT_CHARACTER_ID = 'leon';

export const SUPPORTED_CHARACTER_IDS = ['leon', 'miria', 'himari', 'chiyobaa'] as const;
export type SupportedCharacterId = (typeof SUPPORTED_CHARACTER_IDS)[number];

export function isSupportedCharacterId(id: string): id is SupportedCharacterId {
  return (SUPPORTED_CHARACTER_IDS as readonly string[]).includes(id);
}

export const CHARACTERS: Character[] = [
  {
    id: 'leon',
    name: 'レオン',
    isUnlocked: true,
    description: '元気いっぱいで前向きなキャラクター。',
    personalityType: 'cheerful',
  },
  {
    id: 'miria',
    name: 'ミリア',
    isUnlocked: true,
    description: 'やわらかくて温かいキャラクター。',
    personalityType: 'gentle',
  },
  {
    id: 'himari',
    name: 'ひまり',
    isUnlocked: true,
    description: '明るくて好奇心旺盛なキャラクター。',
    personalityType: 'cheerful',
  },
  {
    id: 'chiyobaa',
    name: '千代ばあ',
    isUnlocked: true,
    description: 'おっとりしていて包容力のあるキャラクター。',
    personalityType: 'gentle',
  },
];

export const SPEECH_SETS: Record<string, SpeechSet> = {
  leon: {
    morningGreetings: ['今日も来てくれてうれしいよ。'],
    afternoonComments: ['今日も来てくれてうれしいよ。'],
    nightGreetings: ['今日も来てくれてうれしいよ。'],
    askTodayScore: ['今日は何点くらいの日だった？'],
    askYesterdayScore: ['昨日は何点くらいの日だった？'],
    highScoreReactions: ['すごい！いい日だったんだね。どんなことがあったの？'],
    normalScoreReactions: ['まあまあの日だったんだね。どんな一日だった？'],
    lowScoreReactions: ['そっか。ゆっくり話してね。'],
    askContent: ['どんなことがあったか、教えてほしいな。'],
    saveCompleteMessages: ['話してくれてありがとう。日記として残しておくね。'],
    idleComments: ['今日も来てくれてうれしいよ。'],
    alreadyWrittenComments: ['今日の日記、ちゃんと残せてるよ。おつかれさま。'],
  },
  hana: {
    morningGreetings: [
      'おはよう。昨日の日記、まだ書いてないみたい。昨日はどんな日だった？',
      'おはよう！昨日のこと、ちょっと教えてほしいな。',
      'おはよう。昨日はどうだったか、聴かせてほしいな。',
    ],
    afternoonComments: [
      'こんにちは。今日の調子はどう？',
      'こんにちは！今日も一日、よろしくね。',
      'こんにちは。ゆっくりしてる？',
    ],
    nightGreetings: [
      'こんばんは。今日もおつかれさま。今日はどうだった？',
      'こんばんは。今日の日記、一緒に残しておこう。',
      'こんばんは。今日どんなことがあったか、聴かせてほしいな。',
    ],
    askTodayScore: [
      '今日は何点くらいの日だった？',
      '今日一日、点数をつけるとしたら何点？',
      '今日のできばえ、何点かな？',
    ],
    askYesterdayScore: [
      '昨日は何点くらいの日だった？',
      '昨日一日、点数をつけるとしたら何点？',
      '昨日のことを振り返って、何点かな？',
    ],
    highScoreReactions: [
      'いい日だったんだね。何がよかったの？',
      'すごい！いい日だったんだね。どんなことがあったの？',
      'よかったね！いい日の理由を教えてほしいな。',
    ],
    normalScoreReactions: [
      'まあまあの日だったんだね。どんなことがあった？',
      'ふつうの日か。でもそういう日も大切だよ。どんな一日だった？',
      'なかなかの日だったんだね。何かあった？',
    ],
    lowScoreReactions: [
      'そっか。今日はちょっと大変だったんだね。話せるところだけで大丈夫だよ。',
      'つらい日もあるよね。無理しないで、話せる分だけ聴かせてね。',
      'そっか。ゆっくり教えてね。話すだけで少しラクになるかもしれないよ。',
    ],
    askContent: [
      'どんなことがあったか、教えてほしいな。',
      'どんな一日だったか、聴かせてね。',
      'どんなことを話してくれる？',
    ],
    saveCompleteMessages: [
      '話してくれてありがとう。日記として残しておくね。',
      'ちゃんと聴いたよ。大切に残しておくね。',
      'ありがとう。今日のこと、覚えておくよ。',
    ],
    idleComments: [
      '今日も一日、おつかれさま。',
      'いつでも話しかけてね。',
      'ゆっくり休んでね。',
    ],
    alreadyWrittenComments: [
      '今日の日記、ちゃんと残せてるよ。おつかれさま。',
      '日記、書けてるよ。えらい！',
      '今日のこと、ちゃんと記録できてるよ。',
    ],
  },
};
