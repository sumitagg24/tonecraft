"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

export interface CameraOptions {
  facingMode?: "user" | "environment";
  quality?: number;
}

export function useNativeCamera(options: CameraOptions = {}) {
  const { facingMode = "environment", quality = 0.85 } = options;
  const [active, setActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      setStream(mediaStream);
      setActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch {
      toast.error("Camera access denied or unavailable");
      setActive(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActive(false);
  }, [stream]);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || !active) return null;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    return dataUrl;
  }, [active, quality]);

  return {
    active,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
  };
}
