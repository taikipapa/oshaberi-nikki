import { useEffect, useRef } from 'react';
import {
  requireOptionalNativeModule,
  EventEmitter,
  type EventSubscription,
} from 'expo-modules-core';

// requireOptionalNativeModule returns null (never throws) when the native module
// is absent — e.g. in Expo Go. This prevents the "Cannot find native module
// 'ExpoSpeechRecognition'" crash at app startup.
//
// In a development build the module is present and all voice calls work normally.
// In Expo Go SpeechModule is null → every guard returns false / skips silently.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechModule = requireOptionalNativeModule<any>('ExpoSpeechRecognition');
const speechEmitter = SpeechModule
  ? new EventEmitter<Record<string, any>>(SpeechModule) // eslint-disable-line @typescript-eslint/no-explicit-any
  : null;

type Handler = (payload: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

// Safe event hook: registers a native listener only when the module exists.
// handlerRef keeps the callback up-to-date so stale closures are never an issue.
export function useSafeSpeechEvent(eventName: string, handler: Handler) {
  const handlerRef = useRef<Handler>(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!speechEmitter) return; // Expo Go — no-op

    let sub: EventSubscription | null = null;
    try {
      sub = speechEmitter.addListener(
        eventName,
        (payload: unknown) => handlerRef.current(payload),
      );
    } catch {}

    return () => {
      try { sub?.remove(); } catch {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName]);
}

// Returns true  → recognition started successfully (development build)
// Returns false → module unavailable (Expo Go) or device not supported
// Throws { message: 'permission_denied' } → user denied microphone
export async function startSpeechRecognition(lang = 'ja-JP'): Promise<boolean> {
  console.log('[SpeechRecognition] startSpeechRecognition called, lang:', lang);
  console.log('[SpeechRecognition] SpeechModule available:', SpeechModule !== null);
  if (!SpeechModule) return false; // Expo Go

  try {
    const available: boolean = SpeechModule.isRecognitionAvailable();
    console.log('[SpeechRecognition] isRecognitionAvailable:', available);
    if (!available) {
      console.warn('[SpeechRecognition] recognition not available on this device');
      return false;
    }

    const permResult = await SpeechModule.requestPermissionsAsync();
    console.log('[SpeechRecognition] permission result:', JSON.stringify(permResult));
    const { granted } = permResult as { granted: boolean };
    if (!granted) throw { message: 'permission_denied' };

    console.log('[SpeechRecognition] calling start({ lang:', lang, ', interimResults: false })');
    SpeechModule.start({ lang, interimResults: false });
    return true;
  } catch (e: unknown) {
    if ((e as { message?: string })?.message === 'permission_denied') throw e;
    console.warn('[SpeechRecognition] unexpected error in startSpeechRecognition:', e);
    return false;
  }
}

export function stopSpeechRecognition() {
  if (!SpeechModule) return; // Expo Go
  try { SpeechModule.stop(); } catch {}
}

// Alias with an explicit "safe" name — never throws, no-ops in Expo Go.
// Use this for auto-stop timers where the module state is uncertain.
export const stopSpeechRecognitionSafe = stopSpeechRecognition;
