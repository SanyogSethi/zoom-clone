"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface UseCameraOptions {
  enabled?: boolean;
}

export function useCamera(options: UseCameraOptions = { enabled: true }) {
  const { enabled = true } = options;
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop all camera and microphone tracks immediately
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    setStream(null);
    setHasPermission(null);
  }, []);

  // Request camera and microphone access only when enabled is true
  const initCamera = useCallback(async () => {
    if (!enabled) return;
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn("Camera/Microphone access denied or unavailable:", err);
      setHasPermission(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      initCamera();
    }
    return () => {
      // Cleanup using streamRef ensures tracks stop even if state closure is stale
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [enabled, initCamera]);

  // Attach stream to video ref whenever stream or ref changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const nextMuted = !isMuted;
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
      setIsMuted(nextMuted);
    }
  }, [isMuted]);

  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const nextVideoOff = !isVideoOff;
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !nextVideoOff;
      });
      setIsVideoOff(nextVideoOff);
    }
  }, [isVideoOff]);

  return {
    stream,
    videoRef,
    isMuted,
    isVideoOff,
    hasPermission,
    toggleMute,
    toggleVideo,
    stopCamera,
  };
}
