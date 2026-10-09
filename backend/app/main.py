from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import users_router, meetings_router, sessions_router, auth_router
from scripts.seed import seed_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler. Automatically seeds SQLite database on app startup.
    """
    print("Application starting up: running seed script...")
    seed_data()
    yield
    print("Application shutting down...")

app = FastAPI(
    title="Zoom Clone ScalerAI Assessment Backend",
    version="0.1.0",
    lifespan=lifespan
)

# Configure CORS restricted to configured FRONTEND_URL
origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(meetings_router)
app.include_router(sessions_router)

@app.get("/")
def root():
    return {"message": "Zoom Clone API Service is running", "author": "sanyog-sethi"}
