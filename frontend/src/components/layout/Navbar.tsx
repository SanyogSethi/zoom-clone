"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Bell, Calendar, ChevronLeft, ChevronRight, Plus, UserCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { AuthModal } from "@/components/auth/AuthModal";
import { api } from "@/lib/api";
import { User } from "@/lib/types";

export const Navbar: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    // Load current user profile from server or storage
    api
      .getMe()
      .then((user) => setCurrentUser(user))
      .catch(() => {
        const stored = localStorage.getItem("zoom_user");
        if (stored) {
          try {
            setCurrentUser(JSON.parse(stored));
          } catch {}
        }
      });
  }, []);

  return (
    <>
      <header className="sticky top-0 left-0 right-0 h-12 bg-[#18181A] text-white border-b border-neutral-800/80 flex items-center justify-between px-3.5 select-none z-50 shrink-0">
        {/* Left: Zoom Workplace Wordmark & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className="flex items-center gap-1.5 font-bold text-sm tracking-tight hover:opacity-90">
            <span className="text-[#0B5CFF] text-base font-black lowercase">zoom</span>
            <span className="text-white text-xs font-semibold hidden xs:inline">Workplace</span>
          </Link>

          {/* History Arrows */}
          <div className="hidden md:flex items-center gap-1 text-gray-400 ml-2">
            <button className="hover:text-white p-0.5"><ChevronLeft className="w-3.5 h-3.5" /></button>
            <button className="hover:text-white p-0.5"><ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden sm:flex items-center gap-2 max-w-xs md:max-w-md w-full mx-2 sm:mx-4">
          <div className="relative flex-1 flex items-center">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3" />
            <input
              type="text"
              placeholder="Search (⌘E)"
              readOnly
              className="w-full pl-8 pr-4 py-1 bg-[#242427] border border-neutral-700/60 rounded-md text-xs text-white placeholder-gray-400 cursor-pointer focus:outline-none text-center"
            />
          </div>
          <button title="Create" className="text-gray-400 hover:text-white p-1">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Right Tools & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="hidden sm:inline-block px-3 py-1 bg-[#0B5CFF] hover:bg-blue-600 text-white font-semibold text-xs rounded-full transition-colors shadow-sm">
            Upgrade
          </button>
          <button title="Notifications" className="text-gray-300 hover:text-white transition-colors relative p-1">
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 bg-[#FF742E] rounded-full absolute top-0.5 right-0.5" />
          </button>
          <button title="Calendar" className="hidden xs:block text-gray-300 hover:text-white transition-colors p-1">
            <Calendar className="w-4 h-4" />
          </button>
          
          {/* Active Profile Trigger */}
          <button
            onClick={() => setIsAuthOpen(true)}
            className="flex items-center gap-2 cursor-pointer ml-1 p-1 hover:bg-neutral-800/60 rounded-lg transition-colors group"
            title="Switch User / Account"
          >
            <Avatar name={currentUser?.display_name || "Sanyog Sethi"} size="sm" showStatus={true} />
            <span className="text-xs font-medium text-neutral-300 group-hover:text-white max-w-[100px] truncate hidden md:inline">
              {currentUser?.display_name || "Sanyog Sethi"}
            </span>
          </button>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          window.location.reload();
        }}
      />
    </>
  );
};
