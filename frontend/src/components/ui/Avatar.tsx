import React from "react";

export interface AvatarProps {
  name: string;
  url?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = "md",
  showStatus = false,
  className = "",
}) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "U";

  const sizeClasses = {
    sm: "w-8 h-8 text-xs font-semibold",
    md: "w-10 h-10 text-sm font-bold",
    lg: "w-16 h-16 text-lg font-bold",
    xl: "w-24 h-24 text-2xl font-bold",
  };

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full bg-[#0B5CFF] text-white font-bold flex items-center justify-center border border-blue-500/40 shadow-sm select-none`}
      >
        {initials}
      </div>
      {showStatus && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-zoom-live border-2 border-[#18181A] rounded-full" />
      )}
    </div>
  );
};
