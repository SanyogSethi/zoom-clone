/**
  * Formats a 10-digit unformatted meeting code string into '123 456 7890'.
  */
export function formatMeetingCode(code: string): string {
  const digits = code.replace(/\D/g, "");
  if (digits.length !== 10) return code;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
}

/**
 * Extracts raw 10-digit meeting code from a Meeting ID input or pasted invite URL.
 * Handles inputs like '123 456 7890', '1234567890', or 'http://localhost:3000/j/1234567890'.
 */
export function extractCodeFromInput(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  
  // If invite URL, extract code from last path segment
  if (trimmed.includes("/j/")) {
    const parts = trimmed.split("/j/");
    if (parts.length > 1) {
      const segment = parts[1].split("?")[0].split("#")[0];
      return segment.replace(/\D/g, "");
    }
  }

  return trimmed.replace(/\D/g, "");
}

/**
 * Formats ISO date string to user's local readable date string.
 */
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

/**
 * Formats ISO date string to user's local readable time string (e.g., '8:15 PM').
 */
export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

/**
 * Formats a start date and duration into a local time range (e.g. '8:30 PM - 9:15 PM').
 */
export function formatTimeRange(startIso: string, durationMinutes: number): string {
  try {
    const startDate = new Date(startIso);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const startTime = startDate.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const endTime = endDate.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${startTime} - ${endTime}`;
  } catch {
    return "";
  }
}
