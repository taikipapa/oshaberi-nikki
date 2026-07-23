import type { DiaryFlowOrigin } from '../navigation/types';

// One-shot ref written by DiaryConfirmScreen before navigating back to Home.
// HomeScreen reads and consumes it in useFocusEffect to restore editing state
// instead of resetting to idle. Null between uses.
export type ResumeEditState = {
  origin: Extract<DiaryFlowOrigin, 'home'>;
  flowId: string;
  targetDate: string;
  score: number;
  content: string;
  characterId: string;
  characterComment: string;
};

export const pendingResumeRef: { current: ResumeEditState | null } = {
  current: null,
};

export function createDiaryFlowId(): string {
  return `flow_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
