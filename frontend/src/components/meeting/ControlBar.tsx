"use client";

import React, { useState } from "react";
import { Mic, MicOff, Video, VideoOff, Users, PhoneOff } from "lucide-react";
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
  onLeave,
  onEndAll,
}) => {
  const [isLeaveMenuOpen, setIsLeaveMenuOpen] = useState<boolean>(false);

  return (
    <div className="relative h-20 bg-[#1F1F1F] border-t border-neutral-800 px-6 flex items-center justify-between select-none z-40">
      {/* Left Placeholder for layout symmetry */}
      <div className="w-32 hidden sm:block" />

      {/* Center Controls: Icon above label */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* 1. Mute / Unmute */}
        <button
          onClick={onToggleMute}
          className={`flex flex-col items-center justify-center w-16 h-14 rounded-lg transition-colors ${
            isMuted
              ? "text-zoom-danger hover:bg-neutral-800"
              : "text-gray-300 hover:text-white hover:bg-neutral-800"
          }`}
        >
          {isMuted ? <MicOff className="w-5 h-5 mb-1 text-zoom-danger" /> : <Mic className="w-5 h-5 mb-1" />}
          <span className="text-[11px] font-medium">{isMuted ? "Unmute" : "Mute"}</span>
        </button>

        {/* 2. Start / Stop Video */}
        <button
          onClick={onToggleVideo}
          className={`flex flex-col items-center justify-center w-16 h-14 rounded-lg transition-colors ${
            isVideoOff
              ? "text-zoom-danger hover:bg-neutral-800"
              : "text-gray-300 hover:text-white hover:bg-neutral-800"
          }`}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5 mb-1 text-zoom-danger" /> : <Video className="w-5 h-5 mb-1" />}
          <span className="text-[11px] font-medium">{isVideoOff ? "Start Video" : "Stop Video"}</span>
        </button>

        {/* 3. Participants Badge Button */}
        <button
          onClick={onToggleParticipants}
          className={`flex flex-col items-center justify-center w-16 h-14 rounded-lg transition-colors relative ${
            isParticipantsOpen
              ? "bg-neutral-800 text-white"
              : "text-gray-300 hover:text-white hover:bg-neutral-800"
          }`}
        >
          <div className="relative mb-1">
            <Users className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-2 bg-neutral-700 text-white text-[10px] font-bold px-1 rounded-full border border-neutral-900">
              {participantCount}
            </span>
          </div>
          <span className="text-[11px] font-medium">Participants</span>
        </button>
      </div>

      {/* Right Red Leave Button */}
      <div className="relative">
        <button
          onClick={() => setIsLeaveMenuOpen((prev) => !prev)}
          className="bg-zoom-danger hover:bg-zoom-danger-hover active:bg-red-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg"
        >
          <PhoneOff className="w-4 h-4" />
          <span>{isHost ? "End" : "Leave"}</span>
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
