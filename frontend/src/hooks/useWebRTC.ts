"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

export interface UseWebRTCOptions {
  meetingCode: string;
  participantId: number | null;
  localStream: MediaStream | null;
  onMeetingEnded?: () => void;
  onParticipantRemoved?: () => void;
}

function createSyntheticStream(): MediaStream {
  if (typeof window === "undefined" || !document.createElement) {
    return new MediaStream();
  }
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#2D2D2D";
    ctx.fillRect(0, 0, 640, 360);
    ctx.fillStyle = "#0B5CFF";
    ctx.beginPath();
    ctx.arc(320, 150, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LIVE", 320, 150);
  }
  const stream = canvas.captureStream(15);

  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      const audioCtx = new AudioCtxClass();
      const osc = audioCtx.createOscillator();
      const dst = audioCtx.createMediaStreamDestination();
      const gain = audioCtx.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(dst);
      osc.start();
      dst.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    }
  } catch {
    // Ignore audio context errors if unsupported
  }

  return stream;
}

export function useWebRTC({
  meetingCode,
  participantId,
  localStream,
  onMeetingEnded,
  onParticipantRemoved,
}: UseWebRTCOptions) {
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const pendingCandidates = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const processedSignalsRef = useRef<Set<string>>(new Set());
  const localStreamRef = useRef<MediaStream | null>(localStream);
  const onMeetingEndedRef = useRef(onMeetingEnded);
  const onParticipantRemovedRef = useRef(onParticipantRemoved);

  useEffect(() => {
    onMeetingEndedRef.current = onMeetingEnded;
    onParticipantRemovedRef.current = onParticipantRemoved;
  }, [onMeetingEnded, onParticipantRemoved]);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    if (!meetingCode || !participantId) return;

    const myId = String(participantId);
    let isMounted = true;

    // BroadcastChannel for same-profile tabs
    const channelName = `zoom_webrtc_${meetingCode}`;
    const channel = new BroadcastChannel(channelName);

    const sendSignal = (type: string, toId: string | null, dataPayload: any) => {
      try {
        channel.postMessage({
          type,
          fromId: myId,
          toId,
          ...dataPayload,
        });
      } catch {
        // Ignore BroadcastChannel errors
      }

      api
        .sendSignal({
          meeting_code: meetingCode,
          from_id: myId,
          to_id: toId,
          type,
          data: dataPayload,
        })
        .catch(() => {});
    };

    const activeStream = localStreamRef.current || createSyntheticStream();

    const createPeerConnection = (targetId: string): RTCPeerConnection => {
      if (peerConnections.current[targetId]) {
        return peerConnections.current[targetId];
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
        ],
      });

      const currentStream = localStreamRef.current || activeStream;
      if (currentStream) {
        currentStream.getTracks().forEach((track) => {
          pc.addTrack(track, currentStream);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && isMounted) {
          sendSignal("candidate", targetId, { candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        if (isMounted) {
          setRemoteStreams((prev) => {
            const existing = prev[targetId];
            if (existing) {
              const tracks = existing.getTracks();
              if (!tracks.some((t) => t.id === event.track.id)) {
                const updatedStream = new MediaStream([...tracks, event.track]);
                return { ...prev, [targetId]: updatedStream };
              }
              return prev;
            } else {
              const initialStream = (event.streams && event.streams[0])
                ? event.streams[0]
                : new MediaStream([event.track]);
              return { ...prev, [targetId]: new MediaStream(initialStream.getTracks()) };
            }
          });
        }
      };

      peerConnections.current[targetId] = pc;
      return pc;
    };

    const flushCandidates = async (targetId: string, pc: RTCPeerConnection) => {
      if (pendingCandidates.current[targetId]) {
        const cands = pendingCandidates.current[targetId];
        delete pendingCandidates.current[targetId];
        for (const cand of cands) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch {
            // Ignore candidate errors
          }
        }
      }
    };

    const processSignal = async (
      sigId: string | undefined,
      type: string,
      fromId: string,
      toId: string | null,
      payload: any
    ) => {
      if (fromId === myId) return;
      if (toId && toId !== myId) return;
      if (sigId && processedSignalsRef.current.has(sigId)) return;

      if (sigId) {
        processedSignalsRef.current.add(sigId);
      }

      // Deterministic role: smaller participant ID is offerer, larger is answerer (polite peer)
      const isOfferer = Number(myId) < Number(fromId);

      try {
        if (type === "join") {
          const pc = createPeerConnection(fromId);
          if (isOfferer) {
            const offerSdp = await pc.createOffer();
            await pc.setLocalDescription(offerSdp);
            sendSignal("offer", fromId, { offer: offerSdp });
          }
        } else if (type === "offer") {
          const pc = createPeerConnection(fromId);

          const offerCollision = pc.signalingState !== "stable";
          if (offerCollision) {
            if (!isOfferer) {
              // Polite peer rolls back its own offer in favor of the incoming offer
              await pc.setLocalDescription({ type: "rollback" });
            } else {
              // Impolite peer ignores incoming offer; polite peer will accept our offer
              return;
            }
          }

          await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
          await flushCandidates(fromId, pc);

          const answerSdp = await pc.createAnswer();
          await pc.setLocalDescription(answerSdp);
          sendSignal("answer", fromId, { answer: answerSdp });
        } else if (type === "answer") {
          const pc = peerConnections.current[fromId];
          if (pc && pc.signalingState !== "stable") {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
            await flushCandidates(fromId, pc);
          }
        } else if (type === "candidate") {
          const pc = peerConnections.current[fromId];
          if (pc && payload.candidate) {
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } else {
              if (!pendingCandidates.current[fromId]) {
                pendingCandidates.current[fromId] = [];
              }
              pendingCandidates.current[fromId].push(payload.candidate);
            }
          }
        } else if (type === "leave") {
          if (peerConnections.current[fromId]) {
            peerConnections.current[fromId].close();
            delete peerConnections.current[fromId];
          }
          setRemoteStreams((prev) => {
            const updated = { ...prev };
            delete updated[fromId];
            return updated;
          });
        } else if (type === "meeting_ended") {
          if (onMeetingEndedRef.current) {
            onMeetingEndedRef.current();
          }
        } else if (type === "participant_removed") {
          if (toId === myId && onParticipantRemovedRef.current) {
            onParticipantRemovedRef.current();
          }
        }
      } catch (err) {
        console.warn("WebRTC signal processing error:", err);
      }
    };

    channel.onmessage = (event) => {
      const data = event.data;
      if (!data) return;
      processSignal(data.id, data.type, data.fromId, data.toId, data);
    };

    // Poll backend HTTP signaling store every 500ms
    const pollInterval = setInterval(async () => {
      if (!isMounted) return;
      try {
        const signals = await api.pollSignals(meetingCode, myId);
        for (const sig of signals) {
          await processSignal(sig.id, sig.type, sig.from_id, sig.to_id, sig.data);
        }
      } catch {
        // Ignore polling errors
      }
    }, 500);

    // Initial join announcement
    sendSignal("join", null, {});

    // Periodic join heartbeat until remote streams are active
    const heartbeatInterval = setInterval(() => {
      if (!isMounted) return;
      sendSignal("join", null, {});
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      clearInterval(heartbeatInterval);
      sendSignal("leave", null, {});
      channel.close();
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
    };
  }, [meetingCode, participantId]);

  useEffect(() => {
    if (!localStream) return;
    Object.values(peerConnections.current).forEach((pc) => {
      const senders = pc.getSenders();
      localStream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track?.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track);
        } else {
          try {
            pc.addTrack(track, localStream);
          } catch {
            // Ignore track add error
          }
        }
      });
    });
  }, [localStream]);

  return { remoteStreams };
}
