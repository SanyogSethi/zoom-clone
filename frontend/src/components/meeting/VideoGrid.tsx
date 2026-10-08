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

  if (total === 1) {
    // Single Participant (fills container bounded by height/width aspect ratio)
    return (
      <div className="w-full h-full min-h-0 p-4 flex items-center justify-center overflow-hidden">
        <div className="w-full h-full max-w-5xl max-h-full aspect-video">
          <VideoTile
            participant={allTiles[0].participant}
            isSelf={allTiles[0].isSelf}
            videoRef={allTiles[0].videoRef}
            isVideoOff={allTiles[0].isVideoOff}
            isMuted={allTiles[0].isMuted}
            isActiveSpeaker={true}
          />
        </div>
      </div>
    );
  }

  // Multi-participant Grid
  let gridClass = "grid-cols-1 md:grid-cols-2 grid-rows-1";
  if (total === 3 || total === 4) {
    gridClass = "grid-cols-2 grid-rows-2";
  } else if (total >= 5) {
    gridClass = "grid-cols-2 md:grid-cols-3 grid-rows-2";
  }

  return (
    <div className={`w-full h-full min-h-0 p-4 grid ${gridClass} gap-4 overflow-hidden`}>
      {allTiles.map((tile, index) => (
        <div key={tile.id} className="w-full h-full min-h-0 overflow-hidden flex items-center justify-center">
          <VideoTile
            participant={tile.participant}
            isSelf={tile.isSelf}
            videoRef={tile.videoRef}
            isVideoOff={tile.isVideoOff}
            isMuted={tile.isMuted}
            isActiveSpeaker={index === 0}
          />
        </div>
      ))}
    </div>
  );
};
