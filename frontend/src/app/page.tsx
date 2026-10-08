"use client";

import React, { useEffect, useState } from "react";
import { Video, Plus, Calendar, Share2, Clock, RefreshCw, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { JoinDialog } from "@/components/dashboard/JoinDialog";
import { ScheduleModal } from "@/components/dashboard/ScheduleModal";
import { useMeetings } from "@/hooks/useMeetings";
import { formatMeetingCode, formatTime, formatDate, formatTimeRange } from "@/lib/format";

export default function Dashboard() {
  const [timeStr, setTimeStr] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");
  const [isJoinOpen, setIsJoinOpen] = useState<boolean>(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const {
    upcoming,
    recent,
    loading,
    actionLoading,
    error,
    fetchMeetings,
    createInstantMeeting,
    joinMeeting,
    scheduleMeeting,
    rejoinMeeting,
  } = useMeetings();

  // Live Clock effect
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleInstantMeeting = async () => {
    await createInstantMeeting();
  };

  const handleJoinSubmit = async (code: string, displayName: string) => {
    await joinMeeting(code, displayName);
  };

  const handleRejoin = async (code: string) => {
    try {
      await rejoinMeeting(code);
    } catch (err: any) {
      setToastMessage({
        msg: err.message || "This meeting has ended.",
        type: "error",
      });
    }
  };

  return (
    <div className="flex-1 flex bg-[#1C1C1C] text-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col lg:flex-row gap-8">
        {/* Left Section: Action Tiles & Meetings Cards */}
        <div className="flex-1 flex flex-col gap-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {/* 1. New Meeting (Orange) */}
            <div className="flex flex-col items-center gap-3 group">
              <button
                onClick={handleInstantMeeting}
                disabled={actionLoading}
                className="w-20 h-20 rounded-tile bg-zoom-orange hover:bg-zoom-orange-hover active:bg-orange-700 flex items-center justify-center text-white shadow-lg transition-transform duration-150 group-hover:-translate-y-0.5 disabled:opacity-50"
                title="Start an instant meeting"
              >
                {actionLoading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <Video className="w-9 h-9 stroke-[2]" />
                )}
              </button>
              <span className="text-sm font-semibold text-gray-200">New meeting</span>
            </div>

            {/* 2. Join (Blue) */}
            <div className="flex flex-col items-center gap-3 group">
              <button
                onClick={() => setIsJoinOpen(true)}
                className="w-20 h-20 rounded-tile bg-zoom-blue hover:bg-zoom-blue-hover active:bg-zoom-blue-active flex items-center justify-center text-white shadow-lg transition-transform duration-150 group-hover:-translate-y-0.5"
                title="Join a meeting by ID or link"
              >
                <Plus className="w-10 h-10 stroke-[2.5]" />
              </button>
              <span className="text-sm font-semibold text-gray-200">Join</span>
            </div>

            {/* 3. Schedule (Blue) */}
            <div className="flex flex-col items-center gap-3 group">
              <button
                onClick={() => setIsScheduleOpen(true)}
                className="w-20 h-20 rounded-tile bg-zoom-blue hover:bg-zoom-blue-hover active:bg-zoom-blue-active flex items-center justify-center text-white shadow-lg transition-transform duration-150 group-hover:-translate-y-0.5"
                title="Schedule a future meeting"
              >
                <Calendar className="w-9 h-9 stroke-[2]" />
              </button>
              <span className="text-sm font-semibold text-gray-200">Schedule</span>
            </div>

            {/* 4. Share Screen (Placeholder Blue) */}
            <div className="flex flex-col items-center gap-3 group">
              <button
                className="w-20 h-20 rounded-tile bg-zoom-blue opacity-80 cursor-default flex items-center justify-center text-white shadow-lg"
                title="Share screen placeholder"
              >
                <Share2 className="w-8 h-8 stroke-[2]" />
              </button>
              <span className="text-sm font-semibold text-gray-400">Share screen</span>
            </div>
          </div>

          {/* Upcoming Meetings List Card */}
          <div className="bg-zoom-dark-surface border border-zoom-dark-border rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between pb-4 border-b border-zoom-dark-border mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-zoom-blue" />
                <span>Upcoming Meetings</span>
              </h2>
              <Button variant="ghost" size="sm" onClick={fetchMeetings} className="text-gray-400 hover:text-white">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-gray-400 text-sm">Loading upcoming meetings...</div>
            ) : error ? (
              <div className="py-4 text-center text-zoom-danger text-sm">{error}</div>
            ) : upcoming.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">No upcoming meetings scheduled.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-white text-base">{m.title}</span>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>ID: <strong className="text-gray-200">{formatMeetingCode(m.meeting_code)}</strong></span>
                        <span>•</span>
                        <span>{formatDate(m.scheduled_start)} ({formatTimeRange(m.scheduled_start, m.duration_minutes)})</span>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => joinMeeting(m.meeting_code)}
                      disabled={actionLoading}
                    >
                      Start
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Meetings Card */}
          <div className="bg-zoom-dark-surface border border-zoom-dark-border rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between pb-4 border-b border-zoom-dark-border mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-zoom-blue" />
                <span>Recent Meetings</span>
              </h2>
            </div>

            {loading ? (
              <div className="py-8 text-center text-gray-400 text-sm">Loading recent history...</div>
            ) : recent.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">No recent meeting history.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {recent.map((r) => (
                  <div
                    key={r.session_id}
                    className="flex items-center justify-between p-4 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-base">{r.title}</span>
                        {r.can_rejoin && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950 text-zoom-live text-xs font-semibold border border-emerald-800">
                            <span className="w-2 h-2 rounded-full bg-zoom-live animate-pulse" />
                            Live
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>ID: <strong className="text-gray-200">{formatMeetingCode(r.meeting_code)}</strong></span>
                        <span>•</span>
                        <span>Host: {r.host_display_name}</span>
                        {r.left_at && (
                          <>
                            <span>•</span>
                            <span>Left at {formatTime(r.left_at)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {r.can_rejoin ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleRejoin(r.meeting_code)}
                        disabled={actionLoading}
                        className="bg-zoom-blue"
                      >
                        Rejoin
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-500 font-medium">Ended</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Clock & Date Card */}
        <div className="w-full lg:w-80 flex flex-col gap-6 select-none">
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-zoom-dark-border rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-md">
            <span className="text-5xl font-black text-white tracking-tight mb-2">
              {timeStr || "8:15 PM"}
            </span>
            <span className="text-sm font-semibold text-gray-300">
              {dateStr || "Thursday, October 8"}
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <JoinDialog
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoin={handleJoinSubmit}
      />

      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSchedule={scheduleMeeting}
        onSuccessToast={(msg) => setToastMessage({ msg, type: "success" })}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage.msg}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
