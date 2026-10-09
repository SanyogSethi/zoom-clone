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
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn("Camera/Microphone access denied or unavailable:", err);
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = audioOnlyStream;
        setStream(audioOnlyStream);
        setHasPermission(true);
      } catch (audioErr) {
        console.warn("Audio-only access also denied or unavailable:", audioErr);
        setHasPermission(false);
      }
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

  // Toggle Mute: enable/disable audio tracks so WebRTC audio flows seamlessly upon unmuting
  const toggleMute = useCallback(() => {
    if (!streamRef.current) return;

    const audioTracks = streamRef.current.getAudioTracks();
    if (isMuted) {
      audioTracks.forEach((track) => {
        track.enabled = true;
      });
      setIsMuted(false);
    } else {
      audioTracks.forEach((track) => {
        track.enabled = false;
      });
      setIsMuted(true);
      setIsSpeaking(false);
    }
  }, [isMuted]);

  // Toggle Video: enable/disable video tracks so WebRTC video flows seamlessly upon resuming
  const toggleVideo = useCallback(() => {
    if (!streamRef.current) return;

    const videoTracks = streamRef.current.getVideoTracks();
    if (isVideoOff) {
      videoTracks.forEach((track) => {
        track.enabled = true;
      });
      setIsVideoOff(false);
    } else {
      videoTracks.forEach((track) => {
        track.enabled = false;
      });
      setIsVideoOff(true);
    }
  }, [isVideoOff]);

  // Force Mute: disable audio tracks for host mute actions
  const forceMute = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
    }
    setIsMuted(true);
    setIsSpeaking(false);
  }, []);

  return {
    stream,
    videoRef,
    isMuted,
    isVideoOff,
    isSpeaking,
    hasPermission,
    toggleMute,
    forceMute,
    toggleVideo,
    stopCamera,
  };
}
