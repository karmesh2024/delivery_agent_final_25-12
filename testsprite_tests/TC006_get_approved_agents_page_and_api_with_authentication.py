import requests

BASE_URL = "http://localhost:3000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5dGpndWlqcGJhaHJsdHFqZGtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTc2NTE3NiwiZXhwIjoyMDM1MzQxMTc2fQ.sV2yTSWF9J73YpfIAYAFM0lZJrL_R7MMDQtcbOB3bfY"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/json"
}
TIMEOUT = 30


def test_tc006_approved_agents_and_delete_authorization():
    # Test GET /approved-agents page
    resp_page = requests.get(f"{BASE_URL}/approved-agents", headers=HEADERS, timeout=TIMEOUT)
    assert resp_page.status_code == 200, f"Expected 200 for GET /approved-agents, got {resp_page.status_code}"
    # Optionally validate content type and minimal page content
    content_type = resp_page.headers.get("Content-Type", "")
    assert "text/html" in content_type or "application/json" in content_type, "Unexpected Content-Type for /approved-agents page"

    # Test GET /api/agents?filter=approved
    resp_agents = requests.get(f"{BASE_URL}/api/agents", headers=HEADERS, params={"filter": "approved"}, timeout=TIMEOUT)
    assert resp_agents.status_code == 200, f"Expected 200 for GET /api/agents?filter=approved, got {resp_agents.status_code}"
    agents_data = resp_agents.json()
    assert isinstance(agents_data, list), "Expected JSON response to be a list of approved agents"
    # Optionally check each agent has approved status or relevant fields for approved agents
    for agent in agents_data:
        # be lenient on structure, assert presence of id and some approval indication
        assert "id" in agent or "_id" in agent, "Agent record missing id"
        # 'status' or 'approved' field might exist, check if present
        if "status" in agent:
            assert agent["status"].lower() == "approved", "Agent status not 'approved'"
        elif "approved" in agent:
            assert agent["approved"] is True, "Agent not marked as approved"

    # For DELETE /api/agents/{id}, first get any agent id from agents_data or create a resource
    if agents_data:
        agent_id = None
        # Prefer an agent for which delete may be attempted - may select first
        agent = agents_data[0]
        agent_id = agent.get("id") or agent.get("_id")
    else:
        # If no approved agents, attempt to create one then delete
        # We don't have POST endpoint info for agent creation - so skip create and skip DELETE test in that case
        agent_id = None

    if agent_id:
        # Attempt DELETE with auth but insufficient role - expect 403 Forbidden
        resp_delete = requests.delete(f"{BASE_URL}/api/agents/{agent_id}", headers=HEADERS, timeout=TIMEOUT)
        assert resp_delete.status_code == 403, f"Expected 403 Forbidden for DELETE /api/agents/{agent_id} with insufficient role, got {resp_delete.status_code}"
    else:
        # Could not test DELETE due to no agent id available
        # Just pass this part silently or log
        pass


test_tc006_approved_agents_and_delete_authorization()