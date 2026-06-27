import React from 'react';
import { Alert, View, Text } from 'react-native';
import { voiceActiveRef } from '../utils/voiceState';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import CharacterScreen from '../screens/CharacterScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DiaryFlowScreen from '../screens/DiaryFlowScreen';
import DiaryConfirmScreen from '../screens/DiaryConfirmScreen';
import SaveCompleteScreen from '../screens/SaveCompleteScreen';
import DiaryDetailScreen from '../screens/DiaryDetailScreen';
import AdBanner from '../components/AdBanner';

import { RootStackParamList, MainTabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Calendar: '📅',
    Character: '🐣',
    Settings: '⚙️',
  };
  return (
    <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>
      {icons[label]}
    </Text>
  );
}

function tabLabel(name: string): string {
  const labels: Record<string, string> = {
    Home: 'ホーム',
    Calendar: 'カレンダー',
    Character: 'キャラ',
    Settings: '設定',
  };
  return labels[name] ?? name;
}

// Layout order from top to bottom:
//   screen content
//   ↓ tab bar  (rendered inside Tab.Navigator)
//   ↓ ad banner (rendered here, below Tab.Navigator)
function MainTabs() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFAF5' }}>
      <Tab.Navigator
        screenListeners={{
          tabPress: (e) => {
            if (voiceActiveRef.current) {
              e.preventDefault();
              Alert.alert('音声入力中です', '音声の入力が終わってから移動してください。');
            }
          },
        }}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon label={route.name} focused={focused} />
          ),
          tabBarLabel: tabLabel(route.name),
          tabBarActiveTintColor: '#F5A623',
          tabBarInactiveTintColor: '#AAA',
          tabBarStyle: {
            backgroundColor: '#FFFAF5',
            borderTopColor: '#F0EDE8',
          },
          tabBarLabelStyle: {
            fontSize: 11,
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Calendar" component={CalendarScreen} />
        <Tab.Screen name="Character" component={CharacterScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
      {/* Ad banner sits below the tab bar, not inside any screen */}
      <AdBanner />
    </View>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFAF5' },
        headerTintColor: '#5C4A2A',
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitle: '戻る',
        contentStyle: { backgroundColor: '#FFFAF5' },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DiaryFlow"
        component={DiaryFlowScreen}
        options={{ title: '日記を書く' }}
      />
      <Stack.Screen
        name="DiaryConfirm"
        component={DiaryConfirmScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SaveComplete"
        component={SaveCompleteScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DiaryDetail"
        component={DiaryDetailScreen}
        options={{ title: '日記の詳細' }}
      />
    </Stack.Navigator>
  );
}
