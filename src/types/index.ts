export interface DiaryEntry {
  id: string;
  targetDate: string; // YYYY-MM-DD
  score: number;
  content: string;
  characterId: string;
  characterComment: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface Character {
  id: string;
  name: string;
  description: string;
  personalityType: string;
  unlockedByDefault: boolean;
  unlockType: 'default' | 'reward_ad';
  sortOrder: number;
  lockedDescription?: string;
}

export interface SpeechSet {
  morningGreetings: string[];
  afternoonComments: string[];
  nightGreetings: string[];
  askTodayScore: string[];
  askYesterdayScore: string[];
  highScoreReactions: string[];
  normalScoreReactions: string[];
  lowScoreReactions: string[];
  askContent: string[];
  saveCompleteMessages: string[];
  idleComments: string[];
  alreadyWrittenComments: string[];
}

export type TimePeriod = 'morning' | 'daytime' | 'evening';

export type DiaryFlowParams = {
  targetDate: string;
};

export type DiaryConfirmParams = {
  targetDate: string;
  score: number;
  content: string;
};

export type DiaryDetailParams = {
  targetDate: string;
};
