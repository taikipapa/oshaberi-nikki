import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ScreenLayout from '../components/ScreenLayout';
import CharacterBubble from '../components/CharacterBubble';
import { RootStackParamList } from '../navigation/types';
import { DEFAULT_CHARACTER_ID } from '../constants/characters';
import { toDateString, getDiaryDateInfo } from '../utils/dateUtils';
import {
  getAskTodayScore,
  getAskYesterdayScore,
  getScoreReaction,
  getAskContent,
} from '../utils/speech';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'DiaryFlow'>;

type Step = 'score' | 'reaction' | 'content';

function scoreBg(score: number) {
  if (score >= 80) return { backgroundColor: '#4CAF82' };
  if (score >= 50) return { backgroundColor: '#F5A623' };
  return { backgroundColor: '#E8736B' };
}

export default function DiaryFlowScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { targetDate } = route.params;

  const isYesterday = targetDate !== toDateString(new Date());

  // All random messages are picked ONCE per component mount so they never
  // change while the user is interacting (no layout shifts from re-renders).
  const scoreQuestion = useMemo(
    () =>
      isYesterday
        ? getAskYesterdayScore(DEFAULT_CHARACTER_ID)
        : getAskTodayScore(DEFAULT_CHARACTER_ID),
    [isYesterday],
  );
  const [contentQuestion] = useState(() => getAskContent(DEFAULT_CHARACTER_ID));

  const diaryInfo = getDiaryDateInfo(targetDate);

  const [step, setStep] = useState<Step>('score');
  const [score, setScore] = useState(0);
  const [scoreText, setScoreText] = useState('');
  const [reactionMessage, setReactionMessage] = useState('');
  const [content, setContent] = useState('');
  const [isContentFocused, setIsContentFocused] = useState(false);
  const contentRef = useRef<TextInput>(null);

  function handleVoiceScore() {
    Alert.alert('音声入力', '音声入力は後で実装します');
  }

  function handleScoreOK() {
    Keyboard.dismiss();
    if (scoreText.trim() === '') {
      Alert.alert('点数を入力してください', '0〜100の数字を入力してください');
      return;
    }
    const parsed = parseInt(scoreText, 10);
    if (isNaN(parsed)) {
      Alert.alert('入力エラー', '0〜100の数字を入力してください');
      return;
    }
    const clamped = Math.max(0, Math.min(100, parsed));
    setScore(clamped);
    setReactionMessage(getScoreReaction(clamped, DEFAULT_CHARACTER_ID));
    setStep('reaction');
  }

  function handleProceedToContent() {
    setStep('content');
    setTimeout(() => contentRef.current?.focus(), 300);
  }

  function goToConfirm(body: string) {
    Keyboard.dismiss();
    navigation.navigate('DiaryConfirm', {
      targetDate,
      score,
      content: body.trim(),
    });
  }

  return (
    <ScreenLayout scrollable>
      <View style={styles.header}>
        <Text style={styles.diaryTitle}>{diaryInfo.title}</Text>
        {diaryInfo.sub !== null && (
          <Text style={styles.diarySub}>{diaryInfo.sub}</Text>
        )}
      </View>

      {/* ── Step 1: Score input ── */}
      {step === 'score' && (
        <View style={styles.section}>
          <CharacterBubble
            message={scoreQuestion}
            characterId={DEFAULT_CHARACTER_ID}
          />

          {/* Primary: large voice button */}
          <TouchableOpacity
            style={styles.voicePrimaryBtn}
            onPress={handleVoiceScore}
            activeOpacity={0.8}
          >
            <Text style={styles.voicePrimaryIcon}>🎤</Text>
            <Text style={styles.voicePrimaryText}>点数を声で入力する</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>または</Text>
            <View style={styles.orLine} />
          </View>

          {/* Secondary: numeric input */}
          <View style={styles.numericArea}>
            <Text style={styles.numericLabel}>数字で入力</Text>
            <TextInput
              style={styles.numericInput}
              keyboardType="number-pad"
              placeholder="0〜100"
              placeholderTextColor="#CCC"
              value={scoreText}
              onChangeText={(t) => setScoreText(t.replace(/[^0-9]/g, ''))}
              maxLength={3}
              returnKeyType="done"
              onSubmitEditing={handleScoreOK}
              selectTextOnFocus
            />
          </View>

          {/* OK button — confirms score (voice or number) */}
          <View style={styles.actionWrap}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleScoreOK}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Step 2: Character reaction ── */}
      {step === 'reaction' && (
        <View style={styles.section}>
          <View style={styles.scoreBadgeWrap}>
            <View style={[styles.scoreBadge, scoreBg(score)]}>
              <Text style={styles.scoreBadgeText}>{score}点</Text>
            </View>
          </View>

          <CharacterBubble
            message={reactionMessage}
            characterId={DEFAULT_CHARACTER_ID}
          />

          <Text style={styles.scoreOnlyHint}>今日は点数だけでも大丈夫</Text>

          <View style={styles.actionWrap}>
            {/* Primary: save with score only */}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => goToConfirm('')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>OK</Text>
            </TouchableOpacity>

            {/* Secondary: optionally add content */}
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleProceedToContent}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>内容も書く</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backLink}
              onPress={() => setStep('score')}
            >
              <Text style={styles.backLinkText}>点数を変える</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Step 3: Content (optional) ── */}
      {step === 'content' && (
        <View style={styles.section}>
          {/* contentQuestion is stored in state — never rerenders while typing */}
          <CharacterBubble
            message={contentQuestion}
            characterId={DEFAULT_CHARACTER_ID}
          />

          <Text style={styles.optionalHint}>
            書きたいことがあれば、少し残しておこう。{'\n'}空でも保存できます。
          </Text>

          <TouchableOpacity
            style={styles.voiceContentBtn}
            onPress={() => Alert.alert('音声入力', '音声入力は後で実装します')}
            activeOpacity={0.8}
          >
            <Text style={styles.voiceContentBtnText}>🎤 話して入力する</Text>
          </TouchableOpacity>

          {/* Keyboard close — space always reserved, only visible when focused */}
          <TouchableOpacity
            style={[
              styles.keyboardCloseBtn,
              { opacity: isContentFocused ? 1 : 0 },
            ]}
            onPress={() => Keyboard.dismiss()}
            disabled={!isContentFocused}
            activeOpacity={0.7}
          >
            <Text style={styles.keyboardCloseBtnText}>⌄ キーボードを閉じる</Text>
          </TouchableOpacity>

          <TextInput
            ref={contentRef}
            style={styles.contentInput}
            multiline
            placeholder="ここに書く（空でもOK）"
            placeholderTextColor="#CCC"
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
            blurOnSubmit={false}
            returnKeyType="default"
            onFocus={() => setIsContentFocused(true)}
            onBlur={() => setIsContentFocused(false)}
          />

          <View style={styles.actionWrap}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => goToConfirm(content)}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>この内容でOK</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backLink}
              onPress={() => {
                Keyboard.dismiss();
                setStep('reaction');
              }}
            >
              <Text style={styles.backLinkText}>戻る</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
    gap: 2,
  },
  diaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5C4A2A',
  },
  diarySub: {
    fontSize: 13,
    color: '#AAA',
  },
  section: {
    paddingBottom: 40,
  },

  // ── Score step ──────────────────────────────────────────

  voicePrimaryBtn: {
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: '#F5A623',
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
  },
  voicePrimaryIcon: {
    fontSize: 32,
  },
  voicePrimaryText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginVertical: 20,
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E0D8',
  },
  orText: {
    fontSize: 13,
    color: '#BBB',
  },

  numericArea: {
    marginHorizontal: 24,
    gap: 10,
  },
  numericLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  numericInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E0D8CC',
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },

  // ── Reaction step ────────────────────────────────────────

  scoreBadgeWrap: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  scoreBadge: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 24,
  },
  scoreBadgeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreOnlyHint: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    marginBottom: 4,
    marginTop: -4,
  },

  // ── Content step ─────────────────────────────────────────

  optionalHint: {
    marginHorizontal: 24,
    marginTop: 4,
    marginBottom: 16,
    fontSize: 13,
    color: '#AAA',
    lineHeight: 20,
    textAlign: 'center',
  },
  voiceContentBtn: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F5C97A',
  },
  voiceContentBtnText: {
    fontSize: 17,
    color: '#C47F00',
    fontWeight: '600',
  },
  keyboardCloseBtn: {
    marginHorizontal: 24,
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F0EDE8',
    borderRadius: 12,
    alignItems: 'center',
  },
  keyboardCloseBtnText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
  },
  contentInput: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0D8CC',
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 150,
    lineHeight: 24,
  },

  // ── Shared ───────────────────────────────────────────────

  actionWrap: {
    paddingHorizontal: 24,
    marginTop: 20,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#F5A623',
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0D8CC',
  },
  secondaryBtnText: {
    fontSize: 16,
    color: '#666',
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 15,
    color: '#AAA',
    textDecorationLine: 'underline',
  },
});
