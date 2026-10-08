from datetime import datetime, timezone

def utcnow_iso() -> str:
    """
    Returns current UTC timestamp formatted in ISO-8601 format.
    Standardized format stored across SQLite columns.
    """
    return datetime.now(timezone.utc).isoformat()
