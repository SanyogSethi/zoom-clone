# zoom-clone-scalerAI-assessment

**Author: sanyog-sethi**

A full-stack Zoom web app clone built for the ScalerAI SDE assessment. 

## Overview
This application replicates Zoom's core web user experience, including:
- **Landing Dashboard**: Instant meeting creation, Join by ID / invite link, Schedule meeting form, and live clock card.
- **Meeting Management**: Upcoming meetings listing and Recent meetings list with real-time **Rejoin** capability for live sessions.
- **Meeting Room**: Interactive dark-mode room featuring real camera preview (`getUserMedia`), participant grid, bottom control bar, leave/end popover, and slide-over participants panel.

## Tech Stack
- **Frontend**: Next.js (App Router, TypeScript, Tailwind CSS)
- **Backend**: Python, FastAPI, SQLAlchemy 2.0, Pydantic v2, Uvicorn
- **Database**: SQLite with `PRAGMA foreign_keys = ON`
