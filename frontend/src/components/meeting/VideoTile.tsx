"use client";

import React from "react";
import { MicOff } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Participant } from "@/lib/types";

export interface VideoTileProps {
  participant: Partial<Participant> & { display_name: string };
  isSelf?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement>;
  isVideoOff?: boolean;
  isMuted?: boolean;
  isActiveSpeaker?: boolean;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  participant,
  isSelf = false,
  videoRef,
  isVideoOff = false,
  isMuted = false,
  isActiveSpeaker = false,
}) => {
  const isCameraActive = isSelf && !isVideoOff && videoRef;

  return (
    <div
      className={`relative w-full h-full max-h-full bg-[#2D2D2D] rounded-xl overflow-hidden flex items-center justify-center border-2 transition-all duration-150 min-h-0 ${
        isActiveSpeaker
          ? "border-zoom-live shadow-[0_0_15px_rgba(46,182,125,0.4)]"
          : "border-neutral-800"
      }`}
    >
      {/* Real Camera Stream for Self (DOM node stays mounted so videoRef stays attached) */}
      {isSelf && videoRef && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 max-h-full ${
            isCameraActive ? "block" : "hidden"
          }`}
        />
      )}

      {/* Initials Avatar fallback when video is off or for remote participants */}
      {(!isSelf || isVideoOff || !videoRef) && (
        <div className="flex flex-col items-center justify-center gap-3 select-none p-4">
          <Avatar name={participant.display_name} size="xl" />
        </div>
      )}

      {/* Bottom Left: Name Label Tag */}
      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-md flex items-center gap-2 text-white text-xs font-medium select-none z-10">
        {isMuted && <MicOff className="w-3.5 h-3.5 text-zoom-danger" />}
        <span>
          {participant.display_name}
          {isSelf ? " (Me)" : ""}
          {participant.role === "host" ? " (Host)" : ""}
        </span>
      </div>
    </div>
  );
};
