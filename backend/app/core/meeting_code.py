import secrets

def generate_meeting_code() -> str:
    """
    Generates a 10-digit random numeric meeting code string.
    Stored unformatted in database (e.g., '1234567890').
    Formatting as '123 456 7890' is handled strictly by frontend UI formatters.
    """
    # Generate 10 random digits ensuring non-zero leading digit for consistent length
    first_digit = secrets.choice("123456789")
    remaining_digits = "".join(secrets.choice("0123456789") for _ in range(9))
    return f"{first_digit}{remaining_digits}"
