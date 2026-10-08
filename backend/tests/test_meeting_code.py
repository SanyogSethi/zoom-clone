from app.core.meeting_code import generate_meeting_code

def test_meeting_code_format_and_length():
    code = generate_meeting_code()
    assert len(code) == 10
    assert code.isdigit()
    assert code[0] != "0"

def test_meeting_code_uniqueness():
    codes = {generate_meeting_code() for _ in range(100)}
    assert len(codes) == 100
