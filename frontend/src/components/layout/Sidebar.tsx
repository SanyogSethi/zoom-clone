"use client";

import React from "react";
import Link from "next/link";
import { Home, Calendar, Users, Settings } from "lucide-react";

export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden md:flex w-56 bg-white border-r border-zoom-border flex-col justify-between py-4 select-none shrink-0">
      <div className="flex flex-col gap-1 px-3">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zoom-active-tint text-zoom-blue font-semibold text-sm transition-colors"
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>
        <Link
          href="/#meetings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zoom-text-secondary hover:bg-zoom-surface hover:text-zoom-text-primary font-medium text-sm transition-colors"
        >
          <Calendar className="w-5 h-5" />
          <span>Meetings</span>
        </Link>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 font-medium text-sm cursor-not-allowed">
          <Users className="w-5 h-5" />
          <span>Contacts</span>
        </div>
      </div>

      <div className="px-3 border-t border-zoom-border pt-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 font-medium text-sm cursor-not-allowed">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </div>
      </div>
    </aside>
  );
};
