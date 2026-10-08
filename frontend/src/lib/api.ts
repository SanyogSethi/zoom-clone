import {
  User,
  Meeting,
  UpcomingMeeting,
  RecentMeeting,
  SessionJoinResponse,
  Participant,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = "An unexpected error occurred.";
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new ApiError(errorMessage, response.status);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getMe: () => request<User>("/users/me"),

  getUpcomingMeetings: () => request<UpcomingMeeting[]>("/meetings/upcoming"),

  getRecentMeetings: () => request<RecentMeeting[]>("/meetings/recent"),

  createInstantMeeting: () =>
    request<SessionJoinResponse>("/meetings/instant", { method: "POST" }),

  scheduleMeeting: (data: {
    title: string;
    description?: string;
    scheduled_start: string;
    duration_minutes: number;
  }) =>
    request<Meeting>("/meetings/schedule", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMeetingByCode: (code: string) => request<Meeting>(`/meetings/${code}`),

  joinMeeting: (code: string, displayName?: string) =>
    request<SessionJoinResponse>(`/meetings/${code}/join`, {
      method: "POST",
      body: JSON.stringify({ display_name: displayName }),
    }),

  leaveSession: (sessionId: number, participantId: number) =>
    request<{ detail: string }>(`/sessions/${sessionId}/leave`, {
      method: "POST",
      body: JSON.stringify({ participant_id: participantId }),
    }),

  endSession: (sessionId: number) =>
    request<{ detail: string }>(`/sessions/${sessionId}/end`, {
      method: "POST",
    }),

  getSessionParticipants: (sessionId: number) =>
    request<Participant[]>(`/sessions/${sessionId}/participants`),

  muteAll: (sessionId: number) =>
    request<{ detail: string }>(`/sessions/${sessionId}/mute-all`, {
      method: "POST",
    }),

  muteParticipant: (participantId: number) =>
    request<{ detail: string }>(`/participants/${participantId}/mute`, {
      method: "POST",
    }),

  removeParticipant: (participantId: number) =>
    request<{ detail: string }>(`/participants/${participantId}/remove`, {
      method: "POST",
    }),
};
