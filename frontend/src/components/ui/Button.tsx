import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "action" | "secondary" | "danger" | "dark" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-btn transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantStyles = {
    primary:
      "bg-zoom-blue text-white hover:bg-zoom-blue-hover active:bg-zoom-blue-active focus:ring-zoom-blue",
    action:
      "bg-zoom-orange text-white hover:bg-zoom-orange-hover active:bg-orange-700 focus:ring-zoom-orange",
    secondary:
      "bg-white text-zoom-text-primary border border-zoom-border hover:bg-zoom-surface active:bg-gray-100 focus:ring-zoom-blue",
    danger:
      "bg-zoom-danger text-white hover:bg-zoom-danger-hover active:bg-red-800 focus:ring-zoom-danger",
    dark:
      "bg-zoom-dark-tile text-white hover:bg-neutral-700 active:bg-neutral-800 focus:ring-neutral-500",
    ghost:
      "bg-transparent text-zoom-text-primary hover:bg-zoom-surface active:bg-gray-200 focus:ring-zoom-blue",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};
