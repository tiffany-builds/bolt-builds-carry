import { useState, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as NativeSpeechRecognition } from '@capacitor-community/speech-recognition';

interface UseSpeechRecognitionProps {
  onTranscript: (transcript: string) => void;
  onInterimTranscript?: (transcript: string) => void;
  onStart?: () => void;
  onStop?: () => void;
  onError?: (error: string) => void;
}

const isNativePlatform = Capacitor.isNativePlatform();

export function useSpeechRecognition({
  onTranscript,
  onInterimTranscript,
  onStart,
  onStop,
  onError,
}: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [isBrowserSupported] = useState(() => {
    if (isNativePlatform) return true;
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    return !!SpeechRecognition;
  });
  const recognitionRef = useRef<any>(null);
  const partialListenerRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');

  const startListeningNative = useCallback(async () => {
    try {
      const { available } = await NativeSpeechRecognition.available();
      if (!available) {
        onError?.('not-supported');
        return;
      }

      const permission = await NativeSpeechRecognition.checkPermissions();
      if (permission.speechRecognition !== 'granted') {
        const requested = await NativeSpeechRecognition.requestPermissions();
        if (requested.speechRecognition !== 'granted') {
          onError?.('permission-denied');
          return;
        }
      }

      finalTranscriptRef.current = '';

      partialListenerRef.current = await NativeSpeechRecognition.addListener(
        'partialResults',
        (data: { matches: string[] }) => {
          if (data.matches && data.matches.length > 0) {
            const transcript = data.matches[0];
            finalTranscriptRef.current = transcript;
            onInterimTranscript?.(transcript);
          }
        }
      );

      await NativeSpeechRecognition.start({
        language: 'en-US',
        maxResults: 1,
        partialResults: true,
        popup: false,
      });

      setIsListening(true);
      onStart?.();
    } catch (e: any) {
      setIsListening(false);
      onError?.(e?.message || 'start-failed');
    }
  }, [onInterimTranscript, onStart, onError]);

  const stopListeningNative = useCallback(async () => {
    try {
      await NativeSpeechRecognition.stop();
    } catch (e) {
      // ignore stop errors
    }

    if (partialListenerRef.current) {
      partialListenerRef.current.remove();
      partialListenerRef.current = null;
    }

    setIsListening(false);
    onStop?.();

    const transcript = finalTranscriptRef.current.trim();
    if (transcript) {
      onTranscript(transcript);
    } else {
      onError?.('no-speech');
    }
  }, [onTranscript, onStop, onError]);

  const startListeningWeb = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError?.('not-supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onstart = () => {
      setIsListening(true);
      onStart?.();
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += ' ' + event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      onInterimTranscript?.(finalTranscript.trim() + ' ' + interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      onStop?.();
      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim());
      } else {
        onError?.('no-speech');
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      onError?.(event.error);
    };

    try {
      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setIsListening(false);
      onError?.('start-failed');
    }
  }, [onTranscript, onInterimTranscript, onStart, onStop, onError]);

  const stopListeningWeb = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (isNativePlatform) {
      startListeningNative();
    } else {
      startListeningWeb();
    }
  }, [startListeningNative, startListeningWeb]);

  const stopListening = useCallback(() => {
    if (isNativePlatform) {
      stopListeningNative();
    } else {
      stopListeningWeb();
    }
  }, [stopListeningNative, stopListeningWeb]);

  return {
    isListening,
    isBrowserSupported,
    startListening,
    stopListening,
  };
}
