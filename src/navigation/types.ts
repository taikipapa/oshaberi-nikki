export type MainTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Character: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
  DiaryFlow: { targetDate: string };
  DiaryConfirm: { targetDate: string; score: number; content: string };
  SaveComplete: { targetDate: string };
  DiaryDetail: { targetDate: string };
};
