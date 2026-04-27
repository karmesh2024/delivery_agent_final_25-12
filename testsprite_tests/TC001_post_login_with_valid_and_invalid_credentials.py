import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_post_login_with_valid_and_invalid_credentials():
    login_url = f"{BASE_URL}/login"
    session = requests.Session()

    # Valid credentials (Assuming valid test credentials)
    valid_payload = {
        "email": "admin@example.com",
        "password": "correct_password"
    }

    try:
        # POST /login with valid credentials
        valid_resp = session.post(login_url, json=valid_payload, timeout=TIMEOUT)
        assert valid_resp.status_code == 200, f"Expected 200 for valid login, got {valid_resp.status_code}"

        # Auth cookie should be set
        cookie_jar = session.cookies
        assert len(cookie_jar) > 0, "Auth cookie not found in response cookies"

        # Follow redirect to dashboard
        dashboard_url = f"{BASE_URL}/"
        dashboard_resp = session.get(dashboard_url, timeout=TIMEOUT)
        assert dashboard_resp.status_code == 200, f"Expected 200 on dashboard access after login, got {dashboard_resp.status_code}"
        # Additional check for dashboard content presence (optional)
        assert "dashboard" in dashboard_resp.text.lower() or "kpi" in dashboard_resp.text.lower(), "Dashboard content not found in response"

    finally:
        session.close()

    # Invalid credentials
    invalid_payload = {
        "email": "admin@example.com",
        "password": "wrong_password"
    }

    invalid_resp = requests.post(login_url, json=invalid_payload, timeout=TIMEOUT)
    assert invalid_resp.status_code == 401, f"Expected 401 for invalid login, got {invalid_resp.status_code}"
    # Optional: Check error message in response
    if invalid_resp.headers.get("Content-Type", "").lower().startswith("application/json"):
        json_data = invalid_resp.json()
        assert ("error" in json_data and ("invalid" in json_data["error"].lower() or "unauthorized" in json_data["error"].lower())) or ("message" in json_data and "invalid" in json_data["message"].lower()), "Expected invalid credentials error message in response"

test_post_login_with_valid_and_invalid_credentials()
