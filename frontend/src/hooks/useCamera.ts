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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [enabled, initCamera]);

  // Ensure video element receives stream when stream updates
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

  // Toggle Video: when stopping video, stop hardware tracks so camera light turns OFF.
  // When starting video, acquire new video track and re-attach to stream and video element.
  const toggleVideo = useCallback(async () => {
    if (!streamRef.current) return;

    if (!isVideoOff) {
      // Stopping video: stop video tracks to turn off hardware camera light
      streamRef.current.getVideoTracks().forEach((track) => {
        track.stop();
        streamRef.current?.removeTrack(track);
      });
      setIsVideoOff(true);
    } else {
      // Starting video: re-acquire video track and attach to stream
      try {
        const newVideoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        const newVideoTrack = newVideoStream.getVideoTracks()[0];
        if (newVideoTrack && streamRef.current) {
          streamRef.current.addTrack(newVideoTrack);
          if (videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
          }
        }
        setIsVideoOff(false);
      } catch (err) {
        console.warn("Failed to restart camera stream:", err);
      }
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
