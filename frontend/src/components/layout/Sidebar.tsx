"use client";

import React from "react";
import Link from "next/link";
import {
  Home as HomeIcon,
  Video,
  MessageSquare,
  Compass,
  MoreHorizontal,
  Settings as SettingsIcon,
  PlusCircle,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden sm:flex w-16 bg-[#18181A] border-r border-neutral-800/80 flex-col justify-between items-center py-3 select-none shrink-0 z-40">
      {/* Top Main Navigation Items */}
      <div className="flex flex-col items-center gap-4 w-full px-1.5">
        {/* 1. Home (Active) */}
        <Link
          href="/"
          className="flex flex-col items-center justify-center w-full py-2 rounded-xl bg-[#242427] text-white transition-colors"
          title="Home"
        >
          <HomeIcon className="w-4 h-4 stroke-[2]" />
          <span className="text-[10px] font-semibold mt-1">Home</span>
        </Link>

        {/* 2. ZoomMate (Unusable Placeholder) */}
        <div
          className="flex flex-col items-center justify-center w-full py-1.5 rounded-xl text-gray-400 opacity-60 cursor-not-allowed"
          title="ZoomMate (Unavailable)"
        >
          <PlusCircle className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] font-medium mt-1">ZoomMate</span>
        </div>

        {/* 3. Meetings */}
        <Link
          href="/#meetings"
          className="flex flex-col items-center justify-center w-full py-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-[#242427] transition-colors"
          title="Meetings"
        >
          <Video className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] font-medium mt-1">Meetings</span>
        </Link>

        {/* 4. Chat (Unusable) */}
        <div
          className="flex flex-col items-center justify-center w-full py-1.5 rounded-xl text-gray-400 opacity-60 cursor-not-allowed"
          title="Chat (Unavailable)"
        >
          <MessageSquare className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] font-medium mt-1">Chat</span>
        </div>

        {/* 5. Hub (Unusable) */}
        <div
          className="flex flex-col items-center justify-center w-full py-1.5 rounded-xl text-gray-400 opacity-60 cursor-not-allowed"
          title="Hub (Unavailable)"
        >
          <Compass className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] font-medium mt-1">Hub</span>
        </div>

        {/* 6. More (Unusable with NEW tag) */}
        <div
          className="flex flex-col items-center justify-center w-full py-1.5 rounded-xl text-gray-400 opacity-60 cursor-not-allowed relative"
          title="More (Unavailable)"
        >
          <MoreHorizontal className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[9px] font-bold text-[#0B5CFF] bg-[#1E293B] px-1 rounded uppercase tracking-tighter mt-0.5">NEW</span>
          <span className="text-[10px] font-medium mt-0.5">More</span>
        </div>
      </div>

      {/* Bottom Settings Link */}
      <div className="w-full px-1.5">
        <button
          title="Settings"
          className="flex flex-col items-center justify-center w-full py-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#242427] transition-colors"
        >
          <SettingsIcon className="w-4 h-4 stroke-[1.8]" />
          <span className="text-[10px] font-medium mt-1">Settings</span>
        </button>
      </div>
    </aside>
  );
};
