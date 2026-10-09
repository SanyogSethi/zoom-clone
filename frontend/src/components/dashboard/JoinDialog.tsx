"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { extractCodeFromInput } from "@/lib/format";

export interface JoinDialogProps {
  isOpen: boolean;
  initialCode?: string;
  onClose: () => void;
  onJoin: (code: string, displayName: string) => Promise<void>;
}

export const JoinDialog: React.FC<JoinDialogProps> = ({
  isOpen,
  initialCode = "",
  onClose,
  onJoin,
}) => {
  const [meetingInput, setMeetingInput] = useState<string>(initialCode);
  const [displayName, setDisplayName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("zoom_user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.display_name) return user.display_name;
        } catch {}
      }
      const savedName = localStorage.getItem("zoom_display_name");
      if (savedName) return savedName;
    }
    return "Guest User";
  });
  const [dontConnectAudio, setDontConnectAudio] = useState<boolean>(false);
  const [turnOffVideo, setTurnOffVideo] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialCode) {
      setMeetingInput(initialCode);
    }
  }, [initialCode]);

  const rawCode = extractCodeFromInput(meetingInput);
  const isValid = rawCode.length >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      const name = displayName.trim() || "Guest User";
      if (typeof window !== "undefined") {
        localStorage.setItem("zoom_display_name", name);
      }
      await onJoin(rawCode, name);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to join meeting. Please check the Meeting ID.");
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join meeting" maxWidth="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 select-none pt-2">
        {/* Meeting ID or Link Input */}
        <Input
          label="Meeting ID or personal link name"
          placeholder="Enter 10-digit Meeting ID or paste link"
          value={meetingInput}
          onChange={(e) => {
            setMeetingInput(e.target.value);
            setErrorMessage(null);
          }}
          autoFocus
        />

        {/* Display Name Input */}
        <Input
          label="Your name"
          placeholder="Your display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        {/* Checkboxes matching Zoom UI */}
        <div className="flex flex-col gap-2.5 pt-1">
          <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontConnectAudio}
              onChange={(e) => setDontConnectAudio(e.target.checked)}
              className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-zoom-blue focus:ring-zoom-blue"
            />
            <span>Don't connect to audio</span>
          </label>
          <label className="flex items-center gap-2.5 text-xs text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={turnOffVideo}
              onChange={(e) => setTurnOffVideo(e.target.checked)}
              className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-zoom-blue focus:ring-zoom-blue"
            />
            <span>Turn off my video</span>
          </label>
        </div>

        {/* Inline Error Message */}
        {errorMessage && (
          <div className="p-3 bg-red-950/80 border border-red-800 rounded-btn text-xs text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zoom-dark-border">
          <Button type="button" variant="dark" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!isValid || loading}
            isLoading={loading}
          >
            Join
          </Button>
        </div>
      </form>
    </Modal>
  );
};
