"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

export function useScreenRecorder() {
  const [recording, setRecording] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setMediaUrl(url);
        setRecording(false);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
      toast.info("Screen recording started.");
    } catch {
      toast.error("Screen recording permission denied or unsupported");
      setRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      toast.success("Recording stopped.");
    }
  }, [recording]);

  return {
    recording,
    mediaUrl,
    startRecording,
    stopRecording,
  };
}
