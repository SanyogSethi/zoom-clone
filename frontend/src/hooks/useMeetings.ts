"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { UpcomingMeeting, RecentMeeting, SessionJoinResponse } from "@/lib/types";
import { extractCodeFromInput } from "@/lib/format";

export function useMeetings() {
  const router = useRouter();
  const [upcoming, setUpcoming] = useState<UpcomingMeeting[]>([]);
  const [recent, setRecent] = useState<RecentMeeting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch upcoming and recent meetings from backend
  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [upcomingData, recentData] = await Promise.all([
        api.getUpcomingMeetings(),
        api.getRecentMeetings(),
      ]);
      setUpcoming(upcomingData);
      setRecent(recentData);
    } catch (err: any) {
      setError(err.message || "Failed to load meetings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
    const timer = setTimeout(() => {
      fetchMeetings();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchMeetings]);

  // Workflow 1: Instant Meeting Creation
  const createInstantMeeting = async (): Promise<SessionJoinResponse | null> => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await api.createInstantMeeting();
      // Store session and participant IDs in sessionStorage for meeting room initialization
      sessionStorage.setItem(`session_${response.meeting_code}`, JSON.stringify(response));
      if (typeof window !== "undefined") {
        window.location.href = `/meeting/${response.meeting_code}`;
      } else {
        router.push(`/meeting/${response.meeting_code}`);
      }
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to create instant meeting.");
      return null;
    } finally {
      setActionLoading(false);
    }
  };

  // Workflow 2: Join Meeting by Code or Invite Link
  const joinMeeting = async (inputCode: string, displayName?: string): Promise<SessionJoinResponse | null> => {
    const rawCode = extractCodeFromInput(inputCode);
    if (!rawCode || rawCode.length < 5) {
      throw new Error("Please enter a valid Meeting ID or invite URL.");
    }

    setActionLoading(true);
    setError(null);
    try {
      const response = await api.joinMeeting(rawCode, displayName);
      sessionStorage.setItem(`session_${response.meeting_code}`, JSON.stringify(response));
      if (typeof window !== "undefined") {
        window.location.href = `/meeting/${response.meeting_code}`;
      } else {
        router.push(`/meeting/${response.meeting_code}`);
      }
      return response;
    } catch (err: any) {
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Workflow 3: Schedule Meeting
  const scheduleMeeting = async (data: {
    title: string;
    description?: string;
    scheduled_start: string;
    duration_minutes: number;
  }) => {
    setActionLoading(true);
    setError(null);
    try {
      const meeting = await api.scheduleMeeting(data);
      await fetchMeetings(); // Refresh upcoming meetings list
      return meeting;
    } catch (err: any) {
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Workflow 4: Rejoin Live Session
  const rejoinMeeting = async (meetingCode: string): Promise<SessionJoinResponse | null> => {
    setActionLoading(true);
    try {
      const storedName =
        typeof window !== "undefined" ? localStorage.getItem("zoom_display_name") || undefined : undefined;
      const response = await api.joinMeeting(meetingCode, storedName);
      sessionStorage.setItem(`session_${response.meeting_code}`, JSON.stringify(response));
      if (typeof window !== "undefined") {
        window.location.href = `/meeting/${response.meeting_code}`;
      } else {
        router.push(`/meeting/${response.meeting_code}`);
      }
      return response;
    } catch (err: any) {
      console.error("Rejoin meeting failed:", err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  return {
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
  };
}
