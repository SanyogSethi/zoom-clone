"use client";

import React, { useState } from "react";
import { VideoTile } from "./VideoTile";
import { Participant } from "@/lib/types";
import { Grid, LayoutList } from "lucide-react";

export interface VideoGridProps {
  selfParticipant: { display_name: string; role: "host" | "participant" };
  videoRef: React.RefObject<HTMLVideoElement>;
  selfStream?: MediaStream | null;
  isVideoOff: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  remoteParticipants: Participant[];
  remoteStreams?: Record<string, MediaStream>;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  selfParticipant,
  videoRef,
  selfStream,
  isVideoOff,
  isMuted,
  isSpeaking,
  remoteParticipants,
  remoteStreams = {},
}) => {
  const [pinnedTileId, setPinnedTileId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "filmstrip">("grid");

  const allTiles = [
    {
      id: "self",
      isSelf: true,
      participant: selfParticipant,
      videoRef,
      selfStream,
      remoteStream: undefined,
      isVideoOff,
      isMuted,
      isSpeaking,
    },
    ...remoteParticipants.map((p) => ({
      id: `remote_${p.id}`,
      isSelf: false,
      participant: {
        display_name: p.display_name,
        role: p.role,
      },
      videoRef: undefined,
      selfStream: undefined,
      remoteStream: remoteStreams[String(p.id)] || remoteStreams[`remote_${p.id}`],
      isVideoOff: false,
      isMuted: Boolean(p.is_muted),
      isSpeaking: false,
    })),
  ];

  const total = allTiles.length;
  const activePinnedTile = allTiles.find((t) => t.id === pinnedTileId);

  const togglePin = (tileId: string) => {
    if (pinnedTileId === tileId) {
      setPinnedTileId(null);
    } else {
      setPinnedTileId(tileId);
    }
  };

  // If a tile is pinned OR if filmstrip mode is active
  if (pinnedTileId || viewMode === "filmstrip") {
    const featuredTile = activePinnedTile || allTiles[0];
    const filmstripTiles = allTiles.filter((t) => t.id !== featuredTile.id);

    return (
      <div className="w-full h-full min-h-0 flex flex-col p-3 gap-3 overflow-hidden relative select-none">
        {/* Top Control Bar: View Switcher */}
        <div className="absolute top-4 right-5 z-30 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-lg border border-neutral-800">
          <button
            type="button"
            onClick={() => {
              setPinnedTileId(null);
              setViewMode("grid");
            }}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === "grid" && !pinnedTileId
                ? "bg-[#0B5CFF] text-white"
                : "text-gray-300 hover:text-white hover:bg-neutral-800"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Grid View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("filmstrip")}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === "filmstrip" || pinnedTileId
                ? "bg-[#0B5CFF] text-white"
                : "text-gray-300 hover:text-white hover:bg-neutral-800"
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Speaker View</span>
          </button>
        </div>

        {/* Top Scrollable Filmstrip (Other Participants) */}
        {filmstripTiles.length > 0 && (
          <div className="w-full flex items-center justify-center gap-3 overflow-x-auto p-1 shrink-0 custom-scrollbar max-h-32">
            {filmstripTiles.map((tile) => (
              <div key={tile.id} className="w-40 h-24 shrink-0 rounded-xl overflow-hidden shadow-md">
                <VideoTile
                  participant={tile.participant}
                  isSelf={tile.isSelf}
                  videoRef={tile.videoRef}
                  selfStream={tile.selfStream}
                  remoteStream={tile.remoteStream}
                  isVideoOff={tile.isVideoOff}
                  isMuted={tile.isMuted}
                  isActiveSpeaker={tile.isSpeaking}
                  isPinned={pinnedTileId === tile.id}
                  onPin={() => togglePin(tile.id)}
                  isCompact
                />
              </div>
            ))}
          </div>
        )}

        {/* Main Stage (Featured / Pinned Participant) */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden p-1">
          <div className="w-full h-full max-w-5xl max-h-full aspect-video relative">
            <VideoTile
              participant={featuredTile.participant}
              isSelf={featuredTile.isSelf}
              videoRef={featuredTile.videoRef}
              selfStream={featuredTile.selfStream}
              remoteStream={featuredTile.remoteStream}
              isVideoOff={featuredTile.isVideoOff}
              isMuted={featuredTile.isMuted}
              isActiveSpeaker={featuredTile.isSpeaking}
              isPinned={pinnedTileId === featuredTile.id}
              onPin={() => togglePin(featuredTile.id)}
            />
          </div>
        </div>
      </div>
    );
  }

  // Gallery Grid Layout (Single, 2x2, or 3x3)
  if (total === 1) {
    return (
      <div className="w-full h-full min-h-0 p-4 flex items-center justify-center overflow-hidden relative">
        <div className="w-full h-full max-w-5xl max-h-full aspect-video">
          <VideoTile
            participant={allTiles[0].participant}
            isSelf={allTiles[0].isSelf}
            videoRef={allTiles[0].videoRef}
            selfStream={allTiles[0].selfStream}
            remoteStream={allTiles[0].remoteStream}
            isVideoOff={allTiles[0].isVideoOff}
            isMuted={allTiles[0].isMuted}
            isActiveSpeaker={allTiles[0].isSpeaking}
            isPinned={pinnedTileId === allTiles[0].id}
            onPin={() => togglePin(allTiles[0].id)}
          />
        </div>
      </div>
    );
  }

  let gridClass = "grid-cols-1 md:grid-cols-2 grid-rows-1";
  if (total === 2) {
    gridClass = "grid-cols-1 sm:grid-cols-2 grid-rows-1";
  } else if (total === 3 || total === 4) {
    gridClass = "grid-cols-2 grid-rows-2";
  } else if (total >= 5 && total <= 9) {
    gridClass = "grid-cols-2 md:grid-cols-3 grid-rows-2 md:grid-rows-3";
  } else {
    gridClass = "grid-cols-3 md:grid-cols-4 grid-rows-3";
  }

  return (
    <div className="w-full h-full min-h-0 p-4 relative overflow-hidden flex flex-col">
      {/* Top View Mode Switcher */}
      <div className="absolute top-4 right-5 z-30 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-lg border border-neutral-800">
        <button
          type="button"
          onClick={() => {
            setPinnedTileId(null);
            setViewMode("grid");
          }}
          className="px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 bg-[#0B5CFF] text-white shadow"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Grid View</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode("filmstrip")}
          className="px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 text-gray-300 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <LayoutList className="w-3.5 h-3.5" />
          <span>Speaker View</span>
        </button>
      </div>

      {/* Grid Container */}
      <div className={`w-full h-full min-h-0 grid ${gridClass} gap-4 overflow-hidden py-6`}>
        {allTiles.map((tile) => (
          <div key={tile.id} className="w-full h-full min-h-0 overflow-hidden flex items-center justify-center">
            <VideoTile
              participant={tile.participant}
              isSelf={tile.isSelf}
              videoRef={tile.videoRef}
              selfStream={tile.selfStream}
              remoteStream={tile.remoteStream}
              isVideoOff={tile.isVideoOff}
              isMuted={tile.isMuted}
              isActiveSpeaker={tile.isSpeaking}
              isPinned={pinnedTileId === tile.id}
              onPin={() => togglePin(tile.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

