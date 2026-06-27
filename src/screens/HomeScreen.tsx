import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ScreenLayout from '../components/ScreenLayout';
import CharacterAvatar from '../components/CharacterAvatar';
import CharacterBubble from '../components/CharacterBubble';
import { getDiaryEntryByDate } from '../storage/diaryStorage';
import {
  getTimePeriod,
  getTargetDate,
  getDiaryDateInfo,
  toDateString,
} from '../utils/dateUtils';
import {
  getMorningGreeting,
  getNightGreeting,
  getAfternoonComment,
  getAlreadyWrittenComment,
  getAskTodayScore,
  getAskYesterdayScore,
  getScoreReaction,
  getAskContent,
} from '../utils/speech';
import { DEFAULT_CHARACTER_ID } from '../constants/characters';
import { RootStackParamList } from '../navigation/types';
import { parseJapaneseScore } from '../utils/japaneseNumber';
import {
  useSafeSpeechEvent,
  startSpeechRecognition,
  stopSpeechRecognition,
  stopSpeechRecognitionSafe,
} from '../utils/speechRecognition';
import {
  getAppSettings,
  InputMethod,
} from '../storage/settingsStorage';
import { voiceActiveRef } from '../utils/voiceState';
import { pendingResumeRef } from '../utils/diaryEditState';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

type HomeDiaryStep = 'idle' | 'score' | 'reaction';
type ListeningMode = 'none' | 'score' | 'content';

function scoreBg(score: number) {
  if (score >= 80) return { backgroundColor: '#4CAF82' };
  if (score >= 50) return { backgroundColor: '#F5A623' };
  return { backgroundColor: '#E8736B' };
}

const VOICE_UNAVAILABLE =
  '音声入力は開発ビルドで確認します。今は文字入力を使ってください。';

