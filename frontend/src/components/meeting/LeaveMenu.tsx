"use client";

import React, { useEffect, useRef } from "react";
import { LogOut, XCircle } from "lucide-react";

export interface LeaveMenuProps {
  isOpen: boolean;
  isHost: boolean;
  onClose: () => void;
  onLeave: () => void;
  onEndAll: () => void;
}

export const LeaveMenu: React.FC<LeaveMenuProps> = ({
  isOpen,
  isHost,
  onClose,
  onLeave,
  onEndAll,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bottom-16 right-4 z-50 w-56 bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl p-2 flex flex-col gap-1 animate-fade-in select-none"
    >
      <button
        onClick={onLeave}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-800 text-white text-sm font-medium transition-colors"
      >
        <LogOut className="w-4 h-4 text-gray-400" />
        <span>Leave meeting</span>
      </button>

      {isHost && (
        <button
          onClick={onEndAll}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-red-950/80 text-zoom-danger text-sm font-semibold transition-colors border-t border-neutral-800 mt-1 pt-2"
        >
          <XCircle className="w-4 h-4 text-zoom-danger" />
          <span>End meeting for all</span>
        </button>
      )}
    </div>
  );
};
