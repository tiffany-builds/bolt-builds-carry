import { useState, useCallback, useRef } from 'react';

interface UseSpeechRecognitionProps {
  onTranscript: (transcript: string) => void;
  onInterimTranscript?: (transcript: string) => void;
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
  const [isListening, setIsListening] = useState(false);
  const [isBrowserSupported] = useState(() => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    return !!SpeechRecognition;
  });
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    console.log("VOICE: startListening called");

    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.log("VOICE: Speech not supported — calling onError");
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
      console.log("VOICE: Recognition started");
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
      console.log("VOICE: Recognition ended. Final transcript:", finalTranscript);
      setIsListening(false);
      onStop?.();
      if (finalTranscript.trim()) {
        console.log("VOICE: Calling onTranscript with:", finalTranscript.trim());
        onTranscript(finalTranscript.trim());
      } else {
        console.log("VOICE: No transcript captured");
        onError?.('no-speech');
      }
    };

    recognition.onerror = (event: any) => {
      console.log("VOICE: Recognition error:", event.error);
      setIsListening(false);
      onError?.(event.error);
    };

    try {
      recognitionRef.current = recognition;
      recognition.start();
      console.log("VOICE: recognition.start() called successfully");
    } catch (e) {
      console.log("VOICE: Failed to start recognition:", e);
      setIsListening(false);
      onError?.('start-failed');
    }
  }, [onTranscript, onInterimTranscript, onStart, onStop, onError]);

  const stopListening = useCallback(() => {
    console.log("VOICE: stopListening called");
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    isBrowserSupported,
    startListening,
    stopListening,
  };
}
