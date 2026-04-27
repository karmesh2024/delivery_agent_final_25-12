import requests

BASE_URL = "http://localhost:3000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5dGpndWlqcGJhaHJsdHFqZGtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTc2NTE3NiwiZXhwIjoyMDM1MzQxMTc2fQ.sV2yTSWF9J73YpfIAYAFM0lZJrL_R7MMDQtcbOB3bfY"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "text/html,application/json",
    "Content-Type": "application/json",
    "Cookie": "session=mock-session-cookie"
}

REGISTERED_EMAIL = "registered@example.com"

def test_get_and_post_forgot_password():
    try:
        # Step 1: GET /forgot-password - Expect 200 with password reset form page
        get_url = f"{BASE_URL}/forgot-password"
        get_response = requests.get(get_url, headers=HEADERS, timeout=30)
        assert get_response.status_code == 200, f"Expected 200 for GET /forgot-password, got {get_response.status_code}"
        assert "form" in get_response.text.lower(), "Response does not contain a form element."

        # Step 2: POST /forgot-password with registered email - Expect 200 and confirmation message
        post_url = f"{BASE_URL}/forgot-password"
        payload = {"email": REGISTERED_EMAIL}
        post_response = requests.post(post_url, headers=HEADERS, json=payload, timeout=30)
        assert post_response.status_code == 200, f"Expected 200 for POST /forgot-password, got {post_response.status_code}"

        json_resp = None
        try:
            json_resp = post_response.json()
        except Exception:
            pass

        # Password reset email sent confirmation can be in JSON or HTML text
        if json_resp:
            assert any(k in json_resp for k in ("message", "status", "detail")), f"Response JSON missing expected keys: {json_resp}"
            # Optionally check message content indicates reset email sent
            msg_values = [str(json_resp.get(k, "")).lower() for k in ("message", "status", "detail")]
            assert any("reset" in v or "sent" in v or "email" in v for v in msg_values), "Response JSON does not confirm password reset email sent."
        else:
            text = post_response.text.lower()
            assert "reset" in text or "email" in text or "sent" in text, "Response text does not confirm password reset email sent."

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_and_post_forgot_password()