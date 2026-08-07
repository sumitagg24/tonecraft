"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export function useVoiceInput(onTranscript?: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let current = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
      if (onTranscript) onTranscript(current);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, [onTranscript]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.warning("Speech recognition is not supported in this browser.");
      return;
    }
    setTranscript("");
    setListening(true);
    recognitionRef.current.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      setListening(false);
    }
  }, [listening]);

  return {
    listening,
    transcript,
    startListening,
    stopListening,
  };
}
