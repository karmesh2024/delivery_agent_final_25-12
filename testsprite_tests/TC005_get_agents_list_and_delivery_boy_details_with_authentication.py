import requests

BASE_URL = "http://localhost:3000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5dGpndWlqcGJhaHJsdHFqZGtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTc2NTE3NiwiZXhwIjoyMDM1MzQxMTc2fQ.sV2yTSWF9J73YpfIAYAFM0lZJrL_R7MMDQtcbOB3bfY"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/json"
}

def test_get_agents_and_delivery_boy_details():
    timeout = 30

    # GET /agents with auth
    url_agents_page = f"{BASE_URL}/agents"
    resp_agents_page = requests.get(url_agents_page, headers=HEADERS, timeout=timeout)
    assert resp_agents_page.status_code == 200, f"Expected 200 OK for /agents, got {resp_agents_page.status_code}"

    # GET /api/agents with auth
    url_api_agents = f"{BASE_URL}/api/agents"
    resp_api_agents = requests.get(url_api_agents, headers=HEADERS, timeout=timeout)
    assert resp_api_agents.status_code == 200, f"Expected 200 OK for /api/agents, got {resp_api_agents.status_code}"
    try:
        agents = resp_api_agents.json()
    except Exception as e:
        assert False, f"Response /api/agents is not valid JSON: {e}"
    assert isinstance(agents, list), f"/api/agents response expected a list, got {type(agents)}"
    assert len(agents) > 0, "Expected at least one agent in /api/agents response"

    # Pick a valid agent ID from the agents list for delivery boy details test
    valid_agent_id = None
    if agents:
        first_agent = agents[0]
        # Agent object expected to have an 'id' field (common pattern)
        valid_agent_id = first_agent.get("id")
    assert valid_agent_id, "No valid agent ID found in /api/agents response to test delivery boy details"

    # GET /api/delivery-boys?id={validId} with auth (expect 200)
    url_delivery_boy_valid = f"{BASE_URL}/api/delivery-boys"
    params_valid = {"id": valid_agent_id}
    resp_delivery_boy_valid = requests.get(url_delivery_boy_valid, headers=HEADERS, params=params_valid, timeout=timeout)
    assert resp_delivery_boy_valid.status_code == 200, f"Expected 200 OK for valid delivery boy id, got {resp_delivery_boy_valid.status_code}"
    try:
        delivery_boys_valid = resp_delivery_boy_valid.json()
    except Exception as e:
        assert False, f"Response /api/delivery-boys with valid id is not valid JSON: {e}"
    # The spec says 200 delivery boy details, could be list or single object
    # Check it's dict or list and not empty
    assert (isinstance(delivery_boys_valid, dict) or isinstance(delivery_boys_valid, list)), \
        f"Expected JSON object or list for delivery boy details, got {type(delivery_boys_valid)}"
    if isinstance(delivery_boys_valid, list):
        assert len(delivery_boys_valid) > 0, "Expected non-empty list for delivery boy details with valid id"

    # GET /api/delivery-boys?id=invalid with auth (expect 404)
    params_invalid = {"id": "invalid"}
    resp_delivery_boy_invalid = requests.get(url_delivery_boy_valid, headers=HEADERS, params=params_invalid, timeout=timeout)
    assert resp_delivery_boy_invalid.status_code == 404, f"Expected 404 Not Found for invalid delivery boy id, got {resp_delivery_boy_invalid.status_code}"

test_get_agents_and_delivery_boy_details()