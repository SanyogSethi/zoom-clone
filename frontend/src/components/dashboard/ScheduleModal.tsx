"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Meeting } from "@/lib/types";
import { formatMeetingCode } from "@/lib/format";
import { Copy, Check, Info, X, ChevronDown, AlertCircle } from "lucide-react";

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

// Generate 15-minute time slots (96 slots)
const TIME_SLOTS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    const hh = h < 10 ? `0${h}` : `${h}`;
    const mm = m < 10 ? `0${m}` : `${m}`;
    TIME_SLOTS.push(`${hh}:${mm}`);
  }
}

// Calculate the next 15-minute time slot after current time
export function getDefaultStartSlot(nowDate: Date = new Date()) {
  const currentMinutes = nowDate.getMinutes();
  const minutesToAdd = 15 - (currentMinutes % 15);
  const targetDate = new Date(nowDate.getTime() + minutesToAdd * 60 * 1000);

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const day = String(targetDate.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  const hours = String(targetDate.getHours()).padStart(2, "0");
  const mins = String(targetDate.getMinutes()).padStart(2, "0");
  const timeStr = `${hours}:${mins}`;

  return { dateStr, timeStr };
}

// Month names array
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
  onSuccessToast,
}) => {
  const [topic, setTopic] = useState<string>("SANYOG SETHI's Zoom Meeting");
  const [description, setDescription] = useState<string>("");
  const [showAgendaInput, setShowAgendaInput] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);

  const defaultSlot = getDefaultStartSlot();
  const [startDate, setStartDate] = useState<string>(defaultSlot.dateStr);
  const [startTime, setStartTime] = useState<string>(defaultSlot.timeStr);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const [createdMeeting, setCreatedMeeting] = useState<Meeting | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Past time warning & error dialog state
  const [hasPastTimeError, setHasPastTimeError] = useState<boolean>(false);
  const [showPastTimeDialog, setShowPastTimeDialog] = useState<boolean>(false);

  // Popups toggle state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [isStartTimeOpen, setIsStartTimeOpen] = useState<boolean>(false);
  const [isEndTimeOpen, setIsEndTimeOpen] = useState<boolean>(false);

  // Calendar month view state
  const [viewYear, setViewYear] = useState<number>(new Date(defaultSlot.dateStr).getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(new Date(defaultSlot.dateStr).getMonth());

  const dateTimeContainerRef = useRef<HTMLDivElement>(null);

  // Reset/re-calculate default date and time whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const slot = getDefaultStartSlot();
      setStartDate(slot.dateStr);
      setStartTime(slot.timeStr);
      const dateObj = new Date(slot.dateStr);
      setViewYear(dateObj.getFullYear());
      setViewMonth(dateObj.getMonth());
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dateTimeContainerRef.current &&
        !dateTimeContainerRef.current.contains(e.target as Node)
      ) {
        setIsDatePickerOpen(false);
        setIsStartTimeOpen(false);
        setIsEndTimeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateFutureTime = (dateVal: string, timeVal: string): boolean => {
    const startMs = new Date(`${dateVal}T${timeVal}:00`).getTime();
    if (startMs <= Date.now()) {
      setHasPastTimeError(true);
      setShowPastTimeDialog(true);
      return false;
    }
    setHasPastTimeError(false);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    if (!validateFutureTime(startDate, startTime)) {
      return;
    }

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
    setShowAgendaInput(false);
    setIsDatePickerOpen(false);
    setIsStartTimeOpen(false);
    setIsEndTimeOpen(false);
    setHasPastTimeError(false);
    setShowPastTimeDialog(false);
    onClose();
  };

  // Format YYYY-MM-DD -> DD/MM/YY for pill display
  const formatPillDate = (isoDateStr: string) => {
    if (!isoDateStr) return "09/10/26";
    const [y, m, d] = isoDateStr.split("-");
    return `${d}/${m}/${y.slice(2)}`;
  };

  // Format 24h string HH:MM -> 12h string (e.g. 2:00 AM)
  const formatPillTime = (time24: string) => {
    if (!time24) return "2:00 AM";
    const [hStr, mStr] = time24.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    const mm = m < 10 ? `0${m}` : `${m}`;
    return `${h12}:${mm} ${period}`;
  };

  // Compute end time string
  const getEndTime24 = () => {
    const [h, m] = startTime.split(":").map(Number);
    const totalMins = h * 60 + m + durationMinutes;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    const endHStr = endH < 10 ? `0${endH}` : `${endH}`;
    const endMStr = endM < 10 ? `0${endM}` : `${endM}`;
    return `${endHStr}:${endMStr}`;
  };

  // Handle month/year changes in calendar
  const changeCalendarMonth = (offset: number) => {
    let newM = viewMonth + offset;
    let newY = viewYear;
    if (newM < 0) {
      newM = 11;
      newY -= 1;
    } else if (newM > 11) {
      newM = 0;
      newY += 1;
    }
    setViewMonth(newM);
    setViewYear(newY);
  };

  const changeCalendarYear = (offset: number) => {
    setViewYear(viewYear + offset);
  };

  // Generate 42 calendar grid cells (6 weeks x 7 days)
  const getCalendarGridDays = () => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: { dayNum: number; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Padding from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = viewMonth === 0 ? 12 : viewMonth;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const mStr = prevM < 10 ? `0${prevM}` : `${prevM}`;
      const dStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
      days.push({ dayNum, isCurrentMonth: false, dateStr: `${prevY}-${mStr}-${dStr}` });
    }

    // Days in current month
    for (let i = 1; i <= daysInMonth; i++) {
      const mStr = viewMonth + 1 < 10 ? `0${viewMonth + 1}` : `${viewMonth + 1}`;
      const dStr = i < 10 ? `0${i}` : `${i}`;
      days.push({ dayNum: i, isCurrentMonth: true, dateStr: `${viewYear}-${mStr}-${dStr}` });
    }

    // Padding for next month
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextM = viewMonth + 2 > 12 ? 1 : viewMonth + 2;
      const nextY = viewMonth + 2 > 12 ? viewYear + 1 : viewYear;
      const mStr = nextM < 10 ? `0${nextM}` : `${nextM}`;
      const dStr = i < 10 ? `0${i}` : `${i}`;
      days.push({ dayNum: i, isCurrentMonth: false, dateStr: `${nextY}-${mStr}-${dStr}` });
    }

    return days;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="lg"
    >
      {/* Action Couldn't Be Completed Error Dialog Overlay */}
      {showPastTimeDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 animate-fade-in select-none">
          <div className="bg-[#222327] border border-neutral-700/80 rounded-2xl p-5 shadow-2xl max-w-sm w-full flex flex-col gap-4 text-white relative animate-modal-scale">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Action couldn't be completed</h3>
              <button
                type="button"
                onClick={() => setShowPastTimeDialog(false)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Enter a start and end time that are later than the current time.
            </p>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowPastTimeDialog(false)}
                className="bg-[#0B5CFF] hover:bg-[#004FE0] text-white text-xs font-semibold px-5 py-1.5 rounded-full shadow transition-all"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {createdMeeting ? (
        <div className="flex flex-col gap-5 py-2 select-none">
          <div className="p-4 bg-[#242528] border border-neutral-800 rounded-xl flex flex-col gap-3">
            <h3 className="font-semibold text-lg text-white">{createdMeeting.title}</h3>
            <div className="flex flex-col gap-1.5 text-xs text-gray-300">
              <span>
                Meeting ID:{" "}
                <strong className="text-[#0B5CFF] font-bold">
                  {formatMeetingCode(createdMeeting.meeting_code)}
                </strong>
              </span>
              <span>
                Invite Link:{" "}
                <span className="text-gray-400 underline">
                  {typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/j/
                  {createdMeeting.meeting_code}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-2 bg-[#2B2C30] hover:bg-[#38393E] text-white text-xs font-medium px-4 py-2 rounded-full transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy invitation link"}</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="bg-[#0B5CFF] hover:bg-[#004FE0] text-white text-xs font-semibold px-6 py-2 rounded-full shadow transition-all"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 select-none">
          {/* Top Calendar Notice Banner */}
          {!isBannerDismissed && (
            <div className="bg-[#182742] border border-[#234075] rounded-xl p-3 flex items-start justify-between gap-3 text-xs text-gray-200 leading-relaxed">
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
                type="button"
                onClick={() => setIsBannerDismissed(true)}
                className="text-gray-400 hover:text-white p-0.5 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Attention Warning Banner */}
          {hasPastTimeError && (
            <div className="bg-[#281316] border border-[#521C21] rounded-xl p-3 flex items-center gap-2.5 text-xs text-red-200 font-medium animate-fade-in">
              <AlertCircle className="w-4 h-4 text-[#FF5B5B] shrink-0" />
              <span>Some fields require your attention</span>
            </div>
          )}

          {/* 1. Main Meeting Title / Topic Input */}
          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              placeholder="Meeting topic"
              className="w-full bg-[#18181B] border border-[#0B5CFF] rounded-lg px-3.5 py-2.5 text-base font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#0B5CFF] transition-all"
            />
          </div>

          {/* 2. Date & Time Controls Row with Clickable Pills & Floating Popups */}
          <div ref={dateTimeContainerRef} className="flex flex-col gap-2.5 mt-1 relative">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Start Date Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsDatePickerOpen(!isDatePickerOpen);
                    setIsStartTimeOpen(false);
                    setIsEndTimeOpen(false);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer select-none ${
                    isDatePickerOpen
                      ? "border-[#0B5CFF] bg-[#242528] text-white ring-1 ring-[#0B5CFF]"
                      : "border-neutral-700/80 bg-[#28282C] text-gray-200 hover:border-neutral-500"
                  }`}
                >
                  {formatPillDate(startDate)}
                </button>

                {/* Floating Custom Date Picker Popup */}
                {isDatePickerOpen && (
                  <div className="absolute top-full left-0 mt-2 z-50 bg-[#202024] border border-neutral-700/80 rounded-2xl shadow-2xl p-3.5 w-64 select-none animate-in fade-in zoom-in-95 duration-100">
                    {/* Header */}
                    <div className="flex items-center justify-between px-1 mb-3 text-xs">
                      <div className="flex items-center gap-1 text-gray-400">
                        <button
                          type="button"
                          onClick={() => changeCalendarYear(-1)}
                          className="hover:text-white p-1 rounded hover:bg-neutral-800 font-bold text-xs"
                          title="Previous year"
                        >
                          «
                        </button>
                        <button
                          type="button"
                          onClick={() => changeCalendarMonth(-1)}
                          className="hover:text-white p-1 rounded hover:bg-neutral-800 font-bold text-xs"
                          title="Previous month"
                        >
                          ‹
                        </button>
                      </div>
                      <span className="font-semibold text-white text-xs">
                        {MONTH_NAMES[viewMonth]} {viewYear}
                      </span>
                      <div className="flex items-center gap-1 text-gray-400">
                        <button
                          type="button"
                          onClick={() => changeCalendarMonth(1)}
                          className="hover:text-white p-1 rounded hover:bg-neutral-800 font-bold text-xs"
                          title="Next month"
                        >
                          ›
                        </button>
                        <button
                          type="button"
                          onClick={() => changeCalendarYear(1)}
                          className="hover:text-white p-1 rounded hover:bg-neutral-800 font-bold text-xs"
                          title="Next year"
                        >
                          »
                        </button>
                      </div>
                    </div>

                    {/* Weekdays */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-gray-400 mb-1">
                      <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {getCalendarGridDays().map((d, idx) => {
                        const isSelected = d.dateStr === startDate;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setStartDate(d.dateStr);
                              setIsDatePickerOpen(false);
                            }}
                            className={`w-7 h-7 flex items-center justify-center text-xs rounded-md transition-colors ${
                              isSelected
                                ? "border border-[#0B5CFF] text-white font-bold bg-[#0B5CFF]/20"
                                : d.isCurrentMonth
                                ? "text-gray-200 hover:bg-[#2D2E33] hover:text-white"
                                : "text-gray-600 hover:bg-[#2D2E33]/50"
                            }`}
                          >
                            {d.dayNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Start Time Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsStartTimeOpen(!isStartTimeOpen);
                    setIsDatePickerOpen(false);
                    setIsEndTimeOpen(false);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer select-none ${
                    isStartTimeOpen
                      ? "border-[#0B5CFF] bg-[#242528] text-white ring-1 ring-[#0B5CFF]"
                      : "border-neutral-700/80 bg-[#28282C] text-gray-200 hover:border-neutral-500"
                  }`}
                >
                  {formatPillTime(startTime)}
                </button>

                {/* Floating Start Time Dropdown */}
                {isStartTimeOpen && (
                  <div className="absolute top-full left-0 mt-2 z-50 bg-[#202024] border border-neutral-700/80 rounded-xl shadow-2xl py-1.5 px-1 w-36 max-h-56 overflow-y-auto custom-scrollbar select-none">
                    {TIME_SLOTS.map((slot) => {
                      const isSelected = slot === startTime;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            setStartTime(slot);
                            setIsStartTimeOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg transition-colors relative ${
                            isSelected
                              ? "bg-[#2D2E33] text-white font-semibold"
                              : "text-gray-300 hover:bg-[#2D2E33] hover:text-white"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-[#0B5CFF] rounded-r" />
                          )}
                          <span className="ml-1">{formatPillTime(slot)}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Arrow Divider */}
              <span className="text-gray-400 text-xs px-0.5">→</span>

              {/* End Time Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsEndTimeOpen(!isEndTimeOpen);
                    setIsDatePickerOpen(false);
                    setIsStartTimeOpen(false);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer select-none ${
                    isEndTimeOpen
                      ? "border-[#0B5CFF] bg-[#242528] text-white ring-1 ring-[#0B5CFF]"
                      : "border-neutral-700/80 bg-[#28282C] text-gray-200 hover:border-neutral-500"
                  }`}
                >
                  {formatPillTime(getEndTime24())}
                </button>

                {/* Floating End Time Dropdown */}
                {isEndTimeOpen && (
                  <div className="absolute top-full left-0 mt-2 z-50 bg-[#202024] border border-neutral-700/80 rounded-xl shadow-2xl py-1.5 px-1 w-36 max-h-56 overflow-y-auto custom-scrollbar select-none">
                    {TIME_SLOTS.map((slot) => {
                      const isSelected = slot === getEndTime24();
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            // Calculate new duration in minutes from startTime to slot
                            const [startH, startM] = startTime.split(":").map(Number);
                            const [endH, endM] = slot.split(":").map(Number);
                            let diff = (endH * 60 + endM) - (startH * 60 + startM);
                            if (diff <= 0) diff += 1440; // overflow next day
                            setDurationMinutes(diff);
                            setIsEndTimeOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg transition-colors relative ${
                            isSelected
                              ? "bg-[#2D2E33] text-white font-semibold"
                              : "text-gray-300 hover:bg-[#2D2E33] hover:text-white"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-[#0B5CFF] rounded-r" />
                          )}
                          <span className="ml-1">{formatPillTime(slot)}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* End Date Pill (Matches Start Date) */}
              <div className="relative bg-[#2B2C30] border border-neutral-700/80 rounded-full px-3.5 py-1.5 text-xs text-gray-400 font-medium opacity-80 cursor-not-allowed select-none">
                <span>{formatPillDate(startDate)}</span>
              </div>
            </div>

            {/* Timezone & Repeat Untouchable Rows */}
            <div className="flex items-center gap-4 text-xs text-gray-300 mt-1">
              <div className="flex items-center gap-1 bg-[#242528] border border-neutral-800 rounded-full px-3 py-1 text-gray-400 opacity-80 cursor-not-allowed">
                <span>(GMT+5:30) Mumbai, Kolkata, ...</span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </div>

              <div className="flex items-center gap-1.5 text-gray-400 opacity-80 cursor-not-allowed">
                <span>Repeat</span>
                <div className="flex items-center gap-1 bg-[#242528] border border-neutral-800 rounded-full px-3 py-1">
                  <span>Never</span>
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Invitees Section (Untouchable) */}
          <div className="flex flex-col gap-1.5 mt-1">
            <label className="text-sm font-semibold text-white">Invitees</label>
            <input
              type="text"
              disabled
              placeholder="Add invitees"
              className="w-full bg-[#242528] border border-neutral-800 rounded-full px-4 py-2 text-xs text-gray-500 cursor-not-allowed opacity-80 placeholder:text-gray-500"
            />
          </div>

          {/* 4. Meeting ID Section */}
          <div className="flex flex-col gap-2 mt-1">
            <label className="text-sm font-semibold text-white">Meeting ID</label>
            <div className="flex items-center gap-6 text-xs text-gray-200">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="meetingIdType"
                  checked
                  readOnly
                  className="accent-[#0B5CFF] w-4 h-4 cursor-pointer"
                />
                <span>Generate Automatically</span>
              </label>

              <label className="flex items-center gap-2 cursor-not-allowed opacity-60 text-gray-400">
                <input
                  type="radio"
                  name="meetingIdType"
                  disabled
                  className="w-4 h-4 cursor-not-allowed"
                />
                <span>Personal Meeting ID 538 186 3384</span>
              </label>
            </div>
          </div>

          {/* 5. Meeting Agenda Section */}
          <div className="flex flex-col gap-1.5 mt-1">
            <label className="text-sm font-semibold text-white">Meeting agenda</label>
            {!showAgendaInput ? (
              <button
                type="button"
                onClick={() => setShowAgendaInput(true)}
                className="text-xs text-[#0B5CFF] font-medium hover:underline text-left w-fit"
              >
                Create agenda
              </button>
            ) : (
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter meeting agenda or notes..."
                className="w-full bg-[#18181B] border border-neutral-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#0B5CFF]"
              />
            )}
          </div>

          {/* 6. Attachments Section (Untouchable) */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex items-center gap-1 text-sm font-semibold text-white">
              <span>Attachments</span>
              <Info className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <button
              type="button"
              disabled
              className="bg-[#2B2C30] text-gray-300 text-xs px-3.5 py-1.5 rounded-full cursor-not-allowed opacity-80 border border-neutral-700/60 w-fit flex items-center gap-1.5"
            >
              <span className="text-sm">+</span>
              <span>Add attachments</span>
            </button>
          </div>

          {/* Inline Error */}
          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-800 rounded-lg text-xs text-red-300 mt-1">
              {errorMessage}
            </div>
          )}

          {/* 7. Modal Footer */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-neutral-800/80">
            <button
              type="button"
              className="text-xs text-[#0B5CFF] font-medium opacity-80 cursor-not-allowed hover:underline"
              title="More Options (Unavailable)"
            >
              More Options
            </button>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!topic.trim() || loading}
                className="bg-[#0B5CFF] hover:bg-[#004FE0] text-white text-xs font-semibold px-6 py-2 rounded-full shadow transition-all disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};


