import pytest
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token

def test_password_hashing_and_verification():
    raw_password = "SecretPassword123!"
    hashed = hash_password(raw_password)
    
    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_generation_and_decoding():
    user_id = 42
    token = create_access_token(user_id)
    decoded_id = decode_access_token(token)

    assert decoded_id == user_id

def test_auth_endpoints(client):
    # Test User Registration
    reg_response = client.post("/api/auth/register", json={
        "email": "newuser@example.com",
        "display_name": "New User",
        "password": "mysecretpassword"
    })
    assert reg_response.status_code == 201
    data = reg_response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"

    # Test Login with correct credentials
    login_response = client.post("/api/auth/login", json={
        "email": "newuser@example.com",
        "password": "mysecretpassword"
    })
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()

    # Test Login with invalid password
    bad_login = client.post("/api/auth/login", json={
        "email": "newuser@example.com",
        "password": "invalidpassword"
    })
    assert bad_login.status_code == 401

    # Test Google dev login
    google_res = client.post("/api/auth/google", json={
        "credential": "dev_alice@example.com"
    })
    assert google_res.status_code == 200
    assert google_res.json()["user"]["email"] == "alice@example.com"
