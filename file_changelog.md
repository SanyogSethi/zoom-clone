# File Changes Log

This file tracks all created and modified files across implementation steps, detailing the exact line ranges created or modified in each step.

## Step 1: Repository & Project Scaffolding
- `README.md` (1-16)
- `.gitignore` (1-32)
- `frontend/package.json` (1-28)
- `frontend/.env.example` (1-2)
- `backend/pyproject.toml` (1-20)
- `backend/requirements.txt` (1-8)
- `backend/.env.example` (1-3)

## Step 2: Database Schema, Models & Seed Script
- `backend/schema.sql` (1-50)
- `backend/app/config.py` (1-12)
- `backend/app/database.py` (1-31)
- `backend/app/models/user.py` (1-18)
- `backend/app/models/meeting.py` (1-31)
- `backend/app/models/meeting_session.py` (1-16)
- `backend/app/models/participant.py` (1-25)
- `backend/app/models/__init__.py` (1-6)
- `backend/scripts/seed.py` (1-186)

## Step 3: Backend Repositories, Services, Routers & Pytest Suite
- `backend/app/core/time.py` (1-9)
- `backend/app/core/meeting_code.py` (1-13)
- `backend/app/dependencies.py` (1-17)
- `backend/app/schemas/user.py` (1-12)
- `backend/app/schemas/meeting.py` (1-47)
- `backend/app/schemas/session.py` (1-25)
- `backend/app/schemas/__init__.py` (1-14)
- `backend/app/repositories/user_repository.py` (1-11)
- `backend/app/repositories/meeting_repository.py` (1-35)
- `backend/app/repositories/session_repository.py` (1-68)
- `backend/app/repositories/participant_repository.py` (1-69)
- `backend/app/repositories/__init__.py` (1-11)
- `backend/app/services/meeting_service.py` (1-174)
- `backend/app/services/session_service.py` (1-229)
- `backend/app/routers/users.py` (1-14)
- `backend/app/routers/meetings.py` (1-74)
- `backend/app/routers/sessions.py` (1-78)
- `backend/app/routers/__init__.py` (1-6)
- `backend/app/main.py` (1-44)
- `backend/tests/conftest.py` (1-46)
- `backend/tests/test_meeting_code.py` (1-12)
- `backend/tests/test_join_validation.py` (1-47)
- `backend/tests/test_recent_rejoin.py` (1-37)
- `backend/tests/test_upcoming.py` (1-34)

## Step 4: Frontend Design Tokens, Layout Shell & API Client
- `frontend/tsconfig.json` (1-28)
- `frontend/next.config.js` (1-9)
- `frontend/postcss.config.js` (1-6)
- `frontend/tailwind.config.ts` (1-50)
- `frontend/src/app/globals.css` (1-60)
- `frontend/src/lib/types.ts` (1-60)
- `frontend/src/lib/format.ts` (1-85)
- `frontend/src/lib/api.ts` (1-95)
- `frontend/src/components/ui/Button.tsx` (1-50)
- `frontend/src/components/ui/Modal.tsx` (1-60)
- `frontend/src/components/ui/Input.tsx` (1-25)
- `frontend/src/components/ui/Avatar.tsx` (1-45)
- `frontend/src/components/ui/Toast.tsx` (1-35)
- `frontend/src/components/layout/Navbar.tsx` (1-65)
- `frontend/src/components/layout/Sidebar.tsx` (1-35)
- `frontend/src/app/layout.tsx` (1-20)

## Step 5: Dashboard Workflows (Instant, Schedule, Join & Recent/Rejoin)
- `frontend/src/hooks/useMeetings.ts` (1-105)
- `frontend/src/components/dashboard/JoinDialog.tsx` (1-105)
- `frontend/src/components/dashboard/ScheduleModal.tsx` (1-180)
- `frontend/src/app/j/[code]/page.tsx` (1-35)
- `frontend/src/app/page.tsx` (1-240)

## Step 6: Meeting Room UI, Camera & Control Bar
- `frontend/src/hooks/useCamera.ts` (1-65)
- `frontend/src/hooks/useParticipants.ts` (1-35)
- `frontend/src/components/meeting/VideoTile.tsx` (1-55)
- `frontend/src/components/meeting/VideoGrid.tsx` (1-60)
- `frontend/src/components/meeting/LeaveMenu.tsx` (1-55)
- `frontend/src/components/meeting/ControlBar.tsx` (1-105)
- `frontend/src/components/meeting/ParticipantsPanel.tsx` (1-125)
- `frontend/src/app/meeting/[code]/page.tsx` (1-205)

## Step 7: Layout Height Constraints, Fixed Navbar & Host Controls Refinement
- `frontend/src/components/layout/Navbar.tsx` (1-68) - Sticky fixed navbar positioning & vertical alignment
- `frontend/src/app/layout.tsx` (1-22) - Viewport h-full overflow-hidden container bounds
- `frontend/src/components/meeting/VideoTile.tsx` (1-60) - Bound tile & video element height within container without overflow
- `frontend/src/components/meeting/VideoGrid.tsx` (1-65) - Aspect ratio constrained single & grid video scaling
- `frontend/src/app/meeting/[code]/page.tsx` (1-210) - Strict viewport height allocation for meeting bar, video, and controls
- `frontend/src/components/layout/Sidebar.tsx` (1-35) - Mobile responsive navigation hiding
