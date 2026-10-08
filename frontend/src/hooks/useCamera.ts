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
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
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
    setIsSpeaking(false);
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

  // Web Audio API Voice Activity Detection (VAD)
  useEffect(() => {
    if (!stream || isMuted) {
      setIsSpeaking(false);
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0 || !audioTracks[0].enabled) {
      setIsSpeaking(false);
      return;
    }

    let audioContext: AudioContext | null = null;
    let animFrameId: number;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioCtx();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Green border lights up only when input volume exceeds threshold (> 12)
        setIsSpeaking(avg > 12);
        animFrameId = requestAnimationFrame(checkAudio);
      };

      checkAudio();
    } catch (err) {
      console.warn("AudioContext VAD initialization warning:", err);
    }

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close();
      }
    };
  }, [stream, isMuted]);

  // Ensure video element receives stream when stream updates
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Toggle Mute: when muting, stop audio tracks to release microphone hardware access completely.
  const toggleMute = useCallback(async () => {
    if (!streamRef.current) return;

    if (!isMuted) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.stop();
        streamRef.current?.removeTrack(track);
      });
      setIsMuted(true);
      setIsSpeaking(false);
    } else {
      try {
        const newAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newAudioTrack = newAudioStream.getAudioTracks()[0];
        if (newAudioTrack && streamRef.current) {
          streamRef.current.addTrack(newAudioTrack);
        }
        setIsMuted(false);
      } catch (err) {
        console.warn("Failed to restart microphone stream:", err);
      }
    }
  }, [isMuted]);

  // Toggle Video: when stopping video, stop video tracks so camera light turns OFF.
  const toggleVideo = useCallback(async () => {
    if (!streamRef.current) return;

    if (!isVideoOff) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.stop();
        streamRef.current?.removeTrack(track);
      });
      setIsVideoOff(true);
    } else {
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
    isSpeaking,
    hasPermission,
    toggleMute,
    toggleVideo,
    stopCamera,
  };
}
