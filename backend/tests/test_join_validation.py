from app.core.time import utcnow_iso
from app.models.meeting import Meeting
from app.models.meeting_session import MeetingSession
from app.models.participant import Participant

def test_join_nonexistent_meeting_404(client):
    response = client.post("/api/meetings/9999999999/join", json={"display_name": "Tester"})
    assert response.status_code == 404
    assert response.json()["detail"] == "Meeting not found. Please check the Meeting ID."

def test_join_ended_meeting_409(client, db_session):
    m = Meeting(
        host_id=1,
        meeting_code="1111111111",
        title="Ended Meeting",
        type="instant",
        status="ended"
    )
    db_session.add(m)
    db_session.commit()

    response = client.post("/api/meetings/1111111111/join", json={"display_name": "Tester"})
    assert response.status_code == 409
    assert response.json()["detail"] == "This meeting has ended."

def test_join_removed_participant_403(client, db_session):
    m = Meeting(
        host_id=1,
        meeting_code="2222222222",
        title="Session with Removed Participant",
        type="instant",
        status="live"
    )
    db_session.add(m)
    db_session.flush()

    sess = MeetingSession(meeting_id=m.id, started_at=utcnow_iso(), ended_at=None)
    db_session.add(sess)
    db_session.flush()

    p = Participant(
        session_id=sess.id,
        user_id=1,
        display_name="Test Sanyog",
        role="participant",
        status="removed"
    )
    db_session.add(p)
    db_session.commit()

    response = client.post("/api/meetings/2222222222/join", json={"display_name": "Test Sanyog"})
    assert response.status_code == 403
    assert "removed" in response.json()["detail"]
