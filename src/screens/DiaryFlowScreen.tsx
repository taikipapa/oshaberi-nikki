import React, { useEffect, useMemo, useState, useRef } from 'react';
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
import { CHARACTERS, DEFAULT_CHARACTER_ID } from '../constants/characters';
import { toDateString, formatMonthDayJa } from '../utils/dateUtils';
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
import { getAppSettings, updateAppSettings, InputMethod } from '../storage/settingsStorage';

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
  const { targetDate, initialScore, initialContent, editParams, initialCharacterId } = route.params;
  const insets = useSafeAreaInsets();

  const isYesterday = targetDate !== toDateString(new Date());

  // Priority: edit mode char > caller-supplied char > default
  const charId = editParams?.characterId ?? initialCharacterId ?? DEFAULT_CHARACTER_ID;
  const charName = CHARACTERS.find((c) => c.id === charId)?.name ?? 'ハナ';

  const scoreQuestion = useMemo(
    () =>
      isYesterday
        ? getAskYesterdayScore(charId)
        : getAskTodayScore(charId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isYesterday],
  );
  const [contentQuestion] = useState(() => getAskContent(charId));

  const headerDate = (() => {
    const [y, m, d] = targetDate.split('-');
    const wd = ['日', '月', '火', '水', '木', '金', '土'][new Date(Number(y), Number(m) - 1, Number(d)).getDay()];
    return `${formatMonthDayJa(targetDate)}（${wd}）`;
  })();

  const [step, setStep] = useState<Step>(initialScore !== undefined ? 'reaction' : 'score');
  const [score, setScore] = useState(initialScore ?? 0);
  const [scoreText, setScoreText] = useState(initialScore !== undefined ? String(initialScore) : '');
  const [reactionMessage, setReactionMessage] = useState(
    initialScore !== undefined ? getScoreReaction(initialScore, charId) : '',
  );
  const [content, setContent] = useState(initialContent ?? '');
  const [showContentModal, setShowContentModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreModalText, setScoreModalText] = useState('');
  const contentRef = useRef<TextInput>(null);

  const [isListening, setIsListening] = useState(false);
  const voiceTargetRef = useRef<'score' | 'content' | null>(null);

  // Input-method settings — same source of truth as HomeScreen/SettingsScreen,
  // so the calendar-entry flow's initial UI (voice vs manual) matches whatever
  // the user last chose, instead of always showing both options at once.
  const [scoreInputMethod, setScoreInputMethod] = useState<InputMethod>('voice');
  const [contentInputMethod, setContentInputMethod] = useState<InputMethod>('voice');

  useEffect(() => {
    let active = true;
    getAppSettings().then((s) => {
      if (!active) return;
      setScoreInputMethod(s.scoreInputMethod);
      setContentInputMethod(s.contentInputMethod);
    });
    return () => { active = false; };
  }, []);

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
        const clamped = Math.max(0, Math.min(100, parsed));
        setScore(clamped);
        setScoreText(String(clamped));
        setReactionMessage(getScoreReaction(clamped, charId));
        setStep('reaction');
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
    // Persist score input mode as manual, same as HomeScreen — confirming a
    // numeric score is what actually commits the mode switch.
    const updated = await updateAppSettings({ scoreInputMethod: 'manual' });
    setScoreInputMethod(updated.scoreInputMethod);
    setScore(clamped);
    setScoreText(String(clamped));
    setReactionMessage(getScoreReaction(clamped, charId));
    setShowScoreModal(false);
    setStep('reaction');
  }

  function goToConfirm(body: string) {
    setShowContentModal(false);
    Keyboard.dismiss();
    navigation.navigate('DiaryConfirm', {
      targetDate,
      score,
      content: body.trim(),
      characterId: charId,
      editParams,
      characterComment: reactionMessage,
    });
  }

  return (
    <>
      <ScreenLayout scrollable={false}>

        {/* ── Shared character header — same visual on every step ── */}
        <View style={styles.charHeader}>
          <Text style={styles.screenTitle}>{headerDate}</Text>
          <View style={styles.avatarWrap}>
            <CharacterAvatar characterId={charId} size={155} bust />
            <Text style={styles.charName}>{charName}</Text>
          </View>
          <CharacterBubble
            message={bubbleMessage}
            characterId={charId}
            showAvatar={false}
          />
        </View>

        {/* ── Step 1: Score input ── */}
        {step === 'score' && (
          <View style={styles.scoreBody}>
            {scoreInputMethod === 'voice' ? (
              <>
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

                <TouchableOpacity
                  style={styles.numericLink}
                  onPress={() => {
                    if (isListening) stopSpeechRecognition();
                    setScoreModalText(scoreText);
                    setShowScoreModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.numericLinkText}>数字で入力する</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.voicePrimaryBtn}
                  onPress={() => { setScoreModalText(scoreText); setShowScoreModal(true); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.voicePrimaryIcon}>🔢</Text>
                  <Text style={styles.voicePrimaryText}>点数を数字で入力する</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.numericLink}
                  onPress={async () => {
                    const updated = await updateAppSettings({ scoreInputMethod: 'voice' });
                    setScoreInputMethod(updated.scoreInputMethod);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.numericLinkText}>音声で入力する</Text>
                </TouchableOpacity>
              </>
            )}
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
              onPress={() => {
                setShowContentModal(true);
                if (contentInputMethod === 'voice' && !isListening) {
                  setTimeout(() => handleVoiceContent(), 200);
                }
              }}
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

            {contentInputMethod === 'voice' ? (
              <>
                <TouchableOpacity
                  style={[styles.voiceContentBtn, isListening && styles.voiceContentBtnActive]}
                  onPress={handleVoiceContent}
                  activeOpacity={0.8}
                >
                  <Text style={styles.voiceContentBtnText}>
                    {isListening ? '⏹ 認識中… タップで止める' : '🎤 話して入力する'}
                  </Text>
                </TouchableOpacity>

                {content !== '' && (
                  <View style={styles.contentPreview}>
                    <Text style={styles.contentPreviewLabel}>入力された内容</Text>
                    <Text style={styles.contentPreviewText}>{content}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.modeSwitchLink}
                  onPress={async () => {
                    if (isListening) stopSpeechRecognition();
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
              style={styles.panelBack}
              onPress={() => setShowContentModal(false)}
            >
              <Text style={styles.panelBackText}>戻る</Text>
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

  // ── Shared character header ───────────────────────────────

  charHeader: {
    paddingTop: 8,
    alignItems: 'center',
    gap: 2,
  },
  screenTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#AAA',
    letterSpacing: 0.3,
  },
  screenSubTitle: {
    fontSize: 12,
    color: '#BBB',
  },
  avatarWrap: {
    alignItems: 'center',
    marginTop: 4,
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
  numericLink: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  numericLinkText: {
    fontSize: 15,
    color: '#888',
    textDecorationLine: 'underline',
  },
  scoreModalKAV: {
    flex: 1,
    justifyContent: 'center',
  },
  scoreModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreModalBox: {
    backgroundColor: '#FFFAF5',
    borderRadius: 20,
    padding: 24,
    width: '80%',
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
    borderWidth: 1.5,
    borderColor: '#E0D8CC',
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 32,
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
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  scoreModalCancelText: {
    fontSize: 16,
    color: '#888',
  },
  scoreModalOkBtn: {
    flex: 1,
    backgroundColor: '#F5A623',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  scoreModalOkText: {
    fontSize: 16,
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
  modeSwitchLink: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modeSwitchLinkText: {
    fontSize: 13,
    color: '#BBB',
    textDecorationLine: 'underline',
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
