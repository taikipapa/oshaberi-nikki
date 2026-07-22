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
} from '../utils/speech';
import { CHARACTERS } from '../constants/characters';
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
  updateAppSettings,
  InputMethod,
} from '../storage/settingsStorage';
import { voiceActiveRef } from '../utils/voiceState';
import { pendingResumeRef } from '../utils/diaryEditState';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

type HomeDiaryStep = 'idle' | 'score';
type ListeningMode = 'none' | 'score' | 'content';
type IdleMessageType = 'morning' | 'daytime' | 'night' | 'alreadyWritten';

function getCharacterName(id: string): string {
  return CHARACTERS.find((c) => c.id === id)?.name ?? id;
}

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

  // ── Idle greeting state ──
  const [idleMessage, setIdleMessage] = useState('');
  const [shouldWrite, setShouldWrite] = useState(false);
  const [targetDate, setTargetDate] = useState('');

  // ── Diary flow state ──
  const [diaryStep, setDiaryStep] = useState<HomeDiaryStep>('idle');
  const [score, setScore] = useState(0);
  const [scoreText, setScoreText] = useState('');
  const [scoreEntered, setScoreEntered] = useState(false); // true once a score has been confirmed
  const [reactionMessage, setReactionMessage] = useState('');
  const [content, setContent] = useState('');
  const contentRef = useRef<TextInput>(null);
  // Content-writing step is a bottom-sheet Modal (matching the calendar-entry
  // flow in DiaryFlowScreen) rather than an inline panel — see goToConfirm /
  // handleCancelDiaryFlow for where this is reset.
  const [showContentModal, setShowContentModal] = useState(false);
  const insets = useSafeAreaInsets();

  // ── Voice input ──
  const [listeningMode, setListeningMode] = useState<ListeningMode>('none');
  const scoreAutoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Records when stopSpeechRecognition() was called intentionally (mode switch / cancel).
  // Any error/nomatch event within 2 s of this timestamp is silently discarded.
  const intentionalStopTimeRef = useRef(0);

  // ── Input method settings ──
  const [scoreInputMethod, setScoreInputMethod] = useState<InputMethod>('voice');
  const [contentInputMethod, setContentInputMethod] = useState<InputMethod>('voice');

  // ── Score numeric popup modal ──
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreModalText, setScoreModalText] = useState('');

  // ── Selected character (loaded from settings, persisted by CharacterScreen) ──
  const [selectedCharacterId, setSelectedCharacterId] = useState('leon');
  const selectedCharacterRef = useRef('leon');
  const [idleMessageType, setIdleMessageType] = useState<IdleMessageType | null>(null);

  function clearScoreAutoStop() {
    if (scoreAutoStopRef.current !== null) {
      clearTimeout(scoreAutoStopRef.current);
      scoreAutoStopRef.current = null;
    }
  }

  // Stops recognition for an intentional user action (mode switch, cancel).
  // Stamps a timestamp so the subsequent error/nomatch event is silently discarded.
  function stopVoiceIntentionally() {
    intentionalStopTimeRef.current = Date.now();
    stopSpeechRecognition();
  }

  // Keep the module-level ref in sync so the Tab Navigator can block tab presses.
  useEffect(() => {
    voiceActiveRef.current = listeningMode !== 'none';
  }, [listeningMode]);

  // Hide the bottom tab bar during diary input flow to reclaim vertical space.
  // navigation is typed as NativeStackNavigationProp but at runtime it is the
  // Tab.Navigator's navigation for this tab screen — setOptions is safe here.
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).setOptions({
      tabBarStyle: diaryStep !== 'idle'
        ? { display: 'none' }
        : { backgroundColor: '#FFFAF5', borderTopColor: '#F0EDE8' },
    });
  }, [diaryStep, navigation]);

  // Focus content TextInput when the content modal opens in manual mode.
  useEffect(() => {
    if (showContentModal && contentInputMethod === 'manual') {
      setTimeout(() => contentRef.current?.focus(), 300);
    }
  }, [showContentModal, contentInputMethod]);

  function alertVoiceActive() {
    Alert.alert('音声入力中です', '音声の入力が終わってから移動してください。');
  }

  // Stable per targetDate + selectedCharacterId
  const scoreQuestion = useMemo(
    () =>
      targetDate !== '' && targetDate !== toDateString(new Date())
        ? getAskYesterdayScore(selectedCharacterId)
        : getAskTodayScore(selectedCharacterId),
    [targetDate, selectedCharacterId],
  );

  const bubbleMessage =
    diaryStep === 'score' && scoreEntered ? reactionMessage :
    diaryStep === 'score' ? scoreQuestion :
    (idleMessage || '…');

  // Show worry when a low score (≤40) has been entered; happy is reserved for
  // save-complete. Normal covers idle, pre-score, and high/mid scores.
  const characterExpression = scoreEntered && score <= 40 ? 'worry' : 'normal';

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
        setDiaryStep('score');
        setScoreEntered(true);
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
      setScoreEntered(false);
      setReactionMessage('');
      setContent('');
      setListeningMode('none');
      clearScoreAutoStop();
      stopSpeechRecognition();
      setShowScoreModal(false);
      setShowContentModal(false);

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

        const charId = settings.selectedCharacterId;
        selectedCharacterRef.current = charId;
        setSelectedCharacterId(charId);
        if (existing) {
          setIdleMessage(getAlreadyWrittenComment(charId));
          setIdleMessageType('alreadyWritten');
          setShouldWrite(false);
        } else if (period === 'morning') {
          setIdleMessage(getMorningGreeting(charId));
          setIdleMessageType('morning');
          setShouldWrite(true);
        } else if (period === 'daytime') {
          setIdleMessage(getAfternoonComment(charId));
          setIdleMessageType('daytime');
          setShouldWrite(true);
        } else {
          setIdleMessage(getNightGreeting(charId));
          setIdleMessageType('night');
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
        const clamped = Math.max(0, Math.min(100, parsed));
        setScoreText(String(clamped));
        setScore(clamped);
        setReactionMessage(getScoreReaction(clamped, selectedCharacterRef.current));
        setScoreEntered(true);
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
    // Suppress if this is the tail-event of an intentional stop (mode switch / cancel).
    if (Date.now() - intentionalStopTimeRef.current < 2000) return;
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
    // 'aborted' is the normal code when stop() is called on some devices.
    // The timestamp guard covers 'interrupted' and similar codes that fire when
    // recognition is stopped intentionally (mode switch, cancel).
    if (code === 'aborted') return;
    if (Date.now() - intentionalStopTimeRef.current < 2000) return;

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
        // 4000ms gives enough time for slower speakers without waiting too long.
        scoreAutoStopRef.current = setTimeout(() => {
          console.log('[SpeechRecognition] score auto-stop timer fired');
          scoreAutoStopRef.current = null;
          stopSpeechRecognitionSafe();
        }, 4000);
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

  async function handleScoreModalConfirm() {
    const val = scoreModalText.trim();
    if (val === '') {
      Alert.alert('点数を入力してください', '0〜100の数字を入力してください');
      return;
    }
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) {
      Alert.alert('入力エラー', '0〜100の数字を入力してください');
      return;
    }
    const clamped = Math.max(0, Math.min(100, parsed));
    // Persist score input mode as manual, then show the post-score confirmation UI.
    const updated = await updateAppSettings({ scoreInputMethod: 'manual' });
    setScoreInputMethod(updated.scoreInputMethod);
    setScoreText(String(clamped));
    setScore(clamped);
    setReactionMessage(getScoreReaction(clamped, selectedCharacterRef.current));
    setScoreEntered(true);
    setShowScoreModal(false);
  }

  function goToConfirm(body: string) {
    // Stop any ongoing recognition before navigating — content voice has no auto-stop timer.
    clearScoreAutoStop();
    stopSpeechRecognition();
    setListeningMode('none');
    Keyboard.dismiss();
    setShowContentModal(false);
    navigation.navigate('DiaryConfirm', {
      targetDate,
      score,
      content: body.trim(),
      characterId: selectedCharacterId,
      characterComment: reactionMessage,
    });
  }

  function handleCancelDiaryFlow() {
    clearScoreAutoStop();
    stopSpeechRecognition();
    setListeningMode('none');
    Keyboard.dismiss();
    setDiaryStep('idle');
    setScore(0);
    setScoreText('');
    setScoreEntered(false);
    setReactionMessage('');
    setContent('');
    setShowScoreModal(false);
    setScoreModalText('');
    setShowContentModal(false);
  }

  return (
    <>
      <ScreenLayout scrollable={false}>
        <View style={[styles.inner, diaryStep !== 'idle' && styles.innerFlow]}>

          {/* ── Fixed top character scene ── */}
          {diaryStep === 'idle' && (
            <Text style={styles.appTitle}>おしゃべり日記</Text>
          )}
          <View style={[styles.avatarWrap, diaryStep !== 'idle' && styles.avatarWrapFlow]}>
            <CharacterAvatar characterId={selectedCharacterId} size={diaryStep === 'idle' ? 200 : 160} bust expression={characterExpression} />
            <Text style={styles.characterName}>{getCharacterName(selectedCharacterId)}</Text>
          </View>
          <CharacterBubble
            message={bubbleMessage}
            characterId={selectedCharacterId}
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
              {scoreEntered ? (
                /* ── Post-score: show score badge, 「内容を書く」 as primary ── */
                <>
                  <View style={styles.scoreResultWrap}>
                    <View style={[styles.scoreBig, scoreBg(score)]}>
                      <Text style={styles.scoreBigText}>{score}点</Text>
                    </View>
                  </View>

                  <View style={styles.scorePostActions}>
                    <TouchableOpacity
                      style={styles.writeContentBtn}
                      onPress={() => {
                        setShowContentModal(true);
                        if (contentInputMethod === 'voice' && listeningMode === 'none') {
                          setTimeout(() => autoStartContentVoice(), 200);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.writeContentBtnText}>内容を書く</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.backLink}
                      onPress={() => goToConfirm('')}
                    >
                      <Text style={styles.backLinkText}>点数だけで保存</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.backLink}
                      onPress={() => {
                        setScoreEntered(false);
                        setScoreText('');
                        setScore(0);
                      }}
                    >
                      <Text style={styles.backLinkText}>点数を変える</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : scoreInputMethod === 'voice' ? (
                /* ── Voice mode, waiting for score ── */
                <>
                  {listeningMode === 'score' ? (
                    <View style={[styles.listeningBox, styles.listeningBoxScore]}>
                      <Text style={styles.listeningBoxMain}>🎤 聞き取り中…</Text>
                      <Text style={styles.listeningBoxSub}>点数を話してください（0〜100）</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      disabled={listeningMode !== 'none'}
                      style={styles.voicePrimaryBtn}
                      onPress={handleVoiceScore}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.voicePrimaryIcon}>🎤</Text>
                      <Text style={styles.voicePrimaryText}>点数を音声で入力する</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.modeSwitchLink}
                    onPress={() => {
                      // Stop active recognition before the keyboard appears — keyboard opening
                      // interrupts the AVAudioSession and would fire a spurious error event.
                      if (listeningMode === 'score') {
                        clearScoreAutoStop();
                        stopVoiceIntentionally();
                        setListeningMode('none');
                      }
                      setScoreModalText('');
                      setShowScoreModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modeSwitchLinkText}>数字で入力する</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.cancelLink} onPress={handleCancelDiaryFlow}>
                    <Text style={styles.cancelLinkText}>入力をやめる</Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* ── Manual mode: button opens the numeric modal ── */
                <>
                  <View style={styles.scoreEnterBtnWrap}>
                    <TouchableOpacity
                      style={styles.scoreEnterBtn}
                      onPress={() => { setScoreModalText(''); setShowScoreModal(true); }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.scoreEnterBtnText}>点数を入力する</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.modeSwitchLink}
                    onPress={async () => {
                      const updated = await updateAppSettings({ scoreInputMethod: 'voice' });
                      setScoreInputMethod(updated.scoreInputMethod);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modeSwitchLinkText}>音声で点数を入力する</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.cancelLink} onPress={handleCancelDiaryFlow}>
                    <Text style={styles.cancelLinkText}>入力をやめる</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

        </View>
      </ScreenLayout>

      {/* ── Content-writing modal — matches the calendar-entry flow's popup
           (DiaryFlowScreen's contentPanel): character scene stays fixed
           behind it, only the content step is presented as a sheet. ── */}
      <Modal
        visible={showContentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContentModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.contentModalKAV}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.contentModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowContentModal(false)}
          />

          <View style={[styles.contentPanel, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {contentInputMethod === 'voice' ? (
              <>
                {listeningMode === 'content' ? (
                  <View style={styles.listeningBox}>
                    <Text style={styles.listeningBoxMain}>🎤 聞き取り中…</Text>
                    <Text style={styles.listeningBoxSub}>話し終わったら自動で入力されます</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    disabled={listeningMode !== 'none'}
                    style={styles.voiceContentBtn}
                    onPress={handleVoiceContent}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.voiceContentIcon}>🎤</Text>
                    <Text style={styles.voiceContentBtnText}>話して入力する</Text>
                  </TouchableOpacity>
                )}

                {content !== '' && (
                  <View style={styles.contentPreview}>
                    <Text style={styles.contentPreviewLabel}>入力された内容</Text>
                    <Text style={styles.contentPreviewText}>{content}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.modeSwitchLink}
                  onPress={async () => {
                    if (listeningMode === 'content') {
                      // Stop intentionally — suppress the resulting error/nomatch event.
                      stopVoiceIntentionally();
                      setListeningMode('none');
                    }
                    const updated = await updateAppSettings({ contentInputMethod: 'manual' });
                    setContentInputMethod(updated.contentInputMethod);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modeSwitchLinkText}>
                    {content !== '' ? '入力された内容を編集する' : '文字で入力する'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  ref={contentRef}
                  style={styles.panelInput}
                  multiline
                  placeholder="ここに書く（空でもOK）"
                  placeholderTextColor="#CCC"
                  value={content}
                  onChangeText={setContent}
                  textAlignVertical="top"
                  blurOnSubmit={false}
                  returnKeyType="default"
                />
                <TouchableOpacity
                  style={styles.modeSwitchLink}
                  onPress={async () => {
                    Keyboard.dismiss();
                    const updated = await updateAppSettings({ contentInputMethod: 'voice' });
                    setContentInputMethod(updated.contentInputMethod);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modeSwitchLinkText}>音声で入力する</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.panelOkBtn}
              onPress={() => goToConfirm(content)}
              activeOpacity={0.8}
            >
              <Text style={styles.panelOkBtnText}>この内容でOK</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backLink}
              onPress={() => {
                if (listeningMode !== 'none') { alertVoiceActive(); return; }
                setShowContentModal(false);
              }}
            >
              <Text style={styles.backLinkText}>点数を変える</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => {
                if (listeningMode !== 'none') { alertVoiceActive(); return; }
                handleCancelDiaryFlow();
              }}
            >
              <Text style={styles.cancelLinkText}>入力をやめる</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Score numeric popup modal ── */}
      <Modal
        visible={showScoreModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowScoreModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.scoreModalKAV}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.scoreModalOverlay}
            activeOpacity={1}
            onPress={() => setShowScoreModal(false)}
          >
            <TouchableOpacity style={styles.scoreModalBox} activeOpacity={1} onPress={() => {}}>
              <Text style={styles.scoreModalTitle}>点数を入力</Text>
              <TextInput
                style={styles.scoreModalInput}
                keyboardType="number-pad"
                placeholder="0〜100"
                placeholderTextColor="#CCC"
                value={scoreModalText}
                onChangeText={(t) => setScoreModalText(t.replace(/[^0-9]/g, ''))}
                maxLength={3}
                selectTextOnFocus
                autoFocus
              />
              <View style={styles.scoreModalActions}>
                <TouchableOpacity
                  style={styles.scoreModalCancelBtn}
                  onPress={() => setShowScoreModal(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.scoreModalCancelText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.scoreModalOkBtn}
                  onPress={handleScoreModalConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={styles.scoreModalOkText}>決定</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
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
  innerFlow: {
    paddingTop: 10,
  },

  // ── Fixed character scene ─────────────────────────────────

  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5C4A2A',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  avatarWrapFlow: {
    marginBottom: 4,
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
  voicePrimaryIcon: {
    fontSize: 26,
  },
  voicePrimaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreEnterBtnWrap: {
    alignItems: 'center',
    marginTop: 14,
  },
  scoreEnterBtn: {
    backgroundColor: '#F5A623',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  scoreEnterBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // ── Mode-switch links (shared, score step + content modal) ─

  modeSwitchLink: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  modeSwitchLinkText: {
    fontSize: 13,
    color: '#BBB',
    textDecorationLine: 'underline',
  },

  // ── Score numeric popup modal ──────────────────────────────

  scoreModalKAV: {
    flex: 1,
  },
  scoreModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  scoreModalBox: {
    backgroundColor: '#FFFAF5',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 16,
  },
  scoreModalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#5C4A2A',
    textAlign: 'center',
  },
  scoreModalInput: {
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
  scoreModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  scoreModalCancelBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E0D8CC',
    paddingVertical: 14,
    alignItems: 'center',
  },
  scoreModalCancelText: {
    fontSize: 15,
    color: '#AAA',
    fontWeight: '600',
  },
  scoreModalOkBtn: {
    flex: 1,
    backgroundColor: '#F5A623',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  scoreModalOkText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // ── Score post-entry result ───────────────────────────────

  scoreResultWrap: {
    alignItems: 'center',
    paddingTop: 4,
  },
  scorePostActions: {
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  writeContentBtn: {
    backgroundColor: '#F5A623',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 48,
    alignItems: 'center',
    minWidth: 200,
  },
  writeContentBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // ── Content-writing modal ─────────────────────────────────

  contentModalKAV: {
    flex: 1,
  },
  contentModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  contentPanel: {
    backgroundColor: '#FFFAF5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 14,
  },

  // ── Reaction / content input ──────────────────────────────

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
  backLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  backLinkText: {
    fontSize: 14,
    color: '#AAA',
    textDecorationLine: 'underline',
  },

  voiceContentBtn: {
    backgroundColor: '#F5A623',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  voiceContentIcon: {
    fontSize: 26,
  },
  voiceContentBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  cancelLink: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelLinkText: {
    fontSize: 13,
    color: '#BBB',
    textDecorationLine: 'underline',
  },
  listeningBox: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFF3CC',
    borderWidth: 2,
    borderColor: '#F5A623',
    alignItems: 'center',
    gap: 6,
  },
  listeningBoxScore: {
    marginHorizontal: 24,
    marginTop: 14,
  },
  listeningBoxMain: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C47F00',
  },
  listeningBoxSub: {
    fontSize: 12,
    color: '#C47F00',
  },
  contentPreview: {
    backgroundColor: '#FFF8EE',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0D8A8',
    padding: 12,
    gap: 4,
  },
  contentPreviewLabel: {
    fontSize: 11,
    color: '#AAA',
    fontWeight: '600',
  },
  contentPreviewText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
});
