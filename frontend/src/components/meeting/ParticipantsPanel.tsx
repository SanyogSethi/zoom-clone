"use client";

import React from "react";
import { X, Mic, MicOff, Video, VideoOff, UserX } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Participant } from "@/lib/types";

export interface ParticipantsPanelProps {
  isOpen: boolean;
  participants: Participant[];
  currentUserId: number;
  isHost: boolean;
  onClose: () => void;
  onMuteAll?: () => void;
  onMuteParticipant?: (participantId: number) => void;
  onRemoveParticipant?: (participantId: number) => void;
}

export const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  isOpen,
  participants,
  currentUserId,
  isHost,
  onClose,
  onMuteAll,
  onMuteParticipant,
  onRemoveParticipant,
}) => {
  if (!isOpen) return null;

  const active = participants.filter((p) => p.status === "joined");

  return (
    <aside className="w-80 bg-[#1F1F1F] border-l border-neutral-800 flex flex-col h-full animate-slide-in-right select-none z-30">
      {/* Drawer Header */}
      <div className="h-14 px-4 border-b border-neutral-800 flex items-center justify-between">
        <h3 className="font-bold text-sm text-white">
          Participants ({active.length})
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-neutral-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
        {active.map((p) => {
          const isMe = p.user_id === currentUserId;
          const isParticipantHost = p.role === "host";

          return (
            <div
              key={p.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-800/60 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={p.display_name} size="sm" />
                <div className="flex flex-col truncate">
                  <span className="text-xs font-semibold text-white truncate">
                    {p.display_name}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    {isParticipantHost && <span className="text-zoom-blue font-bold">(Host)</span>}
                    {isMe && <span>(Me)</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Status Icons */}
                {p.is_muted ? (
                  <MicOff className="w-4 h-4 text-zoom-danger" />
                ) : (
                  <Mic className="w-4 h-4 text-gray-400" />
                )}

                {/* Host Moderation Controls */}
                {isHost && !isParticipantHost && (
                  <div className="hidden group-hover:flex items-center gap-1">
                    {!p.is_muted && onMuteParticipant && (
                      <button
                        onClick={() => onMuteParticipant(p.id)}
                        title="Mute participant"
                        className="p-1 rounded text-gray-400 hover:text-zoom-danger hover:bg-neutral-700"
                      >
                        <MicOff className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onRemoveParticipant && (
                      <button
                        onClick={() => onRemoveParticipant(p.id)}
                        title="Remove participant"
                        className="p-1 rounded text-gray-400 hover:text-zoom-danger hover:bg-neutral-700"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Host Mute All Footer */}
      {isHost && onMuteAll && (
        <div className="p-3 border-t border-neutral-800 bg-[#1A1A1A]">
          <Button
            variant="dark"
            size="sm"
            onClick={onMuteAll}
            className="w-full text-xs font-semibold hover:bg-neutral-800 text-gray-300 hover:text-white"
          >
            Mute All
          </Button>
        </div>
      )}
    </aside>
  );
};
