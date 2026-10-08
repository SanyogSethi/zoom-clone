import React, { useEffect, useRef } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = "success",
  onClose,
  duration = 3000,
}) => {
  const savedOnClose = useRef(onClose);

  useEffect(() => {
    savedOnClose.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      savedOnClose.current();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-neutral-900 border border-neutral-700 text-white rounded-btn shadow-lg animate-fade-in select-none">
      {type === "success" ? (
        <CheckCircle2 className="w-5 h-5 text-zoom-live" />
      ) : (
        <AlertCircle className="w-5 h-5 text-zoom-danger" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-white ml-2 p-0.5 rounded hover:bg-neutral-800 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
