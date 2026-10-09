import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with 150ms fade */}
      <div
        className="fixed inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card with 200ms scale/fade animation */}
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-[#1E1E22] border border-neutral-800 rounded-2xl shadow-2xl text-white p-6 z-10 animate-modal-scale`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4">
          {title ? (
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2 text-gray-400">
            <button
              type="button"
              className="hover:text-white transition-colors p-1 rounded-md hover:bg-neutral-800/80 cursor-not-allowed opacity-75"
              title="Expand (Unavailable)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="hover:text-white transition-colors p-1 rounded-md hover:bg-neutral-800/80"
              title="Close"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
};
