import {
  User,
  Meeting,
  UpcomingMeeting,
  RecentMeeting,
  SessionJoinResponse,
  Participant,
} from "./types";

const rawApiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const cleanApiBase = rawApiBase.trim().replace(/\/+$/, "");
const API_BASE = cleanApiBase.endsWith("/api") ? cleanApiBase : `${cleanApiBase}/api`;

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

  let authToken = typeof window !== "undefined" ? localStorage.getItem("zoom_auth_token") : null;
  if (!authToken && typeof window !== "undefined") {
    authToken = localStorage.getItem("zoom_auth_profile") || "user_1";
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = "An unexpected error occurred.";
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        if (typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail
            .map((item: any) => (typeof item === "string" ? item : item.msg || JSON.stringify(item)))
            .join("; ");
        } else if (typeof errorData.detail === "object") {
          errorMessage = errorData.detail.msg || JSON.stringify(errorData.detail);
        }
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new ApiError(String(errorMessage), response.status);
  }

  return response.json() as Promise<T>;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const api = {
  getMe: () => request<User>("/auth/me"),

  getAuthProfiles: () => request<User[]>("/auth/profiles"),

  register: (data: { email: string; display_name: string; password: string }) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  loginWithGoogle: (credential: string) =>
    request<AuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    }),

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

  joinMeeting: (code: string, displayName?: string, participantId?: number) =>
    request<SessionJoinResponse>(`/meetings/${code}/join`, {
      method: "POST",
      body: JSON.stringify({ display_name: displayName, participant_id: participantId }),
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

  unmuteParticipant: (participantId: number) =>
    request<{ detail: string }>(`/participants/${participantId}/unmute`, {
      method: "POST",
    }),

  removeParticipant: (participantId: number) =>
    request<{ detail: string }>(`/participants/${participantId}/remove`, {
      method: "POST",
    }),

  sendSignal: (data: {
    meeting_code: string;
    from_id: string;
    to_id?: string | null;
    type: string;
    data: any;
  }) =>
    request<{ status: string }>("/signaling/send", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  pollSignals: (meetingCode: string, participantId: string) =>
    request<
      Array<{
        id: string;
        from_id: string;
        to_id: string | null;
        type: string;
        data: any;
        timestamp: number;
      }>
    >(`/signaling/poll?meeting_code=${meetingCode}&participant_id=${participantId}`),
};

