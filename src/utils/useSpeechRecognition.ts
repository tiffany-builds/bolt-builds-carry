import { useEffect, useRef, useState } from 'react';

interface UseSpeechRecognitionProps {
  onTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onStart?: () => void;
  onStop?: () => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition({
  onTranscript,
  onInterimTranscript,
  onStart,
  onStop,
  onError,
}: UseSpeechRecognitionProps) {
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsBrowserSupported(false);
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.language = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      onStart?.();
    };

    recognition.onend = () => {
      setIsListening(false);
      onStop?.();
    };

    recognition.onresult = (event: any) => {
      let transcript = '';
      let isFinal = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript;
        transcript += transcriptSegment;
        if (event.results[i].isFinal) {
          isFinal = true;
        }
      }

      const trimmedTranscript = transcript.trim();

      if (isFinal) {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = window.setTimeout(() => {
          if (trimmedTranscript) {
            onTranscript(trimmedTranscript);
            recognition.stop();
          }
        }, 1500);
      } else {
        onInterimTranscript?.(trimmedTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        onError?.(event.error);
      }
    };

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      recognition.abort();
    };
  }, [onTranscript, onInterimTranscript, onStart, onStop, onError]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.abort();
      setIsListening(false);
    }
  };

  return {
    isListening,
    isBrowserSupported,
    startListening,
    stopListening,
  };
}
