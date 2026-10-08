"use client";

import React from "react";
import { VideoTile } from "./VideoTile";
import { Participant } from "@/lib/types";

export interface VideoGridProps {
  selfParticipant: { display_name: string; role: "host" | "participant" };
  videoRef: React.RefObject<HTMLVideoElement>;
  isVideoOff: boolean;
  isMuted: boolean;
  remoteParticipants: Participant[];
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  selfParticipant,
  videoRef,
  isVideoOff,
  isMuted,
  remoteParticipants,
}) => {
  const allTiles = [
    {
      id: "self",
      isSelf: true,
      participant: selfParticipant,
      videoRef,
      isVideoOff,
      isMuted,
    },
    ...remoteParticipants.map((p) => ({
      id: `remote_${p.id}`,
      isSelf: false,
      participant: p,
      videoRef: undefined,
      isVideoOff: true,
      isMuted: Boolean(p.is_muted),
    })),
  ];

  const total = allTiles.length;

  // Grid layout class determination
  let gridClass = "grid-cols-1 grid-rows-1";
  if (total === 2) {
    gridClass = "grid-cols-1 md:grid-cols-2 grid-rows-1";
  } else if (total === 3 || total === 4) {
    gridClass = "grid-cols-2 grid-rows-2";
  } else if (total >= 5) {
    gridClass = "grid-cols-2 md:grid-cols-3 grid-rows-2";
  }

  return (
    <div className={`w-full h-full p-4 grid ${gridClass} gap-4 max-h-full overflow-hidden`}>
      {allTiles.map((tile, index) => (
        <VideoTile
          key={tile.id}
          participant={tile.participant}
          isSelf={tile.isSelf}
          videoRef={tile.videoRef}
          isVideoOff={tile.isVideoOff}
          isMuted={tile.isMuted}
          isActiveSpeaker={index === 0} // First tile highlighted as active speaker
        />
      ))}
    </div>
  );
};
