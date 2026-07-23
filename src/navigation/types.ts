export type MainTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Character: undefined;
  Settings: undefined;
};

export type DiaryEditParams = {
  id: string;
  createdAt: string;
  characterId: string;
};

export type DiaryFlowOrigin = 'home' | 'calendar';

export type RootStackParamList = {
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
  DiaryFlow: {
    targetDate: string;
    initialScore?: number;
    initialContent?: string;
    editParams?: DiaryEditParams;
    initialCharacterId?: string;
  };
  DiaryConfirm: {
    origin: DiaryFlowOrigin;
    flowId: string;
    targetDate: string;
    score: number;
    content: string;
    characterId: string;
    editParams?: DiaryEditParams;
    // The character line already shown to the user right after they entered
    // the score (Home's inline reaction step / DiaryFlowScreen's reaction
    // step). When present, DiaryConfirmScreen must reuse it verbatim instead
    // of re-rolling getScoreReaction — otherwise the two screens can show two
    // different random lines for the same score.
    characterComment?: string;
  };
  DiaryDetail: { targetDate: string };
};
