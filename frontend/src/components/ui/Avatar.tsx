import React from "react";

export interface AvatarProps {
  name: string;
  url?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  url,
  size = "md",
  showStatus = false,
}) => {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-lg",
    xl: "w-24 h-24 text-2xl",
  };

  return (
    <div className="relative inline-block">
      {url ? (
        <img
          src={url}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover border border-gray-200`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-zoom-blue text-white font-bold flex items-center justify-center border border-blue-400`}
        >
          {initials}
        </div>
      )}
      {showStatus && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-zoom-live border-2 border-white rounded-full" />
      )}
    </div>
  );
};
