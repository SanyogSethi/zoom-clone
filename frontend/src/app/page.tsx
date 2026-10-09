"use client";

import React, { useEffect, useState, useRef } from "react";
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
  Settings,
  MessageSquare,
  Sparkles,
  Info,
  X,
  FileText,
  Copy,
  Link as LinkIcon,
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
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [isJoinOpen, setIsJoinOpen] = useState<boolean>(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState<boolean>(false);
  const [isPromptDismissed, setIsPromptDismissed] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [activeMenuMeetingId, setActiveMenuMeetingId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuMeetingId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      setNowMs(now.getTime());
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
          day: "numeric",
          month: "long",
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const getMeetingTimingStatus = (scheduledStartStr: string, currentMs: number) => {
    const startDateObj = new Date(scheduledStartStr);
    const startMs = startDateObj.getTime();
    const diffMs = startMs - currentMs;

    if (diffMs <= 0) {
      return {
        statusText: "Now",
        isHighlight: true,
        showStartButton: true,
      };
    }

    const diffMins = Math.ceil(diffMs / 60000);

    if (diffMins <= 15) {
      return {
        statusText: `In ${diffMins} min`,
        isHighlight: true,
        showStartButton: true,
      };
    }

    // Determine calendar day relative to currentMs
    const currentDateObj = new Date(currentMs);

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    const tomorrowDateObj = new Date(currentDateObj);
    tomorrowDateObj.setDate(currentDateObj.getDate() + 1);

    let label = "Today";
    if (isSameDay(startDateObj, currentDateObj)) {
      label = "Today";
    } else if (isSameDay(startDateObj, tomorrowDateObj)) {
      label = "Tomorrow";
    } else {
      label = startDateObj.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }

    return {
      statusText: label,
      isHighlight: false,
      showStartButton: false,
    };
  };

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

  const handleCopyMeetingIdCard = (meetingCode: string) => {
    setActiveMenuMeetingId(null);
    const formatted = formatMeetingCode(meetingCode);
    navigator.clipboard.writeText(formatted).then(
      () => setToastMessage({ msg: "Meeting ID copied to clipboard!", type: "success" }),
      () => setToastMessage({ msg: "Failed to copy meeting ID.", type: "error" })
    );
  };

  const handleCopyInviteLinkCard = (meetingCode: string) => {
    setActiveMenuMeetingId(null);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const inviteUrl = `${origin}/j/${meetingCode}`;
    navigator.clipboard.writeText(inviteUrl).then(
      () => setToastMessage({ msg: "Invite link copied to clipboard!", type: "success" }),
      () => setToastMessage({ msg: "Failed to copy invite link.", type: "error" })
    );
  };

  return (
    <div className="flex-1 bg-[#141416] text-white overflow-hidden flex flex-col items-center justify-start p-4 sm:p-6 select-none relative min-h-0">
      {/* Top Right Edit / Sparkle Action Icon */}
      <button
        title="Customise layout"
        className="absolute top-4 right-5 text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-[#242427] z-10"
      >
        <Sparkles className="w-4 h-4 stroke-[1.8]" />
      </button>

      {/* Main Single Centered Column */}
      <div className="w-full max-w-xl flex-1 flex flex-col items-center gap-4 min-h-0 overflow-hidden py-2">
        {/* 1. Clock & Date Header (Top Center) */}
        <div className="flex flex-col items-center text-center mt-1 shrink-0">
          <span className="text-4xl sm:text-[44px] font-bold text-white tracking-tight leading-none">
            {timeStr || "1:26 AM"}
          </span>
          <span className="text-xs sm:text-sm font-medium text-gray-300 mt-2">
            {dateStr || "Friday, 9 October"}
          </span>
        </div>

        {/* 2. Horizontal Row of 5 Squircle Action Buttons */}
        <div className="flex items-center justify-center gap-3 sm:gap-7 md:gap-10 my-3 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Button 1: New Meeting (Orange) */}
          <div className="flex flex-col items-center group cursor-pointer">
            <button
              onClick={handleInstantMeeting}
              disabled={actionLoading}
              className="w-[52px] h-[52px] rounded-[17px] bg-[#FF742E] hover:bg-[#E06324] active:bg-orange-700 flex items-center justify-center text-white shadow-md transition-all group-hover:-translate-y-0.5 disabled:opacity-50"
              title="Start an instant meeting"
            >
              {actionLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : (
                <svg className="w-6 h-6 fill-white text-white" viewBox="0 0 24 24">
                  <rect x="3" y="6.5" width="11.5" height="11" rx="2.5" />
                  <path d="M15.5 10.3L19.8 7.4C20.4 7 21 7.4 21 8.1v7.8c0 0.7-0.6 1.1-1.2 0.7l-4.3-2.9v-3.4z" />
                </svg>
              )}
            </button>
            <div className="flex items-center gap-0.5 text-[12px] font-medium text-gray-300 group-hover:text-white transition-colors mt-2">
              <span>New meeting</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>
          </div>

          {/* Button 2: Join (Blue) */}
          <div className="flex flex-col items-center group cursor-pointer">
            <button
              onClick={() => setIsJoinOpen(true)}
              className="w-[52px] h-[52px] rounded-[17px] bg-[#0B5CFF] hover:bg-[#004FE0] active:bg-blue-700 flex items-center justify-center text-white shadow-md transition-all group-hover:-translate-y-0.5"
              title="Join a meeting by ID or link"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" fill="white" />
                <path d="M12 7.5v9M7.5 12h9" stroke="#0B5CFF" strokeWidth="2.6" strokeLinecap="round" />
              </svg>
            </button>
            <span className="text-[12px] font-medium text-gray-300 group-hover:text-white transition-colors mt-2">
              Join
            </span>
          </div>

          {/* Button 3: Schedule (Blue) */}
          <div className="flex flex-col items-center group cursor-pointer">
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="w-[52px] h-[52px] rounded-[17px] bg-[#0B5CFF] hover:bg-[#004FE0] active:bg-blue-700 flex items-center justify-center text-white shadow-md transition-all group-hover:-translate-y-0.5"
              title="Schedule a future meeting"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <rect x="3.5" y="4" width="17" height="16" rx="3.5" fill="white" />
                <rect x="7" y="2.5" width="2" height="3" rx="1" fill="#0B5CFF" />
                <rect x="15" y="2.5" width="2" height="3" rx="1" fill="#0B5CFF" />
                <line x1="3.5" y1="8.5" x2="20.5" y2="8.5" stroke="#0B5CFF" strokeWidth="1.2" />
                <text x="12" y="15.8" textAnchor="middle" fill="#0B5CFF" fontSize="7" fontWeight="800" fontFamily="system-ui, sans-serif">19</text>
              </svg>
            </button>
            <span className="text-[12px] font-medium text-gray-300 group-hover:text-white transition-colors mt-2">
              Schedule
            </span>
          </div>

          {/* Button 4: Share Screen (Blue) */}
          <div className="flex flex-col items-center group cursor-pointer">
            <button
              className="w-[52px] h-[52px] rounded-[17px] bg-[#0B5CFF] hover:bg-[#004FE0] active:bg-blue-700 flex items-center justify-center text-white shadow-md transition-all group-hover:-translate-y-0.5"
              title="Share screen placeholder"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" fill="white" />
                <path d="M12 16.5V7.5M8 11.5L12 7.5L16 11.5" stroke="#0B5CFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="text-[12px] font-medium text-gray-300 group-hover:text-white transition-colors mt-2">
              Share screen
            </span>
          </div>

          {/* Button 5: My Notes (Unusable Placeholder) */}
          <div className="flex flex-col items-center group opacity-90 cursor-not-allowed">
            <button
              disabled
              className="w-[52px] h-[52px] rounded-[17px] bg-[#0B5CFF] flex items-center justify-center text-white shadow-md cursor-not-allowed"
              title="My Notes (Unavailable)"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" fill="white" />
                <path d="M14.5 6.5L17.5 9.5L10 17H7V14L14.5 6.5Z" fill="#0B5CFF" />
                <path d="M8.5 9.5L9 8L9.5 9.5L11 10L9.5 10.5L9 12L8.5 10.5L7 10L8.5 9.5Z" fill="#0B5CFF" />
              </svg>
            </button>
            <span className="text-[12px] font-medium text-gray-400 mt-2">
              My Notes
            </span>
          </div>
        </div>

        {/* 3. Center Home Widget Card */}
        <div className="w-full max-w-[500px] flex-1 min-h-0 bg-[#18181B] border border-neutral-800/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Calendar Prompt Banner */}
          {!isPromptDismissed && (
            <div className="bg-[#1E293B] border-b border-neutral-800 px-4 py-3 text-xs text-gray-200 leading-relaxed flex items-start justify-between gap-3 shrink-0">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#0B5CFF] shrink-0 mt-0.5" />
                <span>
                  You haven't connected your calendar yet.{" "}
                  <span className="text-[#0B5CFF] font-semibold cursor-default">
                    Connect now
                  </span>{" "}
                  to manage all your meetings and events in one place.
                </span>
              </div>
              <button
                onClick={() => setIsPromptDismissed(true)}
                className="text-gray-400 hover:text-white p-0.5"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Date Selector Header Bar */}
          <div className="bg-[#18181B] px-4 py-2 border-b border-neutral-800/80 flex items-center justify-between text-xs font-bold text-white shrink-0">
            <button title="Add" className="text-gray-300 hover:text-white p-1">
              <Plus className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-1 text-white hover:opacity-90 font-bold transition-opacity">
              <span>{dateStr ? `Today, ${dateStr.split(", ").pop()}` : "Today, Oct 9"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-300" />
            </button>
            <div className="w-4" /> {/* Spacer */}
          </div>

          {/* Subheader Filter Bar */}
          <div className="bg-[#18181B] px-4 py-1.5 border-b border-neutral-800/80 flex items-center justify-between text-xs text-gray-300 font-medium shrink-0">
            <div className="flex items-center gap-2">
              <button className="px-2.5 py-1 rounded-md bg-[#242427] text-white text-xs font-medium flex items-center gap-1 hover:bg-neutral-700 transition-colors">
                <Calendar className="w-3.5 h-3.5 text-gray-300" />
                <span>Today</span>
              </button>
              <div className="flex items-center gap-1 text-gray-300">
                <button title="Previous" className="hover:text-white p-0.5"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <button title="Next" className="hover:text-white p-0.5"><ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <button title="More options" className="text-gray-300 hover:text-white p-0.5">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Meetings Listing (Internally Scrollable) */}
          <div className="flex-1 overflow-y-auto bg-[#141416] p-3.5 flex flex-col gap-3 min-h-0 custom-scrollbar">
            {loading ? (
              <div className="py-10 flex flex-col items-center justify-center gap-3 text-gray-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-[#0B5CFF]" />
                <span>Syncing schedule...</span>
              </div>
            ) : error ? (
              <div className="py-8 text-center text-zoom-danger text-xs">{error}</div>
            ) : upcoming.length === 0 && recent.length === 0 ? (
              /* Empty State */
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
                  className="flex items-center gap-1.5 text-xs text-[#0B5CFF] font-semibold hover:underline mt-1"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>Schedule a Meeting</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Upcoming Meetings Listing */}
                {upcoming.map((m) => {
                  const { statusText, isHighlight, showStartButton } = getMeetingTimingStatus(
                    m.scheduled_start,
                    nowMs
                  );
                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl flex flex-col gap-1.5 transition-colors relative ${
                        isHighlight
                          ? "bg-[#203144] border border-[#2B4058]"
                          : "bg-[#242528] hover:bg-[#2A2B2F] border border-neutral-800/40"
                      }`}
                    >
                      {/* Meeting Title & Sub-badge */}
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-white text-xs tracking-tight">
                          {m.title}
                        </span>
                        {isHighlight ? (
                          <span className="text-[#FF5B5B] text-[11px] font-semibold">
                            {statusText}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-[11px] font-medium">
                            {statusText}
                          </span>
                        )}
                      </div>

                      {/* Time Range */}
                      <span className="text-gray-300 text-[11px]">
                        {formatTimeRange(m.scheduled_start, m.duration_minutes)}
                      </span>

                      {/* Host Line */}
                      <span className="text-gray-400 text-[11px]">
                        Host: {m.host_display_name || "SANYOG SETHI"}
                      </span>

                      {/* Action Controls Row */}
                      <div className="flex items-center justify-between pt-1 mt-0.5">
                        {showStartButton ? (
                          <button
                            onClick={() => joinMeeting(m.meeting_code)}
                            disabled={actionLoading}
                            className="px-4 py-1 bg-[#0B5CFF] hover:bg-blue-600 active:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
                          >
                            Start
                          </button>
                        ) : (
                          <div />
                        )}

                        <div className="flex items-center gap-3 text-gray-200 ml-auto">
                          <button title="Chat" className="hover:text-white transition-colors">
                            <MessageSquare className="w-4 h-4 text-gray-200 hover:text-white" />
                          </button>

                          {/* Interactive Three-Dots Menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuMeetingId(activeMenuMeetingId === m.id ? null : m.id);
                              }}
                              title="More options"
                              className="p-1 rounded-md hover:bg-[#333336] text-gray-200 hover:text-white transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {activeMenuMeetingId === m.id && (
                              <div
                                ref={menuRef}
                                className="absolute right-0 bottom-full mb-2 bg-[#1E1E22] border border-neutral-700/90 rounded-xl shadow-2xl py-1.5 px-1 w-48 z-50 text-xs text-white animate-in fade-in zoom-in-95 duration-100"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleCopyMeetingIdCard(m.meeting_code)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-gray-200 hover:bg-[#2A2B30] hover:text-white rounded-lg transition-colors text-left font-medium"
                                >
                                  <span>Copy Meeting ID</span>
                                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyInviteLinkCard(m.meeting_code)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-gray-200 hover:bg-[#2A2B30] hover:text-white rounded-lg transition-colors text-left font-medium"
                                >
                                  <span>Copy Invite Link</span>
                                  <LinkIcon className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Recent/History Section */}
                {recent.length > 0 && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800/80">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-300 uppercase tracking-wider px-1">
                      <span>Recent Sessions</span>
                      <Clock className="w-3 h-3 text-gray-300" />
                    </div>
                    {recent.map((r) => (
                      <div
                        key={r.session_id}
                        className="p-3.5 rounded-xl bg-[#242528] hover:bg-[#2A2B2F] border border-neutral-800/40 flex items-center justify-between transition-colors"
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
                            className="px-3 py-1 bg-[#0B5CFF] hover:bg-blue-600 text-white text-xs font-semibold rounded-md transition-colors shrink-0"
                          >
                            Rejoin
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-medium px-1">Ended</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="bg-[#18181B] px-5 py-2.5 border-t border-neutral-800 flex items-center justify-between text-xs text-gray-400 font-medium hover:text-white cursor-pointer transition-colors shrink-0">
            <span>Open recordings</span>
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
