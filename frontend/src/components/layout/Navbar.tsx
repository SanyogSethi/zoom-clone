"use client";

import React from "react";
import Link from "next/link";
import { Search, HelpCircle, Bell, Calendar, Video } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 left-0 right-0 h-16 bg-[#1F1F1F] text-white border-b border-neutral-800 flex items-center justify-between px-4 select-none z-50 shrink-0">
      {/* Left: Zoom Workplace Wordmark & Search */}
      <div className="flex items-center gap-5">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-90">
          <span className="text-zoom-blue text-2xl font-black">zoom</span>
          <span className="text-white text-base font-semibold">Workplace</span>
        </Link>

        {/* Global Search Bar */}
        <div className="relative hidden md:flex items-center">
          <Search className="w-4 h-4 text-gray-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search"
            readOnly
            className="w-44 lg:w-60 pl-9 pr-12 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-gray-400 cursor-pointer focus:outline-none"
          />
          <kbd className="absolute right-3 text-[10px] bg-neutral-800 text-gray-400 px-1.5 py-0.5 rounded font-mono">
            ⌘F
          </kbd>
        </div>
      </div>

      {/* Center Navigation Tabs */}
      <nav className="flex items-center gap-1">
        <Link
          href="/"
          className="flex flex-col items-center px-4 py-1 rounded-lg bg-neutral-800 text-white font-medium text-xs hover:bg-neutral-700 transition-colors"
        >
          <Video className="w-4 h-4 mb-0.5" />
          <span>Home</span>
        </Link>
        <Link
          href="/#meetings"
          className="flex flex-col items-center px-4 py-1 rounded-lg text-gray-400 font-medium text-xs hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <Calendar className="w-4 h-4 mb-0.5" />
          <span>Meetings</span>
        </Link>
      </nav>

      {/* Right Tools & User Profile */}
      <div className="flex items-center gap-3.5">
        <button title="Help" className="text-gray-400 hover:text-white transition-colors p-1">
          <HelpCircle className="w-5 h-5" />
        </button>
        <button title="Notifications" className="text-gray-400 hover:text-white transition-colors relative p-1">
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 bg-zoom-orange rounded-full absolute top-1 right-1" />
        </button>
        <button title="Calendar" className="text-gray-400 hover:text-white transition-colors p-1">
          <Calendar className="w-5 h-5" />
        </button>
        <div className="border-l border-neutral-700 h-5 mx-0.5" />
        <div className="flex items-center gap-2 cursor-pointer">
          <Avatar name="Sanyog Sethi" size="sm" showStatus={true} />
        </div>
      </div>
    </header>
  );
};
