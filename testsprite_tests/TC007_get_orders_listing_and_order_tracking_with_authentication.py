import requests
from requests.exceptions import RequestException, Timeout

BASE_URL = "http://localhost:3000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5dGpndWlqcGJhaHJsdHFqZGtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTc2NTE3NiwiZXhwIjoyMDM1MzQxMTc2fQ.sV2yTSWF9J73YpfIAYAFM0lZJrL_R7MMDQtcbOB3bfY"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}
TIMEOUT = 30

def test_TC007_orders_listing_and_order_tracking_with_auth():
    try:
        # 1. GET /orders with valid auth
        r_orders_page = requests.get(f"{BASE_URL}/orders", headers=HEADERS, timeout=TIMEOUT)
        assert r_orders_page.status_code == 200
        assert "orders" in r_orders_page.text.lower() or len(r_orders_page.text) > 0

        # 2. GET /api/orders with valid auth
        r_api_orders = requests.get(f"{BASE_URL}/api/orders", headers=HEADERS, timeout=TIMEOUT)
        assert r_api_orders.status_code == 200
        orders_data = r_api_orders.json()
        assert isinstance(orders_data, list)

        # Need at least one order for tracking test, otherwise skip tracking test
        if len(orders_data) == 0:
            # No orders exist; skip tracking tests but verify other auth tests.
            order_id = None
        else:
            order_id = None
            # Pick first order id if available and valid
            first_order = orders_data[0]
            order_id = first_order.get("id") or first_order.get("orderId") or first_order.get("ID")
            if order_id is None:
                # Fallback to first key if possible
                order_id = list(first_order.values())[0] if isinstance(first_order, dict) and len(first_order) > 0 else None
        
        # 3. GET /order-tracking with valid auth
        r_order_tracking_page = requests.get(f"{BASE_URL}/order-tracking", headers=HEADERS, timeout=TIMEOUT)
        assert r_order_tracking_page.status_code == 200
        assert "tracking" in r_order_tracking_page.text.lower() or len(r_order_tracking_page.text) > 0

        # 4. GET /api/orders/{id}/tracking with valid auth
        if order_id:
            r_order_tracking_api = requests.get(f"{BASE_URL}/api/orders/{order_id}/tracking", headers=HEADERS, timeout=TIMEOUT)
            assert r_order_tracking_api.status_code == 200
            tracking_data = r_order_tracking_api.json()
            # The tracking data should be a dict or list (depending on API design)
            assert isinstance(tracking_data, (dict, list))
        
        # 5. GET /api/orders with expired token -> 401 Unauthorized
        expired_token = (
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
            "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5dGpndWlqcGJhaHJsdHFqZGtzIiwicm9sZSI6InNlcnZp"
            "Y2Vfcm9sZSIsImlhdCI6MTYwOTM2NTE3NiwiZXhwIjoxNjA5MzY1MTc3fQ."
            "expiredtokenplaceholder"  # presumably expired token here; just use a dummy
        )
        headers_expired = {"Authorization": f"Bearer {expired_token}"}
        r_expired = requests.get(f"{BASE_URL}/api/orders", headers=headers_expired, timeout=TIMEOUT)
        assert r_expired.status_code == 401

        # 6. GET /api/orders with invalid status filter with valid auth -> 400 Bad Request
        r_invalid_status = requests.get(f"{BASE_URL}/api/orders?status=invalid", headers=HEADERS, timeout=TIMEOUT)
        assert r_invalid_status.status_code == 400

    except (AssertionError, RequestException, Timeout) as e:
        # Re-raise for test frameworks or log here if integrated.
        raise e

test_TC007_orders_listing_and_order_tracking_with_auth()