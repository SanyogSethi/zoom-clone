"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  MessageSquare,
  Smile,
  Share2,
  ShieldCheck,
  MoreHorizontal,
  ChevronUp,
  X,
} from "lucide-react";
import { LeaveMenu } from "./LeaveMenu";

export interface ControlBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  participantCount: number;
  isHost: boolean;
  isParticipantsOpen: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleParticipants: () => void;
  onCopyInviteLink?: () => void;
  onCopyMeetingId?: () => void;
  onLeave: () => void;
  onEndAll: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isMuted,
  isVideoOff,
  participantCount,
  isHost,
  isParticipantsOpen,
  onToggleMute,
  onToggleVideo,
  onToggleParticipants,
  onCopyInviteLink,
  onCopyMeetingId,
  onLeave,
  onEndAll,
}) => {
  const [isLeaveMenuOpen, setIsLeaveMenuOpen] = useState<boolean>(false);
  const [isParticipantsMenuOpen, setIsParticipantsMenuOpen] = useState<boolean>(false);

  const participantsMenuRef = useRef<HTMLDivElement>(null);

  // Click outside listener for participants context menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        participantsMenuRef.current &&
        !participantsMenuRef.current.contains(e.target as Node)
      ) {
        setIsParticipantsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyLinkAction = () => {
    setIsParticipantsMenuOpen(false);
    if (onCopyInviteLink) {
      onCopyInviteLink();
    }
  };

  const handleCopyMeetingIdAction = () => {
    setIsParticipantsMenuOpen(false);
    if (onCopyMeetingId) {
      onCopyMeetingId();
    }
  };

  return (
    <div className="relative h-16 sm:h-20 bg-[#18181B] border-t border-neutral-800/80 px-4 sm:px-8 flex items-center justify-between select-none z-40">
      {/* Left Spacer for symmetry */}
      <div className="w-16 hidden md:block" />

      {/* Main Control Bar Row: Icon above Label */}
      <div className="flex items-center gap-2 sm:gap-4.5 justify-center flex-1 max-w-4xl mx-auto">
        {/* 1. Audio Button */}
        <button
          onClick={onToggleMute}
          className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg transition-all ${
            isMuted
              ? "text-[#FF5B5B] hover:bg-neutral-800"
              : "text-gray-300 hover:text-white hover:bg-neutral-800"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          <div className="flex items-center gap-0.5">
            {isMuted ? <MicOff className="w-5 h-5 text-[#FF5B5B]" /> : <Mic className="w-5 h-5" />}
            <ChevronUp className="w-3 h-3 text-gray-400" />
          </div>
          <span className="text-[11px] font-medium mt-1">{isMuted ? "Unmute" : "Audio"}</span>
        </button>

        {/* 2. Video Button */}
        <button
          onClick={onToggleVideo}
          className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg transition-all ${
            isVideoOff
              ? "text-[#FF5B5B] hover:bg-neutral-800"
              : "text-gray-300 hover:text-white hover:bg-neutral-800"
          }`}
          title={isVideoOff ? "Start Video" : "Stop Video"}
        >
          <div className="flex items-center gap-0.5">
            {isVideoOff ? <VideoOff className="w-5 h-5 text-[#FF5B5B]" /> : <Video className="w-5 h-5" />}
            <ChevronUp className="w-3 h-3 text-gray-400" />
          </div>
          <span className="text-[11px] font-medium mt-1">{isVideoOff ? "Start Video" : "Video"}</span>
        </button>

        {/* 3. Participants Button with Menu Arrow */}
        <div ref={participantsMenuRef} className="relative">
          {/* Floating Context Menu */}
          {isParticipantsMenuOpen && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#1E1E22] border border-neutral-700/80 rounded-xl shadow-2xl py-2 px-1 w-64 z-50 text-xs select-none animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={handleCopyLinkAction}
                className="w-full flex items-center justify-between px-3 py-1.5 text-gray-200 hover:bg-[#2A2B30] hover:text-white rounded-lg transition-colors text-left font-medium"
              >
                <span>Copy Invite Link</span>
                <span className="text-gray-500 font-mono text-[10px]">⌘I</span>
              </button>
              <button
                type="button"
                onClick={handleCopyMeetingIdAction}
                className="w-full flex items-center justify-between px-3 py-1.5 text-gray-200 hover:bg-[#2A2B30] hover:text-white rounded-lg transition-colors text-left font-medium"
              >
                <span>Copy Meeting ID</span>
                <span className="text-gray-500 font-mono text-[10px]">⇧⌘I</span>
              </button>
              <div className="my-1.5 border-t border-neutral-700/80" />
              <div className="px-3 py-1.5 text-gray-400 opacity-60 cursor-not-allowed text-left">
                Host tools for participants
              </div>
              <div className="px-3 py-1.5 text-gray-400 opacity-60 cursor-not-allowed text-left">
                Remove from toolbar
              </div>
            </div>
          )}

          <div
            className={`flex items-center rounded-lg transition-all ${
              isParticipantsOpen
                ? "bg-[#38383B] text-white"
                : "text-gray-300 hover:text-white hover:bg-neutral-800"
            }`}
          >
            {/* Main Participants Button */}
            <button
              onClick={onToggleParticipants}
              className="flex flex-col items-center justify-center pl-2.5 pr-1 py-1"
              title="Participants"
            >
              <div className="flex items-center gap-1">
                <Users className="w-5 h-5" />
                <span className="text-xs font-semibold">{participantCount}</span>
              </div>
              <span className="text-[11px] font-medium mt-1">Participants</span>
            </button>

            {/* Arrow Button for Context Menu */}
            <button
              type="button"
              onClick={() => setIsParticipantsMenuOpen(!isParticipantsMenuOpen)}
              className="pr-2 pl-0.5 py-3 hover:text-white transition-colors"
              title="Participants menu"
            >
              <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* 4. Chat (Placeholder) */}
        <button
          disabled
          className="hidden xs:flex flex-col items-center justify-center px-2 py-1 text-gray-400 opacity-80 cursor-not-allowed"
          title="Chat (Unavailable)"
        >
          <div className="flex items-center gap-0.5">
            <MessageSquare className="w-5 h-5" />
            <ChevronUp className="w-3 h-3 text-gray-500" />
          </div>
          <span className="text-[11px] font-medium mt-1">Chat</span>
        </button>

        {/* 5. React (Placeholder) */}
        <button
          disabled
          className="hidden sm:flex flex-col items-center justify-center px-2 py-1 text-gray-400 opacity-80 cursor-not-allowed"
          title="Reactions (Unavailable)"
        >
          <div className="flex items-center gap-0.5">
            <Smile className="w-5 h-5" />
            <ChevronUp className="w-3 h-3 text-gray-500" />
          </div>
          <span className="text-[11px] font-medium mt-1">React</span>
        </button>

        {/* 6. Share (Placeholder) */}
        <button
          disabled
          className="hidden sm:flex flex-col items-center justify-center px-2 py-1 text-gray-400 opacity-80 cursor-not-allowed"
          title="Share Screen (Unavailable)"
        >
          <div className="flex items-center gap-0.5">
            <Share2 className="w-5 h-5" />
            <ChevronUp className="w-3 h-3 text-gray-500" />
          </div>
          <span className="text-[11px] font-medium mt-1">Share</span>
        </button>

        {/* 7. Host Tools (Placeholder) */}
        <button
          disabled
          className="hidden md:flex flex-col items-center justify-center px-2 py-1 text-gray-400 opacity-80 cursor-not-allowed"
          title="Host Tools (Unavailable)"
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-1">Host tools</span>
        </button>

        {/* 8. More (Placeholder) */}
        <button
          disabled
          className="hidden md:flex flex-col items-center justify-center px-2 py-1 text-gray-400 opacity-80 cursor-not-allowed"
          title="More options (Unavailable)"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-1">More</span>
        </button>
      </div>

      {/* Far Right Red End Button matching Zoom icon badge */}
      <div className="relative shrink-0">
        <button
          onClick={() => setIsLeaveMenuOpen((prev) => !prev)}
          className="flex flex-col items-center justify-center px-2 py-1 text-gray-200 hover:text-white transition-all group"
          title="End meeting"
        >
          <div className="w-6 h-6 rounded-md bg-[#E02828] hover:bg-[#C82020] active:bg-red-800 flex items-center justify-center text-white shadow transition-colors">
            <X className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-[11px] font-medium mt-1 text-gray-300 group-hover:text-white">
            End
          </span>
        </button>

        <LeaveMenu
          isOpen={isLeaveMenuOpen}
          isHost={isHost}
          onClose={() => setIsLeaveMenuOpen(false)}
          onLeave={() => {
            setIsLeaveMenuOpen(false);
            onLeave();
          }}
          onEndAll={() => {
            setIsLeaveMenuOpen(false);
            onEndAll();
          }}
        />
      </div>
    </div>
  );
};

