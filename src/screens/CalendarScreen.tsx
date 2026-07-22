import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ScreenLayout from '../components/ScreenLayout';
import { getDiaryEntriesByMonth } from '../storage/diaryStorage';
import { getAppSettings } from '../storage/settingsStorage';
import { DiaryEntry } from '../types';
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  formatMonthJa,
  toDateString,
} from '../utils/dateUtils';
import { RootStackParamList } from '../navigation/types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function CalendarScreen() {
  const navigation = useNavigation<NavProp>();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [entries, setEntries] = useState<Record<string, DiaryEntry>>({});
  const [selectedCharId, setSelectedCharId] = useState<string>('leon');
  // Gates only the very first paint of this screen — later refocuses (month
  // change, returning from a diary edit) refresh entries/settings silently
  // behind the already-visible grid instead of hiding the whole screen again.
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        getDiaryEntriesByMonth(year, month),
        getAppSettings(),
      ]).then(([list, settings]) => {
        if (!active) return;
        const map: Record<string, DiaryEntry> = {};
        list.forEach((e) => (map[e.targetDate] = e));
        setEntries(map);
        setSelectedCharId(settings.selectedCharacterId);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [year, month]),
  );

  function prevMonth() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  // ── Swipe-to-change-month (RN core PanResponder + Animated — no new
  //    native dependency). The weekday row + grid slide slightly with the
  //    finger; releasing past the threshold (25% of screen width) or with
  //    enough velocity commits the month change, otherwise it springs back.
  //    Existing prev/next buttons are untouched — this is an additional
  //    input method, not a replacement. ──
  const screenWidth = Dimensions.get('window').width;
  const SWIPE_DISTANCE_THRESHOLD = screenWidth * 0.25;
  const SWIPE_VELOCITY_THRESHOLD = 0.5;
  const translateX = useRef(new Animated.Value(0)).current;

  // Recreated each render (cheap) rather than memoized, so prevMonth/nextMonth
  // above never end up captured in a stale closure from an earlier render.
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_evt, gesture) =>
      Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
    onPanResponderMove: Animated.event([null, { dx: translateX }], { useNativeDriver: false }),
    onPanResponderRelease: (_evt, gesture) => {
      const { dx, vx } = gesture;
      if (dx <= -SWIPE_DISTANCE_THRESHOLD || vx <= -SWIPE_VELOCITY_THRESHOLD) {
        // Swiped right-to-left → next month.
        Animated.timing(translateX, {
          toValue: -screenWidth,
          duration: 180,
          useNativeDriver: false,
        }).start(() => {
          translateX.setValue(0);
          nextMonth();
        });
      } else if (dx >= SWIPE_DISTANCE_THRESHOLD || vx >= SWIPE_VELOCITY_THRESHOLD) {
        // Swiped left-to-right → previous month.
        Animated.timing(translateX, {
          toValue: screenWidth,
          duration: 180,
          useNativeDriver: false,
        }).start(() => {
          translateX.setValue(0);
          prevMonth();
        });
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          friction: 8,
          useNativeDriver: false,
        }).start();
      }
    },
    onPanResponderTerminate: () => {
      Animated.spring(translateX, { toValue: 0, friction: 8, useNativeDriver: false }).start();
    },
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayStr = toDateString(today);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  function handleDayPress(day: number) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (entries[dateStr]) {
      navigation.navigate('DiaryDetail', { targetDate: dateStr });
      return;
    }
    if (dateStr > toDateString(new Date())) {
      Alert.alert('まだ書けません', '未来の日付の日記はまだ書けません。');
      return;
    }
    navigation.navigate('DiaryFlow', { targetDate: dateStr, initialCharacterId: selectedCharId });
  }

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F5A623" />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <View style={styles.inner}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navButton}>
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{formatMonthJa(year, month)}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* flex:1 so the swipe-catching area also covers the empty space
            below the grid, not just the grid cells themselves. */}
        <Animated.View
          style={[styles.swipeArea, { transform: [{ translateX }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((d, i) => (
              <View key={d} style={styles.weekdayCell}>
                <Text
                  style={[
                    styles.weekdayText,
                    i === 0 && styles.sunday,
                    i === 6 && styles.saturday,
                  ]}
                >
                  {d}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, idx) => {
              if (!day) {
                return <View key={`empty-${idx}`} style={styles.cell} />;
              }
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const entry = entries[dateStr];
              const isToday = dateStr === todayStr;
              const weekday = (firstDay + day - 1) % 7;

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[styles.cell, isToday && styles.todayCell]}
                  onPress={() => handleDayPress(day)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday && styles.todayText,
                      weekday === 0 && styles.sunday,
                      weekday === 6 && styles.saturday,
                    ]}
                  >
                    {day}
                  </Text>
                  {entry && (
                    <View
                      style={[styles.scoreDot, scoreDotColor(entry.score)]}
                    >
                      <Text style={styles.scoreDotText}>{entry.score}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </ScreenLayout>
  );
}

function scoreDotColor(score: number) {
  if (score >= 80) return { backgroundColor: '#4CAF82' };
  if (score >= 50) return { backgroundColor: '#F5A623' };
  return { backgroundColor: '#E8736B' };
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flex: 1,
    paddingTop: 16,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  navArrow: {
    fontSize: 28,
    color: '#F5A623',
    lineHeight: 32,
  },
  monthLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5C4A2A',
    minWidth: 140,
    textAlign: 'center',
  },
  swipeArea: {
    flex: 1,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  todayCell: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
  },
  dayText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  todayText: {
    color: '#F5A623',
    fontWeight: 'bold',
  },
  sunday: {
    color: '#E8736B',
  },
  saturday: {
    color: '#5B9BD5',
  },
  scoreDot: {
    marginTop: 3,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 28,
    alignItems: 'center',
  },
  scoreDotText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
