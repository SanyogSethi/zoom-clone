"use client";

import React, { useEffect, useState } from "react";
import {
  Video,
  Plus,
  Calendar,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  ListFilter,
  MoreHorizontal,
  CalendarPlus,
  RefreshCw,
  Clock,
  Loader2,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatMeetingCode, formatTime, formatDate, formatTimeRange } from "@/lib/format";
import { UpcomingMeeting, RecentMeeting } from "@/lib/types";
import { JoinDialog } from "@/components/dashboard/JoinDialog";
import { ScheduleModal } from "@/components/dashboard/ScheduleModal";
import { Toast } from "@/components/ui/Toast";
import { useMeetings } from "@/hooks/useMeetings";

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
    <div className="flex-1 bg-[#141416] text-white overflow-y-auto flex items-center justify-center p-6 md:p-12 select-none">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-12 lg:gap-16 items-start justify-center">
        {/* Left Side: 4 Action Tiles */}
        <div className="w-full lg:w-auto flex flex-col items-center lg:items-start gap-8 pt-4">
          <div className="grid grid-cols-2 gap-8 sm:gap-10">
            {/* 1. New Meeting (Orange Squircle) */}
            <div className="flex flex-col items-center gap-2 group">
              <button
                onClick={handleInstantMeeting}
                disabled={actionLoading}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] bg-zoom-orange hover:bg-zoom-orange-hover active:bg-orange-700 flex items-center justify-center text-white shadow-xl transition-all duration-150 group-hover:-translate-y-1 disabled:opacity-50"
                title="Start an instant meeting"
              >
                {actionLoading ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : (
                  <Video className="w-12 h-12 stroke-[2.2]" />
                )}
              </button>
              <div className="flex items-center gap-1 text-sm font-medium text-gray-300 group-hover:text-white transition-colors cursor-pointer">
                <span>New meeting</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>

            {/* 2. Join (Blue Squircle) */}
            <div className="flex flex-col items-center gap-2 group">
              <button
                onClick={() => setIsJoinOpen(true)}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] bg-zoom-blue hover:bg-zoom-blue-hover active:bg-zoom-blue-active flex items-center justify-center text-white shadow-xl transition-all duration-150 group-hover:-translate-y-1"
                title="Join a meeting by ID or link"
              >
                <Plus className="w-12 h-12 stroke-[2.8]" />
              </button>
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors cursor-pointer">
                Join
              </span>
            </div>

            {/* 3. Schedule (Blue Squircle) */}
            <div className="flex flex-col items-center gap-2 group">
              <button
                onClick={() => setIsScheduleOpen(true)}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] bg-zoom-blue hover:bg-zoom-blue-hover active:bg-zoom-blue-active flex items-center justify-center text-white shadow-xl transition-all duration-150 group-hover:-translate-y-1 relative"
                title="Schedule a future meeting"
              >
                <div className="flex flex-col items-center justify-center">
                  <Calendar className="w-12 h-12 stroke-[2]" />
                  <span className="absolute top-[48%] text-[11px] font-bold text-white">19</span>
                </div>
              </button>
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors cursor-pointer">
                Schedule
              </span>
            </div>

            {/* 4. Share Screen (Blue Squircle) */}
            <div className="flex flex-col items-center gap-2 group">
              <button
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] bg-zoom-blue hover:bg-zoom-blue-hover active:bg-zoom-blue-active flex items-center justify-center text-white shadow-xl transition-all duration-150 group-hover:-translate-y-1"
                title="Share screen placeholder"
              >
                <ArrowUp className="w-12 h-12 stroke-[2.5]" />
              </button>
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors cursor-pointer">
                Share screen
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Official Zoom Home Widget Card */}
        <div className="w-full lg:w-[420px] bg-[#18181A] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* 1. Top Clock Banner Header */}
          <div className="relative bg-gradient-to-r from-[#243545] via-[#2A3F53] to-[#1E2B38] px-6 py-6 flex items-center justify-between border-b border-neutral-800">
            {/* Potted Plant Graphic Vector */}
            <div className="flex items-center gap-4">
              <svg className="w-12 h-14" viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 40C16 40 10 28 8 20C6 12 14 6 22 14C30 22 24 32 16 40Z" fill="#2EB67D" />
                <path d="M24 40C24 40 32 26 36 18C40 10 32 4 24 12C16 20 20 30 24 40Z" fill="#10B981" />
                <path d="M20 40C20 40 16 20 20 10C24 0 28 10 24 24C20 38 20 40 20 40Z" fill="#059669" />
                <rect x="12" y="38" width="16" height="16" rx="3" fill="#D1D5DB" />
              </svg>

              <div className="flex flex-col">
                <span className="text-4xl font-black text-white tracking-tight leading-none">
                  {timeStr || "10:23 PM"}
                </span>
                <span className="text-sm font-medium text-gray-200 mt-1.5">
                  {dateStr || "Thursday, October 8"}
                </span>
              </div>
            </div>

            {/* Top Right Widget Actions */}
            <div className="flex items-center gap-2 self-start text-gray-300">
              <button title="Calendar Plus" className="hover:text-white p-1 transition-colors">
                <CalendarPlus className="w-4 h-4" />
              </button>
              <button title="Options" className="hover:text-white p-1 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Calendar Banner Prompt */}
          <div className="bg-[#FFF9EE] border-b border-[#E6DEC8] px-5 py-3 text-xs text-[#232333] font-medium leading-relaxed">
            Respond to events, see other's availability and more by{" "}
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="text-zoom-blue font-semibold hover:underline"
            >
              connecting your calendar
            </button>
          </div>

          {/* 3. Filter Controls Subheader */}
          <div className="bg-[#18181A] px-4 py-2.5 border-b border-neutral-800 flex items-center justify-between text-xs text-gray-300 font-medium">
            <button className="flex items-center gap-1 hover:text-white transition-colors">
              <span className="font-bold text-white">Today</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-3 text-gray-400">
              <div className="flex items-center gap-1">
                <button className="hover:text-white p-0.5"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <button className="hover:text-white p-0.5"><Calendar className="w-3.5 h-3.5" /></button>
                <button className="hover:text-white p-0.5"><ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
              <span className="text-neutral-700">|</span>
              <div className="flex items-center gap-2">
                <button className="hover:text-white p-0.5"><UserCheck className="w-3.5 h-3.5" /></button>
                <button className="hover:text-white p-0.5"><ListFilter className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>

          {/* 4. Meetings Content Section */}
          <div className="flex-1 bg-[#141416] p-5 flex flex-col gap-5 min-h-[260px]">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-zoom-blue" />
                <span>Syncing schedule...</span>
              </div>
            ) : error ? (
              <div className="py-8 text-center text-zoom-danger text-xs">{error}</div>
            ) : upcoming.length === 0 && recent.length === 0 ? (
              /* Beach Umbrella Empty State Illustration */
              <div className="py-8 flex flex-col items-center justify-center text-center gap-4">
                <svg className="w-24 h-20" viewBox="0 0 96 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M48 10L16 40H80L48 10Z" fill="#C7D2FE" />
                  <path d="M48 10L32 40H64L48 10Z" fill="#818CF8" />
                  <path d="M48 40V70" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
                  <ellipse cx="48" cy="70" rx="20" ry="6" fill="#374151" />
                </svg>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-gray-200">No meetings scheduled.</span>
                  <span className="text-xs text-gray-400">Enjoy your day!</span>
                </div>
                <button
                  onClick={() => setIsScheduleOpen(true)}
                  className="flex items-center gap-1.5 text-xs text-zoom-blue font-semibold hover:underline mt-1"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>Schedule a Meeting</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Upcoming Meetings Listing */}
                {upcoming.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <span>Upcoming ({upcoming.length})</span>
                      <button onClick={fetchMeetings} className="hover:text-white">
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                    {upcoming.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
                      >
                        <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                          <span className="font-bold text-white text-xs truncate">{m.title}</span>
                          <span className="text-[11px] text-gray-400">
                            {formatMeetingCode(m.meeting_code)} • {formatTimeRange(m.scheduled_start, m.duration_minutes)}
                          </span>
                        </div>
                        <button
                          onClick={() => joinMeeting(m.meeting_code)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-zoom-blue hover:bg-zoom-blue-hover text-white text-xs font-bold rounded-btn transition-colors shrink-0"
                        >
                          Start
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent Meetings Listing */}
                {recent.length > 0 && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <span>Recent History</span>
                      <Clock className="w-3 h-3" />
                    </div>
                    {recent.map((r) => (
                      <div
                        key={r.session_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
                      >
                        <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs truncate">{r.title}</span>
                            {r.can_rejoin && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-950 text-zoom-live text-[10px] font-semibold border border-emerald-800 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-zoom-live animate-pulse" />
                                Live
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400">
                            ID: {formatMeetingCode(r.meeting_code)}
                          </span>
                        </div>
                        {r.can_rejoin ? (
                          <button
                            onClick={() => handleRejoin(r.meeting_code)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-zoom-blue hover:bg-zoom-blue-hover text-white text-xs font-bold rounded-btn transition-colors shrink-0"
                          >
                            Rejoin
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-500 font-medium px-2">Ended</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5. Card Footer */}
          <div className="bg-[#18181A] px-5 py-3 border-t border-neutral-800 flex items-center justify-between text-xs text-gray-400 font-medium hover:text-white cursor-pointer transition-colors">
            <span>Open Recordings</span>
            <ChevronRightIcon className="w-4 h-4" />
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
