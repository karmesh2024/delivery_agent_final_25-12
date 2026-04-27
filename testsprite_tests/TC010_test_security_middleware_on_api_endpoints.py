import requests
import time

BASE_URL = "http://localhost:3000"
HEADERS_AUTH = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5dGpndWlqcGJhaHJsdHFqZGtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTc2NTE3NiwiZXhwIjoyMDM1MzQxMTc2fQ.sV2yTSWF9J73YpfIAYAFM0lZJrL_R7MMDQtcbOB3bfY"
}
TIMEOUT = 30

def test_security_middleware_on_api_endpoints():
    # List some representative /api/ endpoints to test
    api_endpoints = [
        "/api/agents",
        "/api/delivery-boys",
        "/api/orders",
        "/api/warehouse",
        "/api/admin/dashboard"  # Based on PRD mentioning this endpoint for auth testing
    ]

    # 1. Test unauthorized access (no token) with GET
    for endpoint in api_endpoints:
        url = BASE_URL + endpoint
        try:
            response = requests.get(url, timeout=TIMEOUT)
            assert response.status_code == 401, f"Expected 401 Unauthorized for no auth at {endpoint}, got {response.status_code}"
        except requests.RequestException as e:
            assert False, f"Request failed for no auth test at {endpoint}: {str(e)}"

    # For /api/zoon endpoint, test unauthorized access with POST (no token)
    url_zoon = BASE_URL + "/api/zoon"
    try:
        response = requests.post(url_zoon, json={"message": "test", "context": {}}, timeout=TIMEOUT)
        assert response.status_code == 401, f"Expected 401 Unauthorized for no auth at /api/zoon, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed for no auth test at /api/zoon: {str(e)}"

    # 2. Test unauthorized access with invalid token
    invalid_headers = {"Authorization": "Bearer invalidtoken"}
    for endpoint in api_endpoints:
        url = BASE_URL + endpoint
        try:
            response = requests.get(url, headers=invalid_headers, timeout=TIMEOUT)
            assert response.status_code == 401, f"Expected 401 Unauthorized for invalid token at {endpoint}, got {response.status_code}"
        except requests.RequestException as e:
            assert False, f"Request failed for invalid token test at {endpoint}: {str(e)}"

    # For /api/zoon with invalid token, use POST
    try:
        response = requests.post(url_zoon, headers=invalid_headers, json={"message": "test", "context": {}}, timeout=TIMEOUT)
        assert response.status_code == 401, f"Expected 401 Unauthorized for invalid token at /api/zoon, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed for invalid token test at /api/zoon: {str(e)}"

    # 3. Test authorized access with valid token (expect NOT 401, minimal check)
    for endpoint in api_endpoints:
        url = BASE_URL + endpoint
        try:
            response = requests.get(url, headers=HEADERS_AUTH, timeout=TIMEOUT)
            # Accept 200, 403, 404 for valid auth depending on endpoint permissions or resource existence
            assert response.status_code in (200, 403, 404), f"Unexpected status {response.status_code} for valid token at {endpoint}"
        except requests.RequestException as e:
            assert False, f"Request failed for valid token test at {endpoint}: {str(e)}"

    # For /api/zoon use POST with valid token
    try:
        response = requests.post(url_zoon, headers=HEADERS_AUTH, json={"message": "test", "context": {}}, timeout=TIMEOUT)
        assert response.status_code in (200, 403, 404), f"Unexpected status {response.status_code} for valid token at /api/zoon"
    except requests.RequestException as e:
        assert False, f"Request failed for valid token test at /api/zoon: {str(e)}"

    # 4. Test rate limiting: send > 100 requests quickly to one endpoint, expect 429 at some point
    test_endpoint = BASE_URL + "/api/agents"
    success_count = 0
    rate_limited = False
    for i in range(110):
        try:
            response = requests.get(test_endpoint, headers=HEADERS_AUTH, timeout=TIMEOUT)
            if response.status_code == 429:
                rate_limited = True
                break
            elif response.status_code == 200:
                success_count += 1
            else:
                # Accept 403 or other responses in case RBAC or resource issues
                pass
        except requests.RequestException as e:
            assert False, f"Request failed during rate limiting test: {str(e)}"
        # No sleep to simulate rapid calls

    assert rate_limited, f"Rate limiting not triggered after 110 rapid requests, success_count={success_count}"

    # 5. Verify audit logging and suspicious activity detection indirectly by triggering 401 and 403

    # Trigger 403 Forbidden on an endpoint that requires higher role:
    # Using DELETE /api/agents/{id} with valid token but insufficient role
    # Since we do not have an ID or create resource, try a made-up id and expect 403 or 404
    # According to PRD: DELETE /api/agents/{id} with auth but insufficient role -> 403 Forbidden

    headers = HEADERS_AUTH.copy()
    agent_id = "test-agent-id"
    url_delete = f"{BASE_URL}/api/agents/{agent_id}"
    try:
        response = requests.delete(url_delete, headers=headers, timeout=TIMEOUT)
        # Should be either 403 Forbidden or 404 Not Found (if agent doesn't exist)
        assert response.status_code in (403, 404), f"Expected 403 or 404 for DELETE on {url_delete}, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed for DELETE on {url_delete}: {str(e)}"

    # Trigger 401 with expired token (simulate invalid token with expired timestamp)
    expired_token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsImV4cCI6MTYwMDAwMDAwMH0.InvalidSignature"
    headers_expired = {"Authorization": expired_token}
    try:
        response = requests.get(f"{BASE_URL}/api/agents", headers=headers_expired, timeout=TIMEOUT)
        assert response.status_code == 401, f"Expected 401 Unauthorized for expired token, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed for expired token test: {str(e)}"

test_security_middleware_on_api_endpoints()