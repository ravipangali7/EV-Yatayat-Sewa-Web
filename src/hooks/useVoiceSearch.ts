import { useState, useCallback, useRef, useEffect } from "react";
import { isAvailable as isFlutterBridgeAvailable, startVoiceSearchNative } from "@/lib/flutterBridge";

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
  const onResultRef = useRef(options?.onResult);
  onResultRef.current = options?.onResult;

  const SpeechRecognitionClass =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : undefined;
  const useNative = typeof window !== "undefined" && isFlutterBridgeAvailable() && typeof startVoiceSearchNative === "function";
  const supported = !!SpeechRecognitionClass || useNative;

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

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript("");

    if (useNative) {
      setListening(true);
      try {
        const result = await startVoiceSearchNative();
        if (result.transcript) {
          setTranscript(result.transcript);
          onResultRef.current?.(result.transcript);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Voice search failed";
        setError(msg);
      } finally {
        setListening(false);
      }
      return;
    }

    if (!SpeechRecognitionClass) {
      setError("Voice search is not supported in this browser.");
      return;
    }
    const rec = new SpeechRecognitionClass();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = options?.lang ?? "en-NP";
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const result = e.results[e.resultIndex];
      const text = result.isFinal ? result[0].transcript : "";
      if (text) {
        setTranscript(text);
        onResultRef.current?.(text);
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
    } catch {
      setError("Could not start microphone.");
      setListening(false);
    }
  }, [SpeechRecognitionClass, useNative, options?.lang]);

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
