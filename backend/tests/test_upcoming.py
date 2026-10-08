from datetime import datetime, timedelta, timezone
from app.models.meeting import Meeting

def test_upcoming_meetings_filter(client, db_session):
    now = datetime.now(timezone.utc)

    # Future meeting (should be returned)
    m_future = Meeting(
        host_id=1,
        meeting_code="5555555555",
        title="Future Sync",
        type="scheduled",
        scheduled_start=(now + timedelta(days=1)).isoformat(),
        duration_minutes=30,
        status="scheduled"
    )

    # Past meeting (should NOT be returned in upcoming)
    m_past = Meeting(
        host_id=1,
        meeting_code="6666666666",
        title="Past Sync",
        type="scheduled",
        scheduled_start=(now - timedelta(days=1)).isoformat(),
        duration_minutes=30,
        status="scheduled"
    )

    db_session.add_all([m_future, m_past])
    db_session.commit()

    response = client.get("/api/meetings/upcoming")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["meeting_code"] == "5555555555"
