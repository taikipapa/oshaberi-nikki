import { Character, SpeechSet } from '../types';

export const DEFAULT_CHARACTER_ID = 'leon';

export const SUPPORTED_CHARACTER_IDS = [
  'leon', 'miria', 'himari', 'chiyobaa',
  'serina', 'kaito', 'haru', 'sakura',
] as const;
export type SupportedCharacterId = (typeof SUPPORTED_CHARACTER_IDS)[number];

export function isSupportedCharacterId(id: string): id is SupportedCharacterId {
  return (SUPPORTED_CHARACTER_IDS as readonly string[]).includes(id);
}

export const CHARACTERS: Character[] = [
  {
    id: 'leon',
    name: 'レオン',
    description: '元気いっぱいで前向きなキャラクター。',
    personalityType: 'cheerful',
    unlockedByDefault: true,
    unlockType: 'default',
    sortOrder: 1,
  },
  {
    id: 'miria',
    name: 'ミリア',
    description: 'やわらかくて温かいキャラクター。',
    personalityType: 'gentle',
    unlockedByDefault: true,
    unlockType: 'default',
    sortOrder: 2,
  },
  {
    id: 'himari',
    name: 'ひまり',
    description: '明るくて好奇心旺盛なキャラクター。',
    personalityType: 'cheerful',
    unlockedByDefault: true,
    unlockType: 'default',
    sortOrder: 3,
  },
  {
    id: 'chiyobaa',
    name: '千代ばあ',
    description: 'おっとりしていて包容力のあるキャラクター。',
    personalityType: 'gentle',
    unlockedByDefault: true,
    unlockType: 'default',
    sortOrder: 4,
  },
  {
    id: 'serina',
    name: 'セリナ',
    description: 'ミステリアスで知的なキャラクター。',
    personalityType: 'cool',
    unlockedByDefault: false,
    unlockType: 'reward_ad',
    sortOrder: 5,
    lockedDescription: '広告を見て解放しよう！',
  },
  {
    id: 'kaito',
    name: 'カイト',
    description: 'クールで頼れるキャラクター。',
    personalityType: 'cool',
    unlockedByDefault: false,
    unlockType: 'reward_ad',
    sortOrder: 6,
    lockedDescription: '広告を見て解放しよう！',
  },
  {
    id: 'haru',
    name: 'ハル',
    description: 'のんびりやわらかいキャラクター。',
    personalityType: 'gentle',
    unlockedByDefault: false,
    unlockType: 'reward_ad',
    sortOrder: 7,
    lockedDescription: '広告を見て解放しよう！',
  },
  {
    id: 'sakura',
    name: 'さくら',
    description: 'はなやかで元気なキャラクター。',
    personalityType: 'cheerful',
    unlockedByDefault: false,
    unlockType: 'reward_ad',
    sortOrder: 8,
    lockedDescription: '広告を見て解放しよう！',
  },
];

