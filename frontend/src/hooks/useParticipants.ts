"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Participant } from "@/lib/types";

export function useParticipants(sessionId: number | null) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchParticipants = useCallback(async () => {
    if (!sessionId) return;
    try {
      const data = await api.getSessionParticipants(sessionId);
      setParticipants(data);
    } catch (err) {
      console.error("Failed to fetch session participants:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchParticipants();
    // Poll every 3 seconds to keep participant list up to date
    const interval = setInterval(fetchParticipants, 3000);
    return () => clearInterval(interval);
  }, [fetchParticipants]);

  const activeParticipants = participants.filter((p) => p.status === "joined");

  return {
    participants,
    activeParticipants,
    loading,
    refreshParticipants: fetchParticipants,
  };
}
