import { DEFAULT_CHARACTER_ID, SPEECH_SETS } from '../constants/characters';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getSpeechSet(characterId: string = DEFAULT_CHARACTER_ID) {
  return SPEECH_SETS[characterId] ?? SPEECH_SETS[DEFAULT_CHARACTER_ID];
}

export function getMorningGreeting(characterId?: string): string {
  return pickRandom(getSpeechSet(characterId).morningGreetings);
}

export function getAfternoonComment(characterId?: string): string {
  return pickRandom(getSpeechSet(characterId).afternoonComments);
}

export function getNightGreeting(characterId?: string): string {
  return pickRandom(getSpeechSet(characterId).nightGreetings);
}

export function getAskTodayScore(characterId?: string): string {
  return pickRandom(getSpeechSet(characterId).askTodayScore);
}

export function getAskYesterdayScore(characterId?: string): string {
  return pickRandom(getSpeechSet(characterId).askYesterdayScore);
}

export function getScoreReaction(score: number, characterId?: string): string {
  const set = getSpeechSet(characterId);
  if (score >= 80) return pickRandom(set.highScoreReactions);
  if (score >= 50) return pickRandom(set.normalScoreReactions);
  return pickRandom(set.lowScoreReactions);
}

export function getAskContent(characterId?: string): string {
  return pickRandom(getSpeechSet(characterId).askContent);
}

export function getSaveCompleteMessage(characterId?: string): string {
  return pickRandom(getSpeechSet(characterId).saveCompleteMessages);
}

export function getIdleComment(characterId?: string): string {
  return pickRandom(getSpeechSet(characterId).idleComments);
}

export function getAlreadyWrittenComment(characterId?: string): string {
  return pickRandom(getSpeechSet(characterId).alreadyWrittenComments);
}
