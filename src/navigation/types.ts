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
    targetDate: string;
    score: number;
    content: string;
    characterId: string;
    editParams?: DiaryEditParams;
  };
  SaveComplete: { targetDate: string; characterId: string };
  DiaryDetail: { targetDate: string };
};
