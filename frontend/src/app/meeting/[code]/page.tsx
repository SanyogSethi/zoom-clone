"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Info, ShieldCheck, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Meeting, SessionJoinResponse } from "@/lib/types";
import { useCamera } from "@/hooks/useCamera";
import { useParticipants } from "@/hooks/useParticipants";
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
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);

  const { videoRef, isMuted, isVideoOff, toggleMute, toggleVideo } = useCamera();
  const { participants, activeParticipants, refreshParticipants } = useParticipants(
    sessionInfo?.session_id ?? null
  );

  // Initialize room session and join if needed
  useEffect(() => {
    if (!meetingCode) return;

    const initRoom = async () => {
      setLoading(true);
      try {
        // 1. Verify meeting metadata
        const m = await api.getMeetingByCode(meetingCode);
        setMeeting(m);

        // 2. Check session storage for join state or join session automatically
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
    if (!sessionInfo) return;
    try {
      await api.leaveSession(sessionInfo.session_id, sessionInfo.participant_id);
    } catch (err) {
      console.warn("Leave session error:", err);
    } finally {
      sessionStorage.removeItem(`session_${meetingCode}`);
      router.push("/");
    }
  };

  const handleEndAll = async () => {
    if (!sessionInfo) return;
    try {
      await api.endSession(sessionInfo.session_id);
    } catch (err) {
      console.warn("End session error:", err);
    } finally {
      sessionStorage.removeItem(`session_${meetingCode}`);
      router.push("/");
    }
  };

  // Host Controls (Bonus)
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
    try {
      await api.removeParticipant(pId);
      setToastMsg("Participant removed.");
      refreshParticipants();
    } catch (err: any) {
      setToastMsg(err.message || "Failed to remove participant.");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#1C1C1C] flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-zoom-blue" />
        <span className="text-sm font-semibold text-gray-300">Entering meeting room...</span>
      </div>
    );
  }

  const isHost = sessionInfo?.role === "host";
  const selfDisplayName = "Sanyog Sethi";

  return (
    <div className="flex-1 flex flex-col bg-[#1C1C1C] text-white overflow-hidden select-none">
      {/* Top Meeting Room Overlay Bar */}
      <div className="h-12 bg-[#1C1C1C] px-4 flex items-center justify-between border-b border-neutral-800 z-20 text-xs">
        {/* Left: Meeting Title & Timer */}
        <div className="flex items-center gap-3">
          <button title="Meeting info" className="text-gray-400 hover:text-white">
            <Info className="w-4 h-4" />
          </button>
          <span className="font-semibold text-white tracking-wide">
            {meeting?.title || "Zoom Meeting"}
          </span>
          <span className="text-gray-500">•</span>
          <span className="font-mono text-gray-400 font-medium">
            {formatTimer(secondsElapsed)}
          </span>
        </div>

        {/* Right: Encryption Indicator */}
        <div className="flex items-center gap-2 text-zoom-live text-[11px] font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Enhanced Encryption</span>
        </div>
      </div>

      {/* Main Room Body: Video Grid + Slide-over Participants Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 h-full overflow-hidden">
          <VideoGrid
            selfParticipant={{
              display_name: selfDisplayName,
              role: isHost ? "host" : "participant",
            }}
            videoRef={videoRef}
            isVideoOff={isVideoOff}
            isMuted={isMuted}
            remoteParticipants={activeParticipants.filter((p) => p.user_id !== 1)}
          />
        </div>

        <ParticipantsPanel
          isOpen={isParticipantsOpen}
          participants={participants}
          currentUserId={1}
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
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleParticipants={() => setIsParticipantsOpen((prev) => !prev)}
        onLeave={handleLeave}
        onEndAll={handleEndAll}
      />

      {/* Toast Messages */}
      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
      )}
    </div>
  );
}
