import os
import sys
from datetime import datetime, timedelta, timezone

# Ensure parent directory is in python path for module imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import engine, Base, SessionLocal
from app.models import User, Meeting, MeetingSession, Participant

def seed_data():
    """
    Idempotent database seed script.
    Clears existing tables and creates standard default users, upcoming scheduled meetings,
    ended past sessions, and exactly ONE currently live session where the default user left,
    making the Rejoin button active on initial load.
    """
    db = SessionLocal()
    try:
        # Re-create all tables according to schema
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

        now = datetime.now(timezone.utc)

        # 1. Create Users (User ID 1 = Default logged-in user)
        from app.core.security import hash_password
        default_pw = hash_password("password123")

        users = [
            User(id=1, email="sanyog@example.com", display_name="Sanyog Sethi", password_hash=default_pw, avatar_url=None, timezone="UTC"),
            User(id=2, email="alice@example.com", display_name="Alice Smith", password_hash=default_pw, avatar_url=None, timezone="UTC"),
            User(id=3, email="bob@example.com", display_name="Bob Johnson", password_hash=default_pw, avatar_url=None, timezone="UTC"),
            User(id=4, email="charlie@example.com", display_name="Charlie Lee", password_hash=default_pw, avatar_url=None, timezone="UTC"),
            User(id=5, email="diana@example.com", display_name="Diana Prince", password_hash=default_pw, avatar_url=None, timezone="UTC"),
        ]
        db.add_all(users)
        db.commit()

        # 2. Upcoming Scheduled Meetings (Host = User 1)
        upcoming_meetings = [
            Meeting(
                host_id=1,
                meeting_code="9876543210",
                title="Product Strategy & Architecture Review",
                description="Review roadmap and scalable microservices architecture for Q4.",
                type="scheduled",
                scheduled_start=(now + timedelta(days=1, hours=2)).isoformat(),
                duration_minutes=45,
                status="scheduled"
            ),
            Meeting(
                host_id=1,
                meeting_code="8765432109",
                title="Weekly Engineering Sync",
                description="Frontend and backend team status updates and sprint planning.",
                type="scheduled",
                scheduled_start=(now + timedelta(days=2, hours=4)).isoformat(),
                duration_minutes=30,
                status="scheduled"
            ),
            Meeting(
                host_id=1,
                meeting_code="7654321098",
                title="Design System & UX Alignment",
                description="Review Zoom UI component library and responsive breakpoints.",
                type="scheduled",
                scheduled_start=(now + timedelta(days=3, hours=1)).isoformat(),
                duration_minutes=60,
                status="scheduled"
            ),
        ]
        db.add_all(upcoming_meetings)
        db.commit()

        # 3. Ended Past Meetings & Sessions (4 ended sessions)
        past_meetings_data = [
            ("1112223334", "Frontend Code Review", 4, timedelta(days=5)),
            ("2223334445", "API Design Brainstorming", 3, timedelta(days=4)),
            ("3334445556", "Database Performance Tuning", 2, timedelta(days=3)),
            ("4445556667", "Security & Auth Audit", 1, timedelta(days=2)),
        ]

        for code, title, duration_hrs, ago in past_meetings_data:
            start_time = now - ago
            end_time = start_time + timedelta(hours=duration_hrs)

            m = Meeting(
                host_id=1,
                meeting_code=code,
                title=title,
                description=f"Discussion on {title.lower()}.",
                type="scheduled",
                scheduled_start=start_time.isoformat(),
                duration_minutes=duration_hrs * 60,
                status="ended"
            )
            db.add(m)
            db.flush()

            sess = MeetingSession(
                meeting_id=m.id,
                started_at=start_time.isoformat(),
                ended_at=end_time.isoformat()
            )
            db.add(sess)
            db.flush()

            # Host participant (User 1)
            p_host = Participant(
                session_id=sess.id,
                user_id=1,
                display_name="Sanyog Sethi",
                role="host",
                status="left",
                is_muted=0,
                joined_at=start_time.isoformat(),
                left_at=end_time.isoformat()
            )
            # Guest participants
            p_guest1 = Participant(
                session_id=sess.id,
                user_id=2,
                display_name="Alice Smith",
                role="participant",
                status="left",
                is_muted=1,
                joined_at=(start_time + timedelta(minutes=2)).isoformat(),
                left_at=end_time.isoformat()
            )
            p_guest2 = Participant(
                session_id=sess.id,
                user_id=3,
                display_name="Bob Johnson",
                role="participant",
                status="left",
                is_muted=0,
                joined_at=(start_time + timedelta(minutes=5)).isoformat(),
                left_at=(end_time - timedelta(minutes=5)).isoformat()
            )
            db.add_all([p_host, p_guest1, p_guest2])

        # 4. LIVE Session (Meeting status = 'live', session ended_at = NULL)
        # Default user (User 1) HAS LEFT so the Rejoin button is active, while User 2 is still joined!
        live_meeting = Meeting(
            host_id=1,
            meeting_code="5556667778",
            title="All-Hands Townhall Sync (LIVE)",
            description="Company wide townhall meeting currently in progress.",
            type="instant",
            scheduled_start=None,
            duration_minutes=None,
            status="live"
        )
        db.add(live_meeting)
        db.flush()

        live_session = MeetingSession(
            meeting_id=live_meeting.id,
            started_at=(now - timedelta(minutes=20)).isoformat(),
            ended_at=None  # SOURCE OF TRUTH: LIVE!
        )
        db.add(live_session)
        db.flush()

        # User 1 joined 20m ago, left 5m ago -> can rejoin!
        p1_left = Participant(
            session_id=live_session.id,
            user_id=1,
            display_name="Sanyog Sethi",
            role="host",
            status="left",
            is_muted=0,
            joined_at=(now - timedelta(minutes=20)).isoformat(),
            left_at=(now - timedelta(minutes=5)).isoformat()
        )
        # User 2 is currently still joined -> keeps session alive!
        p2_joined = Participant(
            session_id=live_session.id,
            user_id=2,
            display_name="Alice Smith",
            role="participant",
            status="joined",
            is_muted=0,
            joined_at=(now - timedelta(minutes=18)).isoformat(),
            left_at=None
        )
        db.add_all([p1_left, p2_joined])

        db.commit()
        print("Database seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
