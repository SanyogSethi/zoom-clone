"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize camera and microphone media stream
  const initCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setStream(mediaStream);
      setHasPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn("Camera/Microphone access denied or unavailable:", err);
      setHasPermission(false);
    }
  }, []);

  useEffect(() => {
    initCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Ensure video element receives stream when ref changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef.current]);

  const toggleMute = useCallback(() => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // Toggle track enabled state
      });
    }
    setIsMuted((prev) => !prev);
  }, [stream, isMuted]);

  const toggleVideo = useCallback(() => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff; // Toggle track enabled state
      });
    }
    setIsVideoOff((prev) => !prev);
  }, [stream, isVideoOff]);

  return {
    stream,
    videoRef,
    isMuted,
    isVideoOff,
    hasPermission,
    toggleMute,
    toggleVideo,
  };
}
