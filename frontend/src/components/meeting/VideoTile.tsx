"use client";

import React from "react";
import { MicOff, Pin, PinOff } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Participant } from "@/lib/types";

export interface VideoTileProps {
  participant: Partial<Participant> & { display_name: string };
  isSelf?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement>;
  selfStream?: MediaStream | null;
  isVideoOff?: boolean;
  isMuted?: boolean;
  isActiveSpeaker?: boolean;
  remoteStream?: MediaStream;
  isPinned?: boolean;
  onPin?: () => void;
  isCompact?: boolean;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  participant,
  isSelf = false,
  videoRef,
  selfStream,
  remoteStream,
  isVideoOff = false,
  isMuted = false,
  isActiveSpeaker = false,
  isPinned = false,
  onPin,
  isCompact = false,
}) => {
  const isCameraActive = isSelf && !isVideoOff && (videoRef || selfStream);

  return (
    <div
      className={`relative w-full h-full max-h-full bg-[#2D2D2D] rounded-xl overflow-hidden flex items-center justify-center border-2 transition-all duration-150 min-h-0 group select-none ${
        isActiveSpeaker
          ? "border-zoom-live shadow-[0_0_15px_rgba(46,182,125,0.4)]"
          : isPinned
          ? "border-[#0B5CFF]"
          : "border-neutral-800/80"
      }`}
    >
      {/* Real Camera Stream for Self */}
      {isSelf && (videoRef || selfStream) && (
        <video
          ref={(el) => {
            if (videoRef) {
              (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
            }
            if (el && selfStream && el.srcObject !== selfStream) {
              el.srcObject = selfStream;
              el.play().catch(() => {});
            }
          }}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 max-h-full ${
            isCameraActive ? "block" : "hidden"
          }`}
        />
      )}

      {/* Real WebRTC Stream (Video + Audio) for Remote Participant */}
      {!isSelf && remoteStream && (
        <video
          ref={(el) => {
            if (el) {
              if (el.srcObject !== remoteStream) {
                el.srcObject = remoteStream;
              }
              el.play().catch(() => {});
            }
          }}
          autoPlay
          playsInline
          className={`w-full h-full object-cover max-h-full ${
            !isVideoOff ? "block" : "opacity-0 absolute inset-0 pointer-events-none"
          }`}
        />
      )}

      {/* Initials Avatar fallback when video is off or stream unavailable */}
      {((isSelf && (isVideoOff || !videoRef)) || (!isSelf && (isVideoOff || !remoteStream))) && (
        <div className="flex flex-col items-center justify-center gap-2 select-none p-2">
          <Avatar name={participant.display_name} size={isCompact ? "md" : "xl"} />
        </div>
      )}

      {/* Top Right: Pin / Unpin Hover Button */}
      {onPin && (
        <button
          type="button"
          onClick={onPin}
          className={`absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-all z-20 ${
            isPinned ? "opacity-100 bg-[#0B5CFF] hover:bg-[#004FE0]" : "opacity-0 group-hover:opacity-100"
          }`}
          title={isPinned ? "Unpin video" : "Pin video"}
        >
          {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Bottom Left: Name Label Tag */}
      <div
        className={`absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur-md rounded-md flex items-center gap-1.5 text-white font-medium select-none z-10 ${
          isCompact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
        }`}
      >
        {isMuted && <MicOff className="w-3 h-3 text-zoom-danger shrink-0" />}
        <span className="truncate max-w-[120px] sm:max-w-[180px]">
          {participant.display_name}
          {isSelf ? " (Me)" : ""}
          {participant.role === "host" ? " (Host)" : ""}
        </span>
      </div>
    </div>
  );
};

