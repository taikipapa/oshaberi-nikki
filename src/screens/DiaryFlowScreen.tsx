import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Keyboard,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ScreenLayout from '../components/ScreenLayout';
import CharacterAvatar from '../components/CharacterAvatar';
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
import { parseJapaneseScore } from '../utils/japaneseNumber';
import {
  useSafeSpeechEvent,
  startSpeechRecognition,
  stopSpeechRecognition,
} from '../utils/speechRecognition';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'DiaryFlow'>;

type Step = 'score' | 'reaction';

function scoreBg(score: number) {
  if (score >= 80) return { backgroundColor: '#4CAF82' };
  if (score >= 50) return { backgroundColor: '#F5A623' };
  return { backgroundColor: '#E8736B' };
}

const VOICE_UNAVAILABLE =
  '音声入力は開発ビルドで確認します。今は文字入力を使ってください。';

export default function DiaryFlowScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { targetDate } = route.params;
  const insets = useSafeAreaInsets();

  const isYesterday = targetDate !== toDateString(new Date());

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
  const [showContentModal, setShowContentModal] = useState(false);
  const contentRef = useRef<TextInput>(null);

  const [isListening, setIsListening] = useState(false);
  const voiceTargetRef = useRef<'score' | 'content' | null>(null);

  const bubbleMessage = step === 'score' ? scoreQuestion : reactionMessage;

  useSafeSpeechEvent('start', () => setIsListening(true));
  useSafeSpeechEvent('end', () => setIsListening(false));
  useSafeSpeechEvent('result', (event) => {
    if (!event.isFinal) return;
    const transcript: string = event.results[0]?.transcript ?? '';
    const target = voiceTargetRef.current;
    voiceTargetRef.current = null;
    if (target === 'score') {
      const parsed = parseJapaneseScore(transcript);
      if (parsed !== null) {
        setScoreText(String(parsed));
      } else {
        Alert.alert(
          '聞き取れませんでした',
          `「${transcript}」を点数に変換できませんでした。数字で入力してください。`,
        );
      }
    } else if (target === 'content') {
      setContent((prev) => (prev ? prev + '\n' + transcript : transcript));
    }
  });
  useSafeSpeechEvent('error', (event) => {
    const target = voiceTargetRef.current;
    voiceTargetRef.current = null;
    setIsListening(false);
    if (event.error !== 'aborted') {
      Alert.alert(
        '聞き取れませんでした',
        target === 'score'
          ? '点数を聞き取れませんでした。数字で入力してください。'
          : '音声を認識できませんでした。もう一度試してください。',
      );
    }
  });

  async function handleVoiceScore() {
    if (isListening) { stopSpeechRecognition(); return; }
    try {
      voiceTargetRef.current = 'score';
      const started = await startSpeechRecognition('ja-JP');
      if (!started) {
        voiceTargetRef.current = null;
        Alert.alert('音声入力', VOICE_UNAVAILABLE);
      }
    } catch (e: any) {
      voiceTargetRef.current = null;
      Alert.alert(
        e?.message === 'permission_denied' ? 'マイク権限' : '音声入力',
        e?.message === 'permission_denied'
          ? 'マイクの使用を許可してください。設定アプリから変更できます。'
          : VOICE_UNAVAILABLE,
      );
    }
  }

  async function handleVoiceContent() {
    if (isListening) { stopSpeechRecognition(); return; }
    try {
      voiceTargetRef.current = 'content';
      const started = await startSpeechRecognition('ja-JP');
      if (!started) {
        voiceTargetRef.current = null;
        Alert.alert('音声入力', VOICE_UNAVAILABLE);
      }
    } catch (e: any) {
      voiceTargetRef.current = null;
      Alert.alert(
        e?.message === 'permission_denied' ? 'マイク権限' : '音声入力',
        e?.message === 'permission_denied'
          ? 'マイクの使用を許可してください。設定アプリから変更できます。'
          : VOICE_UNAVAILABLE,
      );
    }
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

  function goToConfirm(body: string) {
    setShowContentModal(false);
    Keyboard.dismiss();
    navigation.navigate('DiaryConfirm', { targetDate, score, content: body.trim() });
  }

  return (
    <>
      <ScreenLayout scrollable={false}>

        {/* ── Shared character header — same visual on every step ── */}
        <View style={styles.charHeader}>
          <Text style={styles.screenTitle}>{diaryInfo.title}</Text>
          {diaryInfo.sub !== null && (
            <Text style={styles.screenSubTitle}>{diaryInfo.sub}</Text>
          )}
          <View style={styles.avatarWrap}>
            <CharacterAvatar characterId={DEFAULT_CHARACTER_ID} size={100} />
            <Text style={styles.charName}>ハナ</Text>
          </View>
          <CharacterBubble
            message={bubbleMessage}
            characterId={DEFAULT_CHARACTER_ID}
            showAvatar={false}
          />
        </View>

        {/* ── Step 1: Score input ── */}
        {step === 'score' && (
          <View style={styles.scoreBody}>
            <TouchableOpacity
              style={[styles.voicePrimaryBtn, isListening && styles.voicePrimaryBtnActive]}
              onPress={handleVoiceScore}
              activeOpacity={0.8}
            >
              <Text style={styles.voicePrimaryIcon}>{isListening ? '⏹' : '🎤'}</Text>
              <Text style={styles.voicePrimaryText}>
                {isListening ? '認識中… タップで止める' : '点数を声で入力する'}
              </Text>
            </TouchableOpacity>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>または</Text>
              <View style={styles.orLine} />
            </View>

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

            <View style={styles.scoreOkWrap}>
              <TouchableOpacity
                style={styles.scoreOkBtn}
                onPress={handleScoreOK}
                activeOpacity={0.8}
              >
                <Text style={styles.scoreOkBtnText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Step 2: Reaction ── */}
        {step === 'reaction' && (
          <View style={styles.reactionBody}>
            <View style={styles.scoreBigWrap}>
              <View style={[styles.scoreBig, scoreBg(score)]}>
                <Text style={styles.scoreBigText}>{score}点</Text>
              </View>
              <Text style={styles.scoreOnlyHint}>点数だけでも大丈夫</Text>
            </View>

            <TouchableOpacity
              style={styles.reactionOkBtn}
              onPress={() => goToConfirm('')}
              activeOpacity={0.8}
            >
              <Text style={styles.reactionOkBtnText}>OK</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reactionSecBtn}
              onPress={() => setShowContentModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.reactionSecBtnText}>内容も書く</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backLink} onPress={() => setStep('score')}>
              <Text style={styles.backLinkText}>点数を変える</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScreenLayout>

      {/* ── Content input modal — panel slides up above keyboard, character scene stays fixed ── */}
      <Modal
        visible={showContentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContentModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalKAV}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowContentModal(false)}
          />

          <View style={[styles.contentPanel, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Text style={styles.panelPrompt}>{contentQuestion}</Text>

            <TouchableOpacity
              style={[styles.voiceContentBtn, isListening && styles.voiceContentBtnActive]}
              onPress={handleVoiceContent}
              activeOpacity={0.8}
            >
              <Text style={styles.voiceContentBtnText}>
                {isListening ? '⏹ 認識中… タップで止める' : '🎤 話して入力する'}
              </Text>
            </TouchableOpacity>

            <TextInput
              ref={contentRef}
              style={styles.panelInput}
              multiline
              autoFocus
              placeholder="ここに書く（空でもOK）"
              placeholderTextColor="#CCC"
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
              blurOnSubmit={false}
              returnKeyType="default"
            />

            <TouchableOpacity
              style={styles.panelOkBtn}
              onPress={() => goToConfirm(content)}
              activeOpacity={0.8}
            >
              <Text style={styles.panelOkBtnText}>この内容でOK</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.panelBack}
              onPress={() => setShowContentModal(false)}
            >
              <Text style={styles.panelBackText}>戻る</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({

  // ── Shared character header ───────────────────────────────

  charHeader: {
    paddingTop: 12,
    alignItems: 'center',
    gap: 4,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5C4A2A',
    letterSpacing: 0.5,
  },
  screenSubTitle: {
    fontSize: 12,
    color: '#BBB',
  },
  avatarWrap: {
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  charName: {
    fontSize: 13,
    color: '#888',
  },

  // ── Score step ──────────────────────────────────────────

  scoreBody: {
    paddingBottom: 20,
  },
  voicePrimaryBtn: {
    marginHorizontal: 24,
    marginTop: 14,
    backgroundColor: '#F5A623',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  voicePrimaryBtnActive: {
    backgroundColor: '#D4881A',
  },
  voicePrimaryIcon: {
    fontSize: 26,
  },
  voicePrimaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginVertical: 10,
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E0D8',
  },
  orText: {
    fontSize: 12,
    color: '#BBB',
  },
  numericArea: {
    marginHorizontal: 24,
    gap: 6,
  },
  numericLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  numericInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E0D8CC',
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  scoreOkWrap: {
    alignItems: 'center',
    marginTop: 12,
  },
  scoreOkBtn: {
    alignSelf: 'center',
    backgroundColor: '#F5A623',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 64,
    alignItems: 'center',
  },
  scoreOkBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // ── Reaction step ────────────────────────────────────────

  reactionBody: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 24,
    gap: 14,
  },
  scoreBigWrap: {
    alignItems: 'center',
    gap: 6,
  },
  scoreBig: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 28,
  },
  scoreBigText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreOnlyHint: {
    fontSize: 13,
    color: '#AAA',
  },
  reactionOkBtn: {
    backgroundColor: '#F5A623',
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 72,
    alignItems: 'center',
    minWidth: 200,
  },
  reactionOkBtnText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  reactionSecBtn: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  reactionSecBtnText: {
    fontSize: 14,
    color: '#999',
  },

  // ── Content modal ─────────────────────────────────────────

  modalKAV: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  contentPanel: {
    backgroundColor: '#FFFAF5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 12,
  },
  panelPrompt: {
    fontSize: 15,
    color: '#5C4A2A',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  voiceContentBtn: {
    backgroundColor: '#FFF3E0',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F5C97A',
  },
  voiceContentBtnActive: {
    backgroundColor: '#FFE5B4',
    borderColor: '#D4881A',
  },
  voiceContentBtnText: {
    fontSize: 16,
    color: '#C47F00',
    fontWeight: '600',
  },
  panelInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0D8CC',
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
    lineHeight: 24,
  },
  panelOkBtn: {
    backgroundColor: '#F5A623',
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
  },
  panelOkBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  panelBack: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  panelBackText: {
    fontSize: 14,
    color: '#AAA',
    textDecorationLine: 'underline',
  },

  // ── Shared ───────────────────────────────────────────────

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
