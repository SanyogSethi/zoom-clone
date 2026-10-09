"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Info, ShieldCheck, Loader2, Copy, Check } from "lucide-react";
import { api } from "@/lib/api";
import { Meeting, SessionJoinResponse } from "@/lib/types";
import { formatMeetingCode } from "@/lib/format";
import { useCamera } from "@/hooks/useCamera";
import { useParticipants } from "@/hooks/useParticipants";
import { useWebRTC } from "@/hooks/useWebRTC";
import { VideoGrid } from "@/components/meeting/VideoGrid";
import { ControlBar } from "@/components/meeting/ControlBar";
import { ParticipantsPanel } from "@/components/meeting/ParticipantsPanel";
import { Toast } from "@/components/ui/Toast";

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const meetingCode = typeof params?.code === "string" ? params.code : "";

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionJoinResponse | null>(null);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);

  const infoRef = useRef<HTMLDivElement>(null);
  const prevServerMutedRef = useRef<boolean>(false);

  // Close Info popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setIsInfoOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Request camera & microphone access ONLY when inside active meeting room session
  const { stream, videoRef, isMuted, isVideoOff, isSpeaking, toggleMute, forceMute, toggleVideo, stopCamera } = useCamera({
    enabled: true,
  });

  const { participants, activeParticipants, refreshParticipants } = useParticipants(
    sessionInfo?.session_id ?? null
  );

  const handleMeetingEndedByHost = useCallback(() => {
    stopCamera();
    sessionStorage.removeItem(`session_${meetingCode}`);
    router.push("/");
  }, [stopCamera, meetingCode, router]);

  const handleParticipantRemovedByHost = useCallback(() => {
    stopCamera();
    sessionStorage.removeItem(`session_${meetingCode}`);
    router.push("/");
  }, [stopCamera, meetingCode, router]);

  // Real-time WebRTC audio & video stream sharing across participants
  const { remoteStreams } = useWebRTC({
    meetingCode,
    participantId: sessionInfo?.participant_id ?? null,
    localStream: stream,
    onMeetingEnded: handleMeetingEndedByHost,
    onParticipantRemoved: handleParticipantRemovedByHost,
  });

  // Initialize room session
  useEffect(() => {
    if (!meetingCode) return;

    const initRoom = async () => {
      setLoading(true);
      try {
        const m = await api.getMeetingByCode(meetingCode);
        setMeeting(m);

        const stored = sessionStorage.getItem(`session_${meetingCode}`);
        if (stored) {
          setSessionInfo(JSON.parse(stored));
        } else {
          const joinRes = await api.joinMeeting(meetingCode);
          sessionStorage.setItem(`session_${meetingCode}`, JSON.stringify(joinRes));
          setSessionInfo(joinRes);
        }
      } catch (err: any) {
        console.error("Room init error:", err);
        setToastMsg(err.message || "Unable to join meeting room.");
        setTimeout(() => router.push("/"), 2500);
      } finally {
        setLoading(false);
      }
    };

    initRoom();
  }, [meetingCode, router]);

  const sessionInfoRef = useRef<SessionJoinResponse | null>(null);
  const stopCameraRef = useRef(stopCamera);
  useEffect(() => {
    sessionInfoRef.current = sessionInfo;
    stopCameraRef.current = stopCamera;
  }, [sessionInfo, stopCamera]);

  // Instantly release camera & notify backend leave ONLY when component unmounts on navigation
  useEffect(() => {
    const handleUnload = () => {
      const info = sessionInfoRef.current;
      if (!info) return;
      stopCameraRef.current();
      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/sessions/${info.session_id}/leave`;
      const payload = JSON.stringify({ participant_id: info.participant_id });
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      const info = sessionInfoRef.current;
      if (info) {
        stopCameraRef.current();
        const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/sessions/${info.session_id}/leave`;
        const payload = JSON.stringify({ participant_id: info.participant_id });
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
        }
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(localStorage.getItem("zoom_jwt_token")
              ? { Authorization: `Bearer ${localStorage.getItem("zoom_jwt_token")}` }
              : {}),
          },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, []);

  // Running Elapsed Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");
    return hrs > 0
      ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
      : `${pad(mins)}:${pad(secs)}`;
  };

  const handleLeave = async () => {
    stopCamera(); // Instantly release camera & microphone tracks
    if (sessionInfo) {
      try {
        await api.leaveSession(sessionInfo.session_id, sessionInfo.participant_id);
      } catch (err) {
        console.warn("Leave session error:", err);
      }
    }
    sessionStorage.removeItem(`session_${meetingCode}`);
    router.push("/");
  };

  const handleEndAll = async () => {
    if (sessionInfo) {
      try {
        await api.sendSignal({
          meeting_code: meetingCode,
          from_id: String(sessionInfo.participant_id),
          type: "meeting_ended",
          data: {},
        }).catch(() => {});
        await api.endSession(sessionInfo.session_id);
      } catch (err) {
        console.warn("End session error:", err);
      }
    }
    stopCamera(); // Instantly release camera & microphone tracks
    sessionStorage.removeItem(`session_${meetingCode}`);
    router.push("/");
  };

  // Host Controls
  const handleMuteAll = async () => {
    if (!sessionInfo) return;
    try {
      await api.muteAll(sessionInfo.session_id);
      setToastMsg("All participants muted.");
      refreshParticipants();
    } catch (err: any) {
      setToastMsg(err.message || "Failed to mute participants.");
    }
  };

  const handleMuteParticipant = async (pId: number) => {
    try {
      await api.muteParticipant(pId);
      setToastMsg("Participant muted.");
      refreshParticipants();
    } catch (err: any) {
      setToastMsg(err.message || "Failed to mute participant.");
    }
  };

  const handleRemoveParticipant = async (pId: number) => {
    if (sessionInfo) {
      try {
        await api.sendSignal({
          meeting_code: meetingCode,
          from_id: String(sessionInfo.participant_id),
          to_id: String(pId),
          type: "participant_removed",
          data: { participant_id: pId },
        }).catch(() => {});
      } catch {}
    }
    try {
      await api.removeParticipant(pId);
      setToastMsg("Participant removed.");
      refreshParticipants();
    } catch (err: any) {
      setToastMsg(err.message || "Failed to remove participant.");
    }
  };

  const handleCopyInviteLink = useCallback(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const inviteUrl = `${origin}/j/${meetingCode}`;
    navigator.clipboard.writeText(inviteUrl).then(
      () => setToastMsg("Invite link copied to clipboard!"),
      () => setToastMsg("Failed to copy invite link.")
    );
  }, [meetingCode]);

  const handleCopyMeetingId = useCallback(() => {
    const formatted = formatMeetingCode(meetingCode);
    navigator.clipboard.writeText(formatted).then(
      () => setToastMsg("Meeting ID copied to clipboard!"),
      () => setToastMsg("Failed to copy meeting ID.")
    );
  }, [meetingCode]);

  const handleCloseToast = useCallback(() => {
    setToastMsg(null);
  }, []);

  const isHost = sessionInfo?.role === "host";
  const selfParticipantInList = participants.find((p) => p.id === sessionInfo?.participant_id);
  const selfDisplayName =
    selfParticipantInList?.display_name ||
    sessionInfo?.display_name ||
    "Participant";

  // Automatic exit effect when session ends or participant status is set to left/removed
  useEffect(() => {
    if (!sessionInfo || loading) return;

    if (selfParticipantInList) {
      if (selfParticipantInList.status === "removed") {
        stopCamera();
        sessionStorage.removeItem(`session_${meetingCode}`);
        router.push("/");
        return;
      }

      if (!isHost && selfParticipantInList.status === "left") {
        stopCamera();
        sessionStorage.removeItem(`session_${meetingCode}`);
        router.push("/");
        return;
      }
    }
  }, [selfParticipantInList, sessionInfo, loading, isHost, meetingCode, stopCamera, router]);

  const handleToggleMute = useCallback(async () => {
    const nextMuted = !isMuted;
    toggleMute();
    if (sessionInfo?.participant_id) {
      try {
        if (nextMuted) {
          await api.muteParticipant(sessionInfo.participant_id);
        } else {
          await api.unmuteParticipant(sessionInfo.participant_id);
        }
        refreshParticipants();
      } catch (err) {
        console.warn("Failed to sync mute state:", err);
      }
    }
  }, [isMuted, toggleMute, sessionInfo, refreshParticipants]);

  // Sync host mute state to local client hardware & UI when server status transitions to muted
  useEffect(() => {
    const isServerMuted = Boolean(selfParticipantInList?.is_muted);
    if (isServerMuted && !prevServerMutedRef.current) {
      prevServerMutedRef.current = true;
      forceMute();
    } else if (!isServerMuted && prevServerMutedRef.current) {
      prevServerMutedRef.current = false;
    }
  }, [selfParticipantInList?.is_muted, forceMute]);

  if (loading) {
    return (
      <div className="flex-1 bg-[#1C1C1C] flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-zoom-blue" />
        <span className="text-sm font-semibold text-gray-300">Entering meeting room...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#1C1C1C] text-white overflow-hidden select-none min-h-0">
      {/* Top Meeting Info Bar */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-neutral-800 shrink-0 text-xs bg-[#1C1C1C] z-20 relative">
        <div className="flex items-center gap-3" ref={infoRef}>
          <button
            onClick={() => setIsInfoOpen((prev) => !prev)}
            title="Meeting info"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Info className="w-4 h-4 text-emerald-400" />
          </button>
          <span className="font-semibold text-white tracking-wide">
            {meeting?.title || "Zoom Meeting"}
          </span>
          <span className="text-gray-500">•</span>
          <span className="font-mono text-gray-400 font-medium">
            {formatTimer(secondsElapsed)}
          </span>

          {/* Meeting Info Floating Card */}
          {isInfoOpen && (
            <div className="absolute top-full left-4 mt-1 w-80 bg-[#1E1E22] border border-neutral-700/80 rounded-xl shadow-2xl p-4 z-50 text-xs text-gray-300 animate-in fade-in zoom-in-95 duration-100">
              <h3 className="font-bold text-white text-sm mb-3">
                {meeting?.title || "Zoom Meeting"}
              </h3>
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Meeting ID</span>
                  <div className="flex items-center gap-2 font-mono text-white font-medium">
                    <span>{formatMeetingCode(meetingCode)}</span>
                    <button
                      onClick={handleCopyMeetingId}
                      className="p-1 hover:bg-neutral-700 rounded text-gray-300 hover:text-white transition-colors"
                      title="Copy Meeting ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Host</span>
                  <span className="text-white font-medium">
                    {meeting?.host_display_name || "Host"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Invite Link</span>
                  <button
                    onClick={handleCopyInviteLink}
                    className="px-2 py-1 bg-zoom-blue hover:bg-blue-600 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Link</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-neutral-700/60 flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Enhanced Encryption Enabled</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-zoom-live text-[11px] font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Enhanced Encryption</span>
        </div>
      </div>

      {/* Main Room Body: Video Grid + Slide-over Participants Drawer */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        <div className="flex-1 h-full min-h-0 overflow-hidden flex items-center justify-center">
          <VideoGrid
            selfParticipant={{
              display_name: selfDisplayName,
              role: isHost ? "host" : "participant",
            }}
            videoRef={videoRef}
            selfStream={stream}
            isVideoOff={isVideoOff}
            isMuted={isMuted}
            isSpeaking={isSpeaking}
            remoteParticipants={activeParticipants.filter(
              (p) => p.id !== sessionInfo?.participant_id
            )}
            remoteStreams={remoteStreams}
          />
        </div>

        <ParticipantsPanel
          isOpen={isParticipantsOpen}
          participants={participants}
          currentParticipantId={sessionInfo?.participant_id}
          currentUserId={sessionInfo?.participant_id}
          isHost={isHost}
          onClose={() => setIsParticipantsOpen(false)}
          onMuteAll={handleMuteAll}
          onMuteParticipant={handleMuteParticipant}
          onRemoveParticipant={handleRemoveParticipant}
        />
      </div>

      {/* Bottom Control Bar */}
      <ControlBar
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        participantCount={activeParticipants.length}
        isHost={isHost}
        isParticipantsOpen={isParticipantsOpen}
        onToggleMute={handleToggleMute}
        onToggleVideo={toggleVideo}
        onToggleParticipants={() => setIsParticipantsOpen((prev) => !prev)}
        onCopyInviteLink={handleCopyInviteLink}
        onCopyMeetingId={handleCopyMeetingId}
        onLeave={handleLeave}
        onEndAll={handleEndAll}
      />

      {/* Toast Messages */}
      {toastMsg && (
        <Toast message={toastMsg} onClose={handleCloseToast} />
      )}
    </div>
  );
}
