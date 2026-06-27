// One-shot ref written by DiaryConfirmScreen before navigating back to Home.
// HomeScreen reads and consumes it in useFocusEffect to restore editing state
// instead of resetting to idle. Null between uses.
export type ResumeEditState = {
  targetDate: string;
  score: number;
  content: string;
  characterComment: string;
};

export const pendingResumeRef: { current: ResumeEditState | null } = {
  current: null,
};
