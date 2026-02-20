import { useState, useCallback, useRef, useEffect } from "react";

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export function useVoiceSearch(options?: { onResult?: (transcript: string) => void; lang?: string }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const SpeechRecognitionClass =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : undefined;
  const supported = !!SpeechRecognitionClass;

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionClass) {
      setError("Voice search is not supported in this browser.");
      return;
    }
    setError(null);
    setTranscript("");
    const rec = new SpeechRecognitionClass();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = options?.lang ?? "en-NP";
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const result = e.results[e.resultIndex];
      const text = result.isFinal ? result[0].transcript : "";
      if (text) {
        setTranscript(text);
        options?.onResult?.(text);
      }
    };
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== "aborted") setError(e.message ?? e.error ?? "Recognition error");
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch (err) {
      setError("Could not start microphone.");
      setListening(false);
    }
  }, [SpeechRecognitionClass, options?.onResult, options?.lang]);

  useEffect(() => {
    return () => {
      const rec = recognitionRef.current;
      if (rec) {
        try {
          rec.stop();
        } catch (_) {}
      }
    };
  }, []);

  return { listening, startListening, stopListening, transcript, error, supported };
}
