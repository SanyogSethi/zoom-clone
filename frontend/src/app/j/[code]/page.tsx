"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { JoinDialog } from "@/components/dashboard/JoinDialog";
import { useMeetings } from "@/hooks/useMeetings";

export default function JoinByLinkPage() {
  const params = useParams();
  const router = useRouter();
  const codeParam = typeof params?.code === "string" ? params.code : "";
  const { joinMeeting } = useMeetings();
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const handleJoin = async (code: string, displayName: string) => {
    await joinMeeting(code, displayName);
  };

  const handleClose = () => {
    setIsOpen(false);
    router.push("/");
  };

  return (
    <div className="flex-1 bg-[#1C1C1C] flex items-center justify-center p-4">
      <JoinDialog
        isOpen={isOpen}
        initialCode={codeParam}
        onClose={handleClose}
        onJoin={handleJoin}
      />
    </div>
  );
}