// Robust transcript extractor — tries the documented shape first, then falls back.
// Documented shape (expo-speech-recognition): { results: [{ transcript: string }], isFinal: boolean }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTranscript(event: any): string {
  if (Array.isArray(event?.results) && event.results.length > 0) {
    const first = event.results[0];
    // Primary documented shape
    if (typeof first?.transcript === 'string') return first.transcript;
    // Web Speech API nested style: results[0][0].transcript
    if (typeof first?.[0]?.transcript === 'string') return first[0].transcript;
    // With alternatives array: results[0].alternatives[0].transcript
    if (Array.isArray(first?.alternatives) && typeof first.alternatives[0]?.transcript === 'string') {
      return first.alternatives[0].transcript;
    }
  }
  // Flat fallbacks
  if (typeof event?.transcript === 'string') return event.transcript;
  if (typeof event?.value === 'string') return event.value;
  if (Array.isArray(event?.value) && event.value.length > 0) return String(event.value[0]);
  console.warn('[SpeechRecognition] could not extract transcript, raw event:', JSON.stringify(event));
  return '';
}

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();

  // ── Idle greeting state ──
  const [idleMessage, setIdleMessage] = useState('');
  const [shouldWrite, setShouldWrite] = useState(false);
  const [targetDate, setTargetDate] = useState('');

  // ── Diary flow state ──
  const [diaryStep, setDiaryStep] = useState<HomeDiaryStep>('idle');
  const [score, setScore] = useState(0);
  const [scoreText, setScoreText] = useState('');
  const [reactionMessage, setReactionMessage] = useState('');
  const [content, setContent] = useState('');
  const [showContentModal, setShowContentModal] = useState(false);
  const contentRef = useRef<TextInput>(null);

  // ── Voice input ──
  const [listeningMode, setListeningMode] = useState<ListeningMode>('none');
  const scoreAutoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Input method settings ──
  const [scoreInputMethod, setScoreInputMethod] = useState<InputMethod>('voice');
  const [contentInputMethod, setContentInputMethod] = useState<InputMethod>('voice');

  function clearScoreAutoStop() {
    if (scoreAutoStopRef.current !== null) {
      clearTimeout(scoreAutoStopRef.current);
      scoreAutoStopRef.current = null;
    }
  }

  // Keep the module-level ref in sync so the Tab Navigator can block tab presses.
  useEffect(() => {
    voiceActiveRef.current = listeningMode !== 'none';
  }, [listeningMode]);

  function alertVoiceActive() {
    Alert.alert('音声入力中です', '音声の入力が終わってから移動してください。');
  }

  const [contentQuestion] = useState(() => getAskContent(DEFAULT_CHARACTER_ID));

  // Stable per targetDate — derived before diary step begins
  const scoreQuestion = useMemo(
    () =>
      targetDate !== '' && targetDate !== toDateString(new Date())
        ? getAskYesterdayScore(DEFAULT_CHARACTER_ID)
        : getAskTodayScore(DEFAULT_CHARACTER_ID),
    [targetDate],
  );

  const bubbleMessage =
    diaryStep === 'score' ? scoreQuestion :
    diaryStep === 'reaction' ? reactionMessage :
    (idleMessage || '…');

  const diaryInfo = targetDate !== '' ? getDiaryDateInfo(targetDate) : null;

  // ── Load greeting on focus; reset diary flow (or restore edit state) ──
  useFocusEffect(
    useCallback(() => {
      let active = true;

      // Resume edit path: DiaryConfirmScreen wrote a state snapshot before goBack().
      // Restore it instead of resetting to idle so the user can correct content.
      const resume = pendingResumeRef.current;
      if (resume) {
        pendingResumeRef.current = null; // consume immediately — one-shot
        setTargetDate(resume.targetDate);
        setScore(resume.score);
        setScoreText(String(resume.score));
        setContent(resume.content);
        setReactionMessage(resume.characterComment);
        setDiaryStep('reaction');
        setShowContentModal(true);
        setListeningMode('none');
        clearScoreAutoStop();
        stopSpeechRecognition();
        // Refresh settings in case user changed them while on DiaryConfirmScreen
        getAppSettings().then((s) => {
          if (!active) return;
          setScoreInputMethod(s.scoreInputMethod);
          setContentInputMethod(s.contentInputMethod);
        });
        return () => { active = false; };
      }

      // Normal path: reset all diary flow state then load greeting.
      setDiaryStep('idle');
      setScore(0);
      setScoreText('');
      setReactionMessage('');
      setContent('');
      setShowContentModal(false);
      setListeningMode('none');
      clearScoreAutoStop();
      stopSpeechRecognition();

      async function load() {
        const now = new Date();
        const period = getTimePeriod(now);
        const date = getTargetDate(now);
        if (!active) return;
        setTargetDate(date);

        const [existing, settings] = await Promise.all([
          getDiaryEntryByDate(date),
          getAppSettings(),
        ]);
        if (!active) return;

        setScoreInputMethod(settings.scoreInputMethod);
        setContentInputMethod(settings.contentInputMethod);

        if (existing) {
          setIdleMessage(getAlreadyWrittenComment(DEFAULT_CHARACTER_ID));
          setShouldWrite(false);
        } else if (period === 'morning') {
          setIdleMessage(getMorningGreeting(DEFAULT_CHARACTER_ID));
          setShouldWrite(true);
        } else if (period === 'daytime') {
          setIdleMessage(getAfternoonComment(DEFAULT_CHARACTER_ID));
          setShouldWrite(false);
        } else {
          setIdleMessage(getNightGreeting(DEFAULT_CHARACTER_ID));
          setShouldWrite(true);
        }
      }

      load();
      return () => { active = false; };
    }, []),
  );

  // ── Voice event listeners ──
  useSafeSpeechEvent('start', () => {
    // listeningMode was already set by handleVoiceScore / handleVoiceContent
    console.log('[SpeechRecognition] start event, mode:', listeningMode);
  });
  useSafeSpeechEvent('end', () => {
    console.log('[SpeechRecognition] end event, mode:', listeningMode);
    clearScoreAutoStop();
    setListeningMode('none');
  });
  useSafeSpeechEvent('result', (event) => {
    const mode = listeningMode;
    console.log('[SpeechRecognition] result payload (mode=' + mode + '):', JSON.stringify(event));
    if (!event?.isFinal) {
      console.log('[SpeechRecognition] result not final, skipping');
      return;
    }
    const transcript = extractTranscript(event);
    setListeningMode('none');

    if (mode === 'score') {
      // Stop recognition immediately and cancel the auto-stop fallback timer.
      stopSpeechRecognitionSafe();
      clearScoreAutoStop();
      console.log('[SpeechRecognition] score transcript:', JSON.stringify(transcript));
      if (!transcript) {
        Alert.alert('うまく聞き取れませんでした', 'もう一度試すか、数字で入力してください。');
        return;
      }
      const parsed = parseJapaneseScore(transcript);
      console.log('[SpeechRecognition] score parsed:', parsed);
      if (parsed !== null) {
        setScoreText(String(parsed));
      } else {
        Alert.alert(
          '聞き取りましたが…',
          `「${transcript}」を点数として読み取れませんでした。数字で入力してください。`,
        );
      }
    } else if (mode === 'content') {
      console.log('[SpeechRecognition] content transcript:', JSON.stringify(transcript));
      setContent((prev) => (prev ? prev + '\n' + transcript : transcript));
    }
  });
  useSafeSpeechEvent('nomatch', () => {
    const mode = listeningMode;
    console.log('[SpeechRecognition] nomatch event, mode:', mode);
    if (mode === 'none') return;
    clearScoreAutoStop();
    setListeningMode('none');
    Alert.alert(
      'うまく聞き取れませんでした',
      mode === 'score'
        ? 'もう一度話すか、数字で入力してください。'
        : 'もう一度話すか、テキストで入力してください。',
    );
  });
  useSafeSpeechEvent('error', (event) => {
    const mode = listeningMode;
    console.warn('[SpeechRecognition] error (mode=' + mode + ') payload:', JSON.stringify(event));
    clearScoreAutoStop();
    setListeningMode('none');

    const code: string = event?.error ?? 'unknown';
    if (code === 'aborted') return;

    let msg: string;
    switch (code) {
      case 'interrupted':
        // Audio session interrupted — usually a transient condition; soft message
        msg = 'うまく聞き取れませんでした。もう一度試すか、' +
              (mode === 'score' ? '数字で入力してください。' : 'テキストで入力してください。');
        break;
      case 'no-speech':
        msg = 'うまく聞き取れませんでした。もう一度試すか、' +
              (mode === 'score' ? '数字で入力してください。' : 'テキストで入力してください。');
        break;
      case 'network':
        msg = 'ネットワークエラーが発生しました。Wi-Fiを確認して再試行するか、' +
              (mode === 'score' ? '数字で入力してください。' : 'テキストで入力してください。');
        break;
      case 'not-allowed':
        msg = 'マイクの使用が許可されていません。設定アプリから変更できます。';
        break;
      case 'service-not-allowed':
        msg = 'シミュレーターでは音声認識が不安定です。実機で確認してください。';
        break;
      case 'audio-capture':
        msg = '録音が開始できませんでした。マイクが利用可能か確認してください。';
        break;
      default:
        msg = mode === 'score'
          ? `音声認識エラー（${code}）。数字で入力してください。`
          : `音声認識エラー（${code}）。もう一度試してください。`;
    }
    Alert.alert('音声認識エラー', msg);
  });

  // ── Handlers ──
  async function handleVoiceScore() {
    // Dismiss numeric keyboard BEFORE starting recognition.
    // On iOS, a keyboard transitioning (open→close) can interrupt the AVAudioSession,
    // causing an 'interrupted' error immediately after start.
    Keyboard.dismiss();
    await new Promise<void>((resolve) => setTimeout(resolve, 150));

    setListeningMode('score');
    console.log('[SpeechRecognition] start score');
    try {
      const started = await startSpeechRecognition('ja-JP');
      if (!started) {
        setListeningMode('none');
        Alert.alert('音声入力', VOICE_UNAVAILABLE);
      } else {
        // Auto-stop fallback: iOS does not reliably end score recognition after one utterance.
        // 1500ms gives enough time to speak a number clearly without waiting too long.
        scoreAutoStopRef.current = setTimeout(() => {
          console.log('[SpeechRecognition] score auto-stop timer fired');
          scoreAutoStopRef.current = null;
          stopSpeechRecognitionSafe();
        }, 1500);
      }
    } catch (e: any) {
      setListeningMode('none');
      Alert.alert(
        e?.message === 'permission_denied' ? 'マイク権限' : '音声入力',
        e?.message === 'permission_denied'
          ? 'マイクの使用を許可してください。設定アプリから変更できます。'
          : VOICE_UNAVAILABLE,
      );
    }
  }

  async function handleVoiceContent() {
    setListeningMode('content');
    console.log('[SpeechRecognition] start content');
    try {
      const started = await startSpeechRecognition('ja-JP');
      if (!started) {
        setListeningMode('none');
        Alert.alert('音声入力', VOICE_UNAVAILABLE);
      }
    } catch (e: any) {
      setListeningMode('none');
      Alert.alert(
        e?.message === 'permission_denied' ? 'マイク権限' : '音声入力',
        e?.message === 'permission_denied'
          ? 'マイクの使用を許可してください。設定アプリから変更できます。'
          : VOICE_UNAVAILABLE,
      );
    }
  }

  async function autoStartContentVoice() {
    if (listeningMode !== 'none') return; // guard: already listening
    setListeningMode('content');
    console.log('[SpeechRecognition] auto-start content voice');
    try {
      const started = await startSpeechRecognition('ja-JP');
      if (!started) {
        setListeningMode('none');
        // Silent fallback on auto-start — TextInput remains available
      }
    } catch {
      setListeningMode('none');
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
    setDiaryStep('reaction');
  }

  function goToConfirm(body: string) {
    // Stop any ongoing recognition before navigating — content voice has no auto-stop timer.
    clearScoreAutoStop();
    stopSpeechRecognition();
    setListeningMode('none');
    setShowContentModal(false);
    Keyboard.dismiss();
    navigation.navigate('DiaryConfirm', { targetDate, score, content: body.trim() });
  }

  // ScrollView during score step so automaticallyAdjustKeyboardInsets lifts content above keyboard
  const scrollable = diaryStep === 'score';

  return (
    <>
      <ScreenLayout showAd={false} scrollable={scrollable}>
        <View style={styles.inner}>

          {/* ── Fixed top character scene ── */}
          <Text style={styles.appTitle}>おしゃべり日記</Text>
          <View style={styles.avatarWrap}>
            <CharacterAvatar characterId={DEFAULT_CHARACTER_ID} size={100} />
            <Text style={styles.characterName}>ハナ</Text>
          </View>
          <CharacterBubble
            message={bubbleMessage}
            characterId={DEFAULT_CHARACTER_ID}
            showAvatar={false}
          />

          {/* ── Idle: diary button or calendar button ── */}
          {diaryStep === 'idle' && (
            <View style={styles.idleActions}>
              {shouldWrite && diaryInfo !== null && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setDiaryStep('score')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>{diaryInfo.title}を書く</Text>
                </TouchableOpacity>
              )}
              {!shouldWrite && (
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Calendar' })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.calendarButtonText}>カレンダーを見る</Text>
                </TouchableOpacity>
              )}
              {__DEV__ && !shouldWrite && (
                <TouchableOpacity
                  style={styles.devTestButton}
                  onPress={() => setDiaryStep('score')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.devTestButtonText}>テスト用：今日の日記を書く</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Score input ── */}
          {diaryStep === 'score' && (
            <View style={styles.scoreBody}>
              {scoreInputMethod === 'voice' ? (
                <>
                  {/* Voice PRIMARY */}
                  <TouchableOpacity
                    disabled={listeningMode !== 'none'}
                    style={[styles.voicePrimaryBtn, listeningMode === 'score' && styles.voicePrimaryBtnActive]}
                    onPress={handleVoiceScore}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.voicePrimaryIcon}>🎤</Text>
                    <Text style={styles.voicePrimaryText}>
                      {listeningMode === 'score' ? '話してください…' : '点数を声で入力する'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.orRow}>
                    <View style={styles.orLine} />
                    <Text style={styles.orText}>または</Text>
                    <View style={styles.orLine} />
                  </View>

                  {/* Numeric SECONDARY */}
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
                </>
              ) : (
                <>
                  {/* Numeric PRIMARY */}
                  <View style={[styles.numericArea, { marginTop: 16 }]}>
                    <Text style={styles.numericLabel}>点数を入力してください</Text>
                    <TextInput
                      style={styles.numericInputPrimary}
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
                </>
              )}

              <View style={styles.scoreOkWrap}>
                <TouchableOpacity
                  style={styles.scoreOkBtn}
                  onPress={handleScoreOK}
                  activeOpacity={0.8}
                >
                  <Text style={styles.scoreOkBtnText}>OK</Text>
                </TouchableOpacity>
              </View>

              {/* Voice SECONDARY — shown only in manual mode */}
              {scoreInputMethod === 'manual' && (
                <TouchableOpacity
                  disabled={listeningMode !== 'none'}
                  style={styles.voiceSecondaryBtn}
                  onPress={handleVoiceScore}
                  activeOpacity={0.7}
                >
                  <Text style={styles.voiceSecondaryText}>
                    {listeningMode === 'score' ? '🎤 話してください…' : '🎤 音声でも入力できます'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Reaction / choice ── */}
          {diaryStep === 'reaction' && (
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
                onPress={() => {
                  setShowContentModal(true);
                  if (contentInputMethod === 'voice' && listeningMode === 'none') {
                    // Wait for the modal slide animation before starting recognition
                    setTimeout(() => autoStartContentVoice(), 200);
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.reactionSecBtnText}>内容を書く</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backLink}
                onPress={() => setDiaryStep('score')}
              >
                <Text style={styles.backLinkText}>点数を変える</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScreenLayout>

      {/* ── Content input modal: slides up above keyboard, main scene stays fixed ── */}
      <Modal
        visible={showContentModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (listeningMode !== 'none') { alertVoiceActive(); return; }
          setShowContentModal(false);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalKAV}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              if (listeningMode !== 'none') { alertVoiceActive(); return; }
              setShowContentModal(false);
            }}
          />
          <View style={[styles.contentPanel, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Text style={styles.panelPrompt}>{contentQuestion}</Text>
            <Text style={styles.panelHint}>書きたいことがあれば残しておこう（空のままでもOK）</Text>

            <TouchableOpacity
              disabled={listeningMode !== 'none'}
              style={[
                contentInputMethod === 'voice' ? styles.voiceContentBtn : styles.voiceContentBtnSecondary,
                listeningMode === 'content' && styles.voiceContentBtnActive,
              ]}
              onPress={handleVoiceContent}
              activeOpacity={0.8}
            >
              <Text
                style={
                  contentInputMethod === 'voice'
                    ? styles.voiceContentBtnText
                    : styles.voiceContentBtnSecondaryText
                }
              >
                {listeningMode === 'content' ? '聞き取り中…' : '🎤 話して入力する'}
              </Text>
            </TouchableOpacity>

            <TextInput
              ref={contentRef}
              style={styles.panelInput}
              multiline
              autoFocus={contentInputMethod !== 'voice'}
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
              onPress={() => {
                if (listeningMode !== 'none') { alertVoiceActive(); return; }
                setShowContentModal(false);
              }}
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

  // ── Structure ─────────────────────────────────────────────

  inner: {
    flex: 1,
    paddingTop: 24,
  },

  // ── Fixed character scene ─────────────────────────────────

  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5C4A2A',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  characterName: {
    fontSize: 14,
    color: '#888',
  },

  // ── Idle action area ──────────────────────────────────────

  idleActions: {
    paddingHorizontal: 24,
    paddingTop: 40,
    gap: 14,
    alignItems: 'center',
  },
  primaryButton: {
    alignSelf: 'center',
    backgroundColor: '#F5A623',
    borderRadius: 32,
    paddingVertical: 40,
    paddingHorizontal: 52,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  calendarButton: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 36,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F5A623',
  },
  calendarButtonText: {
    fontSize: 16,
    color: '#F5A623',
    fontWeight: '600',
  },
  devTestButton: {
    alignSelf: 'center',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#CCC',
    borderStyle: 'dashed',
  },
  devTestButtonText: {
    fontSize: 12,
    color: '#AAA',
  },

  // ── Score input ───────────────────────────────────────────

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

  // Manual mode: larger primary numeric input
  numericInputPrimary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#F5A623',
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },

  // Manual mode: secondary voice link below OK
  voiceSecondaryBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 2,
  },
  voiceSecondaryText: {
    fontSize: 13,
    color: '#CCC',
    textDecorationLine: 'underline',
  },

  // ── Reaction / choice ─────────────────────────────────────

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
  backLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 15,
    color: '#AAA',
    textDecorationLine: 'underline',
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
    marginBottom: 2,
  },
  panelHint: {
    fontSize: 12,
    color: '#BBB',
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
  voiceContentBtnSecondary: {
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0D8CC',
    backgroundColor: '#FAFAFA',
  },
  voiceContentBtnSecondaryText: {
    fontSize: 13,
    color: '#BBB',
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
});
