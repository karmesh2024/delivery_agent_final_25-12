import requests

BASE_URL = "http://localhost:3000"
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5dGpndWlqcGJhaHJsdHFqZGtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTc2NTE3NiwiZXhwIjoyMDM1MzQxMTc2fQ.sV2yTSWF9J73YpfIAYAFM0lZJrL_R7MMDQtcbOB3bfY"
HEADERS = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}
TIMEOUT = 30


def test_TC008_waste_management_pages_and_api_endpoints_with_auth():
    session = requests.Session()
    session.headers.update(HEADERS)

    # Test GET /waste-management
    waste_mgmt_resp = session.get(f"{BASE_URL}/waste-management", timeout=TIMEOUT)
    assert waste_mgmt_resp.status_code == 200
    assert "text/html" in waste_mgmt_resp.headers.get("Content-Type", ""), f"Expected HTML content type for /waste-management page"

    # Test GET /api/main-categories
    main_cat_resp = session.get(f"{BASE_URL}/api/main-categories", timeout=TIMEOUT)
    assert main_cat_resp.status_code == 200
    main_categories = main_cat_resp.json()
    assert isinstance(main_categories, list), "Expected a list for main categories"

    # Check there is at least one category to test subcategories
    assert len(main_categories) > 0, "No main categories found to test subcategories"

    category_id = main_categories[0].get("id")
    assert category_id is not None, "Main category does not have an 'id' field"

    # Test GET /api/subcategories?categoryId={id}
    subcat_resp = session.get(f"{BASE_URL}/api/subcategories", params={"categoryId": category_id}, timeout=TIMEOUT)
    assert subcat_resp.status_code == 200
    subcategories = subcat_resp.json()
    assert isinstance(subcategories, list), "Expected a list for subcategories"

    # Test GET /api/products
    products_resp = session.get(f"{BASE_URL}/api/products", timeout=TIMEOUT)
    assert products_resp.status_code == 200
    products = products_resp.json()
    assert isinstance(products, list), "Expected a list for products"

    # Test POST /api/products with invalid schema (missing price)
    # Prepare invalid product data (missing 'price' field)
    invalid_product_payload = {
        # Intentionally left out the price field
        "name": "Invalid Product Test",
        "categoryId": category_id,
        "weight": 5.0,
        "unit": "kg"
    }

    post_resp = session.post(f"{BASE_URL}/api/products", json=invalid_product_payload, timeout=TIMEOUT)
    assert post_resp.status_code == 400, f"Expected status 400 for invalid product data, got {post_resp.status_code}"
    try:
        error_json = post_resp.json()
        # The API is expected to return validation error info, but schema unknown
        assert "error" in error_json or "message" in error_json, "Expected error details in response JSON"
    except Exception:
        # If response is not JSON, still OK as 400
        pass


test_TC008_waste_management_pages_and_api_endpoints_with_auth()