export const SPEECH_SETS: Record<string, SpeechSet> = {
  leon: {
    morningGreetings: [
      'おはよう！昨日のこと、少し聞かせてくれる？',
      'おはよう。今日も来てくれてうれしいよ。',
      'おはよう！昨日どんな日だったか、教えてほしいな。',
    ],
    afternoonComments: [
      'こんにちは！今日の調子はどう？',
      '今日も来てくれたね。',
      '今日はゆっくりできてる？',
    ],
    nightGreetings: [
      'こんばんは。今日もおつかれさま。',
      '今日もよく頑張ったね。',
      '今日どんなことがあったか、聞かせてほしいな。',
    ],
    askTodayScore: [
      '今日は何点くらいの日だった？',
      '今日一日、何点だった？',
      '今日のでき、点数にするなら何点？',
    ],
    askYesterdayScore: [
      '昨日は何点くらいだった？',
      '昨日の日、何点だった？',
      '昨日を振り返って、何点かな？',
    ],
    highScoreReactions: [
      '今日はいい日だったみたいだね。僕も嬉しいよ。',
      '君の嬉しかったこと、ぜひ聞かせてほしいな。',
      '素敵な一日だったんだね。その気持ちを残しておこう。',
    ],
    normalScoreReactions: [
      '今日はそんな日だったんだね。少し聞かせてくれる？',
      '君の今日を、ここに残しておこう。',
      'よかったことも疲れたことも、どちらも大切だよ。',
    ],
    lowScoreReactions: [
      '今日は少しつらかったのかな。無理しなくていいよ。',
      '君が話せる分だけで大丈夫。僕はちゃんと聞いているよ。',
      'そんな日もあるよ。ここに来てくれただけで十分だよ。',
    ],
    askContent: [
      'どんなことがあったか、教えてほしいな。',
      '今日のことを少し話してくれる？',
      '君の一日を聞かせてよ。',
    ],
    saveCompleteMessages: [
      '今日の日記を残せたね。話してくれてありがとう。',
      '大切に残しておくよ。',
      'ちゃんと聞いたよ。また話しかけてね。',
    ],
    idleComments: [
      '今日も来てくれてうれしいよ。',
      'いつでも話しかけてね。',
      'ゆっくりしていってね。',
    ],
    alreadyWrittenComments: [
      '今日の日記、ちゃんと残せてるよ。おつかれさま。',
      '日記、書けてるね。えらいよ。',
      '今日のこと、ちゃんと記録できてるよ。',
    ],
  },

  miria: {
    morningGreetings: [
      'おはようございます。昨日のこと、聞かせていただけますか？',
      'おはようございます。今日もお会いできてうれしいです。',
      'おはようございます。昨日はいかがでしたか？',
    ],
    afternoonComments: [
      'こんにちは。本日はいかがお過ごしですか？',
      'こんにちは。今日もお越しくださりありがとうございます。',
      'こんにちは。少しお話しいたしましょう。',
    ],
    nightGreetings: [
      'こんばんは。本日もお疲れさまでした。',
      'こんばんは。今日はいかがでしたか？',
      'こんばんは。少しだけお時間をいただけますか？',
    ],
    askTodayScore: [
      '本日は何点くらいの一日でしたか？',
      '今日一日を点数にするとしたら、何点でしょう？',
      '今日のお気持ち、点数でお聞かせくださいませ。',
    ],
    askYesterdayScore: [
      '昨日は何点くらいの一日でしたか？',
      '昨日を振り返って、何点くらいでしたでしょう？',
      '昨日のご様子、点数でお聞かせくださいませ。',
    ],
    highScoreReactions: [
      '本日は良い一日だったのですね。私もうれしいです。',
      'その素敵なお気持ち、ぜひ記録しておきましょう。',
      '嬉しかったことを残すのは、とても素敵でございます。',
    ],
    normalScoreReactions: [
      '本日もいろいろありましたね。よろしければお聞かせくださいませ。',
      '今日のお気持ちを、少し整理してまいりましょう。',
      'あなたの一日を、丁寧に残してまいりましょう。',
    ],
    lowScoreReactions: [
      '今日はお疲れだったのですね。少しだけでもお話しくださいませ。',
      '無理に元気を出さなくても大丈夫でございます。',
      'ここでは安心して、今のお気持ちを置いていってくださいませ。',
    ],
    askContent: [
      'どのようなことがおありでしたか？',
      '今日のご様子を、少しお話しくださいませ。',
      'よろしければ、今日のことをお聞かせくださいませ。',
    ],
    saveCompleteMessages: [
      '本日の日記を保存いたしました。お話しくださりありがとうございます。',
      'しっかり受け取りました。またいつでもどうぞ。',
      '大切に残しておきますね。今日もありがとうございます。',
    ],
    idleComments: [
      '今日もお会いできてうれしいです。',
      'いつでもお話しにいらしてください。',
      'ゆっくりされてくださいませ。',
    ],
    alreadyWrittenComments: [
      '本日の日記はちゃんと残っておりますよ。',
      '今日の記録、ちゃんとできておりますよ。おつかれさまです。',
      'すでに日記を書かれているのですね。素晴らしいですわ。',
    ],
  },

  himari: {
    morningGreetings: [
      '先輩、おはようございます！昨日のこと教えてください！',
      'おはようございます！今日も来てくれてうれしいです！',
      '先輩、おはよう！昨日どうでしたか？',
    ],
    afternoonComments: [
      '先輩、こんにちは！今日はどんな感じですか？',
      'こんにちは！ひまり、ここで待ってましたよ！',
      '先輩に会えてよかったです！',
    ],
    nightGreetings: [
      '先輩、こんばんは！今日もおつかれさまでした！',
      'こんばんは！今日のこと、聞かせてくれますか？',
      '先輩、今日もよく頑張りましたね！',
    ],
    askTodayScore: [
      '先輩、今日は何点の日でしたか？',
      '今日一日、点数をつけるとしたら何点ですか？',
      '今日のでき、何点くらいですか？',
    ],
    askYesterdayScore: [
      '先輩、昨日は何点の日でしたか？',
      '昨日を振り返って何点でしたか？',
      '昨日、何点くらいだと思いますか？',
    ],
    highScoreReactions: [
      '先輩、今日はいい日だったんですね！すごく聞きたいです！',
      'やったー！先輩の楽しかったこと、教えてください！',
      'その嬉しい気持ち、日記に残しましょう！',
    ],
    normalScoreReactions: [
      '先輩、今日はどんな日でしたか？聞かせてください！',
      '今日のこと、ひまりに教えてください！',
      'ちょっとだけでも大丈夫です。一緒に書きましょう！',
    ],
    lowScoreReactions: [
      '先輩、大丈夫ですか？ひまり、ちゃんと聞きます！',
      '今日はしんどかったんですね。でも来てくれてうれしいです。',
      '少しだけでも大丈夫です。先輩の味方です！',
    ],
    askContent: [
      'どんなことがあったか、教えてください！',
      '先輩の今日のこと、ひまりに聞かせてくれますか？',
      '今日のこと、少しでも教えてほしいです！',
    ],
    saveCompleteMessages: [
      '保存できました！先輩、今日もすごいです！',
      'ちゃんと残せましたよ！また話しかけてくださいね！',
      '日記、完成です！先輩、えらいです！',
    ],
    idleComments: [
      '先輩、今日も来てくれてうれしいです！',
      'いつでも話しかけてくださいね！',
      'ひまり、ここにいますよ！',
    ],
    alreadyWrittenComments: [
      '先輩、今日の日記もう書けてますよ！えらい！',
      'ちゃんと残せてますよ！すごいです！',
      '今日の記録バッチリです！先輩さすが！',
    ],
  },

  chiyobaa: {
    morningGreetings: [
      'おはようよ。昨日はどうだったか話しておくれよ。',
      'おはよう。ばあちゃん、ちゃんと待っとったよ。',
      'おはようねぇ。昨日のこと聞かせておくれよ。',
    ],
    afternoonComments: [
      'こんにちはよ。今日はどんな感じじゃね？',
      '来てくれたねぇ。ゆっくりしていきなさい。',
      '今日も来てくれてよかったよ。',
    ],
    nightGreetings: [
      'こんばんはよ。今日もおつかれさんじゃったね。',
      'こんばんはねぇ。今日はどうじゃったね？',
      '今日もよう頑張ったよ。少し話しておくれよ。',
    ],
    askTodayScore: [
      '今日は何点くらいの日だったんだい？',
      '今日一日、点数にするとしたら何点じゃね？',
      '今日のでき、何点くらいかね？',
    ],
    askYesterdayScore: [
      '昨日は何点くらいの日じゃったんだい？',
      '昨日を振り返って、何点くらいかね？',
      '昨日のこと、何点くらいだと思うかね？',
    ],
    highScoreReactions: [
      '今日はええ日だったんだねぇ。ばあちゃんもうれしいよ。',
      'その嬉しい気持ち、忘れんように残しておこうねぇ。',
      'よかったねぇ。どんなことがあったのか聞かせておくれ。',
    ],
    normalScoreReactions: [
      '今日はどんな一日だったんだい？',
      'うれしかったことも、疲れたことも、少し話してごらん。',
      '今日のことを、ここに残しておこうねぇ。',
    ],
    lowScoreReactions: [
      '今日はしんどかったんだねぇ。よう来たねぇ。',
      '無理せんでええんじゃよ。少し話してごらん。',
      'あんたは今日もよう頑張ったよ。ばあちゃん、ちゃんと聞いとるからねぇ。',
    ],
    askContent: [
      'どんなことがあったのか、話してごらんよ。',
      '今日のこと、少し聞かせておくれよ。',
      '何があったのか、ばあちゃんに教えておくれよ。',
    ],
    saveCompleteMessages: [
      'ちゃんと保存できたよ。今日もよう書けたねぇ。',
      '大切に残しておくからねぇ。また話しかけておくれよ。',
      'ちゃんと聞いたよ。今日もおつかれさんじゃったね。',
    ],
    idleComments: [
      '今日も来てくれてよかったよ。',
      'いつでも話しかけておくれよ。',
      'ゆっくりしていきなさい。',
    ],
    alreadyWrittenComments: [
      '今日の日記、ちゃんと残せてるよ。えらかったねぇ。',
      '日記、書けてるよ。今日もよう頑張ったね。',
      '今日のこと、ちゃんと記録できてるよ。おつかれさまねぇ。',
    ],
  },

  // Kept for backward compatibility with any stored diary entries that reference 'hana'.
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
