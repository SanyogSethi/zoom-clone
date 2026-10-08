export interface User {
  id: number;
  email: str;
  display_name: string;
  avatar_url?: string;
  timezone: string;
  created_at: string;
}

export interface Meeting {
  id: number;
  host_id: number;
  host_display_name: string;
  meeting_code: string;
  title: string;
  description?: string;
  type: 'instant' | 'scheduled';
  scheduled_start?: string;
  duration_minutes?: number;
  status: 'scheduled' | 'live' | 'ended';
  created_at: string;
}

export interface UpcomingMeeting {
  id: number;
  meeting_code: string;
  title: string;
  description?: string;
  scheduled_start: string;
  duration_minutes: number;
  status: 'scheduled';
  host_display_name: string;
}

export interface RecentMeeting {
  session_id: number;
  meeting_id: number;
  meeting_code: string;
  title: string;
  host_display_name: string;
  started_at: string;
  ended_at?: string;
  left_at?: string;
  duration_minutes?: number;
  can_rejoin: boolean;
  display_name_used: string;
}

export interface SessionJoinResponse {
  session_id: number;
  participant_id: number;
  meeting_code: string;
  title: string;
  role: 'host' | 'participant';
}

export interface Participant {
  id: number;
  session_id: number;
  user_id?: number;
  display_name: string;
  role: 'host' | 'participant';
  status: 'joined' | 'left' | 'removed';
  is_muted: boolean;
  joined_at: string;
  left_at?: string;
}
