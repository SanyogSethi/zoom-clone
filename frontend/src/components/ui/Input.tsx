import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = "",
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-gray-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 bg-neutral-900 border border-zoom-dark-border rounded-btn text-sm text-white placeholder-gray-500 focus:outline-none focus:border-zoom-blue focus:ring-1 focus:ring-zoom-blue transition-colors ${
          error ? "border-zoom-danger focus:ring-zoom-danger" : ""
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-zoom-danger">{error}</span>}
    </div>
  );
};
