import requests

BASE_URL = "http://localhost:3000"
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5dGpndWlqcGJhaHJsdHFqZGtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTc2NTE3NiwiZXhwIjoyMDM1MzQxMTc2fQ.sV2yTSWF9J73YpfIAYAFM0lZJrL_R7MMDQtcbOB3bfY"

def test_tc009_zoon_os_ai_assistant_endpoints_auth():
    headers_auth = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    headers_no_auth = {
        "Content-Type": "application/json"
    }
    # 1) POST /api/zoon with valid auth and message
    post_zoon_payload = {
        "message": "Hello AI assistant, please provide latest updates.",
        "context": {}
    }
    try:
        resp = requests.post(f"{BASE_URL}/api/zoon", headers=headers_auth, json=post_zoon_payload, timeout=30)
        assert resp.status_code == 200, f"Expected 200 but got {resp.status_code}"
        json_data = resp.json()
        assert isinstance(json_data, dict), "Response should be a dict"
        # Validate key existence for tool results - flexible since no strict schema detailed
        assert "toolResults" in json_data or "result" in json_data or "message" in json_data, \
            "Response should include tool results or message"
    except requests.RequestException as e:
        assert False, f"Request to POST /api/zoon with auth failed: {e}"

    # 2) POST /api/zoon without auth -> 401 Unauthorized
    try:
        resp = requests.post(f"{BASE_URL}/api/zoon", headers=headers_no_auth, json=post_zoon_payload, timeout=30)
        assert resp.status_code == 401, f"Expected 401 but got {resp.status_code}"
    except requests.RequestException as e:
        assert False, f"Request to POST /api/zoon without auth failed: {e}"

    # 3) GET /api/zoon/discovery/pulse with valid CRON_SECRET
    cron_secret = "valid_cron_secret_placeholder"
    headers_with_cron_secret = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "CRON_SECRET": cron_secret
    }
    try:
        resp = requests.get(f"{BASE_URL}/api/zoon/discovery/pulse", headers=headers_with_cron_secret, timeout=30)
        assert resp.status_code == 200, f"Expected 200 but got {resp.status_code}"
        json_data = resp.json()
        assert isinstance(json_data, dict) or isinstance(json_data, list), "Discovery pulse response should be dict or list"
        # Minimal validation: presence of some discovery insights
        assert len(json_data) > 0 or (isinstance(json_data, dict) and json_data != {}), "Discovery insights should not be empty"
    except requests.RequestException as e:
        assert False, f"Request to GET /api/zoon/discovery/pulse with CRON_SECRET failed: {e}"

    # 4) GET /api/zoon/discovery/pulse without CRON_SECRET (or invalid) -> 403 Forbidden
    headers_without_cron_secret = {
        "Authorization": f"Bearer {AUTH_TOKEN}"
    }
    try:
        resp = requests.get(f"{BASE_URL}/api/zoon/discovery/pulse", headers=headers_without_cron_secret, timeout=30)
        assert resp.status_code == 403, f"Expected 403 but got {resp.status_code}"
    except requests.RequestException as e:
        assert False, f"Request to GET /api/zoon/discovery/pulse without CRON_SECRET failed: {e}"

test_tc009_zoon_os_ai_assistant_endpoints_auth()