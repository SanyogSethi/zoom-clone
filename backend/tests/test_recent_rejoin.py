from datetime import datetime, timedelta, timezone
from app.models.meeting import Meeting
from app.models.meeting_session import MeetingSession
from app.models.participant import Participant

def test_recent_meetings_and_rejoin_eligibility(client, db_session):
    now = datetime.now(timezone.utc)

    # 1. Ended meeting session
    m1 = Meeting(host_id=1, meeting_code="3333333333", title="Past Meeting", type="scheduled", scheduled_start=now.isoformat(), duration_minutes=30, status="ended")
    db_session.add(m1)
    db_session.flush()
    s1 = MeetingSession(meeting_id=m1.id, started_at=now.isoformat(), ended_at=(now + timedelta(minutes=30)).isoformat())
    db_session.add(s1)
    db_session.flush()
    p1 = Participant(session_id=s1.id, user_id=1, display_name="Test Sanyog", role="host", status="left", joined_at=now.isoformat(), left_at=(now + timedelta(minutes=30)).isoformat())
    db_session.add(p1)

    # 2. Live meeting session where user left but session is still live
    m2 = Meeting(host_id=1, meeting_code="4444444444", title="Live Townhall", type="instant", status="live")
    db_session.add(m2)
    db_session.flush()
    s2 = MeetingSession(meeting_id=m2.id, started_at=now.isoformat(), ended_at=None)
    db_session.add(s2)
    db_session.flush()
    p2 = Participant(session_id=s2.id, user_id=1, display_name="Test Sanyog", role="host", status="left", joined_at=now.isoformat(), left_at=(now + timedelta(minutes=10)).isoformat())
    db_session.add(p2)

    db_session.commit()

    response = client.get("/api/meetings/recent")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    live_item = next(item for item in data if item["meeting_code"] == "4444444444")
    ended_item = next(item for item in data if item["meeting_code"] == "3333333333")

    assert live_item["can_rejoin"] is True
    assert ended_item["can_rejoin"] is False

    # Verify rejoining live meeting via POST endpoint succeeds (200 OK)
    rejoin_resp = client.post("/api/meetings/4444444444/join", json={})
    assert rejoin_resp.status_code == 200
    rejoin_data = rejoin_resp.json()
    assert rejoin_data["meeting_code"] == "4444444444"
    assert rejoin_data["role"] == "host"

