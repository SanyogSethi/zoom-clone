"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Meeting } from "@/lib/types";
import { formatMeetingCode } from "@/lib/format";
import { Copy, Check } from "lucide-react";

export interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (data: {
    title: string;
    description?: string;
    scheduled_start: string;
    duration_minutes: number;
  }) => Promise<Meeting>;
  onSuccessToast?: (msg: string) => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
  onSuccessToast,
}) => {
  const [topic, setTopic] = useState<string>("Sanyog Sethi's Zoom Meeting");
  const [description, setDescription] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState<string>("20:30");
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const [createdMeeting, setCreatedMeeting] = useState<Meeting | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      const scheduledStartIso = new Date(`${startDate}T${startTime}:00`).toISOString();
      const meeting = await onSchedule({
        title: topic.trim(),
        description: description.trim() || undefined,
        scheduled_start: scheduledStartIso,
        duration_minutes: Number(durationMinutes),
      });
      setCreatedMeeting(meeting);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to schedule meeting.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdMeeting) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const inviteUrl = `${origin}/j/${createdMeeting.meeting_code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    if (onSuccessToast) onSuccessToast("Invite link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setCreatedMeeting(null);
    setCopied(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdMeeting ? "Meeting Scheduled!" : "Schedule Meeting"}
      maxWidth="lg"
    >
      {createdMeeting ? (
        <div className="flex flex-col gap-6 py-2 select-none">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col gap-3">
            <h3 className="font-bold text-lg text-white">{createdMeeting.title}</h3>
            <div className="flex flex-col gap-1 text-xs text-gray-300">
              <span>
                Meeting ID:{" "}
                <strong className="text-zoom-blue font-bold">
                  {formatMeetingCode(createdMeeting.meeting_code)}
                </strong>
              </span>
              <span>
                Invite Link:{" "}
                <span className="text-gray-400">
                  {typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/j/
                  {createdMeeting.meeting_code}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-zoom-live" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied!" : "Copy invitation link"}</span>
            </Button>
            <Button type="button" variant="primary" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 select-none pt-1">
          {/* Topic */}
          <Input
            label="Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />

          {/* Description */}
          <Input
            label="Description (optional)"
            placeholder="Agenda or notes"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Date & Time Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              type="date"
              label="Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              type="time"
              label="Start Time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300">Duration</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-900 border border-zoom-dark-border rounded-btn text-sm text-white focus:outline-none focus:border-zoom-blue"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
              </select>
            </div>
          </div>

          {/* Inline Error */}
          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-800 rounded-btn text-xs text-red-300">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zoom-dark-border">
            <Button type="button" variant="dark" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!topic.trim() || loading}
              isLoading={loading}
            >
              Save
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
