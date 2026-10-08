import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

import app.database as database_module
from app.database import Base, get_db
from app.main import app
from app.models.user import User

# In-memory SQLite with StaticPool maintains one shared database connection across all threads
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session(monkeypatch):
    monkeypatch.setattr(database_module, "engine", engine)
    monkeypatch.setattr(database_module, "SessionLocal", TestingSessionLocal)

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    default_user = User(
        id=1,
        email="test_user@example.com",
        display_name="Test Sanyog",
        timezone="UTC"
    )
    session.add(default_user)
    session.commit()

    try:
        yield session
    finally:
        session.close()

@pytest.fixture(scope="function")
def client(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
