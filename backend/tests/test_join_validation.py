from app.core.time import utcnow_iso
from app.models.user import User
from app.models.meeting import Meeting
from app.models.meeting_session import MeetingSession
from app.models.participant import Participant

def test_join_nonexistent_meeting_404(client):
    response = client.post("/api/meetings/9999999999/join", json={"display_name": "Tester"})
    assert response.status_code == 404
    assert response.json()["detail"] == "Meeting not found. Please check the Meeting ID."

def test_join_ended_meeting_reactivates_200(client, db_session):
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
    assert response.status_code == 200
    assert response.json()["meeting_code"] == "1111111111"

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

def test_webrtc_signaling_relay(client):
    # User 1 sends signaling message
    send_resp = client.post("/api/signaling/send", json={
        "meeting_code": "2222222222",
        "from_id": "1",
        "to_id": "2",
        "type": "offer",
        "data": {"sdp": "dummy_offer_sdp"}
    })
    assert send_resp.status_code == 200

    # User 2 polls for signals
    poll_resp = client.get("/api/signaling/poll?meeting_code=2222222222&participant_id=2")
    assert poll_resp.status_code == 200
    signals = poll_resp.json()
    assert len(signals) == 1
    assert signals[0]["from_id"] == "1"
    assert signals[0]["type"] == "offer"
    assert signals[0]["data"]["sdp"] == "dummy_offer_sdp"

def test_multiple_users_join_same_session(client, db_session):
    m = Meeting(host_id=1, meeting_code="7777777777", title="Multi-User Meeting", type="instant", status="live")
    db_session.add(m)
    db_session.commit()

    # User 1 (Host) joins
    res1 = client.post("/api/meetings/7777777777/join", json={"display_name": "Sanyog Sethi"})
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["role"] == "host"

    # User 2 (Participant) joins same meeting code
    res2 = client.post("/api/meetings/7777777777/join", json={"display_name": "Guest PM"})
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["role"] == "participant"
    assert data2["session_id"] == data1["session_id"]
    assert data2["participant_id"] != data1["participant_id"]
def test_host_mute_all_functionality(client, db_session):
    m = Meeting(host_id=1, meeting_code="8888888888", title="Mute All Meeting", type="instant", status="live")
    db_session.add(m)
    db_session.commit()

    res1 = client.post("/api/meetings/8888888888/join", json={"display_name": "Host User"})
    s_id = res1.json()["session_id"]

    res2 = client.post("/api/meetings/8888888888/join", json={"display_name": "Guest User"})
    p2_id = res2.json()["participant_id"]

    # Host triggers mute-all
    mute_resp = client.post(f"/api/sessions/{s_id}/mute-all")
    assert mute_resp.status_code == 200

    # Verify guest is muted in session participant list
    plist = client.get(f"/api/sessions/{s_id}/participants").json()
    guest_p = next(p for p in plist if p["id"] == p2_id)
    assert guest_p["is_muted"] is True

    # Guest unmutes themselves
    unmute_resp = client.post(f"/api/participants/{p2_id}/unmute")
    assert unmute_resp.status_code == 200

    plist_after = client.get(f"/api/sessions/{s_id}/participants").json()
    guest_p_after = next(p for p in plist_after if p["id"] == p2_id)
    assert guest_p_after["is_muted"] is False

def test_scheduled_meeting_not_started_cannot_be_joined(client, db_session):
    from datetime import datetime, timedelta, timezone
    u2 = User(id=2, email="guest@example.com", display_name="Guest User", timezone="UTC")
    db_session.add(u2)

    future_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    m = Meeting(
        host_id=1,
        meeting_code="9990001112",
        title="Future Meeting",
        type="scheduled",
        scheduled_start=future_time,
        duration_minutes=30,
        status="scheduled"
    )
    db_session.add(m)
    db_session.commit()

    # Non-host user (User ID 2) attempts to join scheduled meeting that has not started
    res = client.post("/api/meetings/9990001112/join", json={"display_name": "Guest Participant"}, headers={"X-User-Id": "2"})
    assert res.status_code == 400
    assert res.json()["detail"] == "This scheduled meeting has not started yet."


