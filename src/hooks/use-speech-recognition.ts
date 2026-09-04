import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Browser speech-to-text via the Web Speech API. Voice is an INPUT METHOD:
 * the transcript is submitted through the normal interview API — no audio is
 * ever sent to the server. Browsers without SpeechRecognition (e.g. Firefox)
 * degrade gracefully to typing.
 */

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const instance = new Ctor();
  return instance as SpeechRecognitionLike;
}

export function useSpeechRecognition() {
  const [supported, setSupported] = useState<boolean>(() => !!getSpeechRecognition());
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(
    (onFinalTranscript: (text: string) => void) => {
      if (!supported) {
        setError("Voice input isn't supported in this browser. Please type your answer.");
        return;
      }
      setError(null);
      setInterim("");
      const recognition = getSpeechRecognition();
      if (!recognition) {
        setSupported(false);
        setError("Voice input isn't supported in this browser. Please type your answer.");
        return;
      }
      recognitionRef.current = recognition;
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let finalText = "";
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }
        setInterim(interimText);
        if (finalText.trim()) {
          onFinalTranscript(finalText);
        }
      };
      recognition.onerror = (event: any) => {
        const reason = event?.error || "unknown";
        setError(
          reason === "not-allowed" || reason === "service-not-allowed"
            ? "Microphone access was denied. Enable it in your browser and try again."
            : reason === "no-speech"
            ? "No speech detected. Please try again."
            : `Voice input error: ${reason}. Please type your answer.`,
        );
        setListening(false);
      };
      recognition.onend = () => setListening(false);

      try {
        recognition.start();
        setListening(true);
      } catch {
        setListening(false);
        setError("Could not start voice input. Please type your answer.");
      }
    },
    [supported],
  );

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return { supported, listening, interim, error, start, stop };
}