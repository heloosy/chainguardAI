import unittest
import os
import sys

# Ensure backend directory is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # Ensure all models are loaded into Base metadata
from app.database import Base, get_db
from app.main import app

# StaticPool ensures that all connections share the exact same in-memory database instance
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

class TestChainGuardBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=engine)

    def test_01_health_check(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["version"], "1.0.0")

        api_res = self.client.get("/api/health")
        self.assertEqual(api_res.status_code, 200)
        self.assertEqual(api_res.json()["status"], "healthy")

    def test_02_overview_empty_state(self):
        res = self.client.get("/api/overview")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertFalse(data["metrics"]["has_connected_data"])
        self.assertIsNone(data["metrics"]["active_disruptions"])
        self.assertIsNone(data["metrics"]["at_risk_suppliers"])
        self.assertEqual(data["metrics"]["data_connection_health"], "AWAITING_DATA")
        self.assertEqual(len(data["recent_alerts"]), 0)

    def test_03_seed_fixtures_and_verify_entities(self):
        seed_res = self.client.post("/api/data/fixtures/seed")
        self.assertEqual(seed_res.status_code, 200)

        status_res = self.client.get("/api/data/status")
        self.assertEqual(status_res.status_code, 200)
        status_data = status_res.json()
        self.assertTrue(status_data["is_fixtures_loaded"])
        self.assertGreaterEqual(status_data["suppliers_count"], 5)
        self.assertGreaterEqual(status_data["inventory_count"], 5)
        self.assertGreaterEqual(status_data["purchase_orders_count"], 4)
        self.assertGreaterEqual(status_data["shipments_count"], 3)
        self.assertGreaterEqual(status_data["disruptions_count"], 2)
        self.assertGreaterEqual(status_data["recovery_plans_count"], 2)
        self.assertGreaterEqual(status_data["approvals_pending_count"], 1)

    def test_04_overview_with_fixtures(self):
        res = self.client.get("/api/overview")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["metrics"]["has_connected_data"])
        self.assertEqual(data["metrics"]["data_mode"], "FIXTURES_LOADED")
        self.assertGreaterEqual(data["metrics"]["active_disruptions"], 2)
        self.assertGreaterEqual(data["metrics"]["at_risk_suppliers"], 2)
        self.assertGreaterEqual(data["metrics"]["inventory_at_risk_count"], 2)
        self.assertGreaterEqual(data["metrics"]["delayed_shipments"], 2)
        self.assertGreaterEqual(len(data["recent_alerts"]), 2)
        self.assertGreaterEqual(len(data["supply_chain_risk_overview"]), 3)

    def test_05_suppliers_endpoints(self):
        res = self.client.get("/api/suppliers")
        self.assertEqual(res.status_code, 200)
        suppliers = res.json()
        self.assertGreaterEqual(len(suppliers), 5)

        first_id = suppliers[0]["id"]
        detail_res = self.client.get(f"/api/suppliers/{first_id}")
        self.assertEqual(detail_res.status_code, 200)
        detail = detail_res.json()
        self.assertIn("supplier", detail)
        self.assertIn("linked_inventory", detail)
        self.assertIn("linked_purchase_orders", detail)

    def test_06_inventory_endpoints(self):
        res = self.client.get("/api/inventory")
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertGreaterEqual(len(items), 5)

        first_id = items[0]["id"]
        detail_res = self.client.get(f"/api/inventory/{first_id}")
        self.assertEqual(detail_res.status_code, 200)
        detail = detail_res.json()
        self.assertIn("item", detail)

    def test_07_purchase_orders_endpoints(self):
        res = self.client.get("/api/purchase-orders")
        self.assertEqual(res.status_code, 200)
        orders = res.json()
        self.assertGreaterEqual(len(orders), 4)

        first_id = orders[0]["id"]
        detail_res = self.client.get(f"/api/purchase-orders/{first_id}")
        self.assertEqual(detail_res.status_code, 200)
        detail = detail_res.json()
        self.assertIn("order", detail)
        self.assertIn("shipments", detail)

    def test_08_shipments_endpoints(self):
        res = self.client.get("/api/shipments")
        self.assertEqual(res.status_code, 200)
        shipments = res.json()
        self.assertGreaterEqual(len(shipments), 3)

        first_id = shipments[0]["id"]
        detail_res = self.client.get(f"/api/shipments/{first_id}")
        self.assertEqual(detail_res.status_code, 200)
        detail = detail_res.json()
        self.assertIn("shipment", detail)

    def test_09_disruptions_endpoints(self):
        res = self.client.get("/api/disruptions")
        self.assertEqual(res.status_code, 200)
        disruptions = res.json()
        self.assertGreaterEqual(len(disruptions), 2)

        first_id = disruptions[0]["id"]
        detail_res = self.client.get(f"/api/disruptions/{first_id}")
        self.assertEqual(detail_res.status_code, 200)
        detail = detail_res.json()
        self.assertIn("disruption", detail)
        self.assertIn("recovery_plans", detail)

    def test_10_recovery_plans_and_approvals(self):
        plans_res = self.client.get("/api/recovery-plans")
        self.assertEqual(plans_res.status_code, 200)
        plans = plans_res.json()
        self.assertGreaterEqual(len(plans), 2)

        approvals_res = self.client.get("/api/approvals")
        self.assertEqual(approvals_res.status_code, 200)
        approvals = approvals_res.json()
        self.assertGreaterEqual(len(approvals), 1)

        first_app_id = approvals[0]["id"]
        action_res = self.client.post(
            f"/api/approvals/{first_app_id}/action",
            json={
                "action": "APPROVE",
                "approver": "Dr. Sarah Chen (VP Supply Operations)",
                "action_notes": "Emergency air freight approved under quarterly resilience budget."
            }
        )
        self.assertEqual(action_res.status_code, 200)
        action_data = action_res.json()
        self.assertEqual(action_data["status"], "APPROVED")
        self.assertEqual(action_data["approver"], "Dr. Sarah Chen (VP Supply Operations)")

    def test_11_connector_honest_status(self):
        integrations_res = self.client.get("/api/integrations")
        self.assertEqual(integrations_res.status_code, 200)
        connectors = integrations_res.json()
        self.assertGreaterEqual(len(connectors), 4)

        test_res = self.client.post("/api/integrations/conn-sap-s4hana/test")
        self.assertEqual(test_res.status_code, 200)
        res_data = test_res.json()
        self.assertFalse(res_data["success"])
        self.assertEqual(res_data["status"], "DISCONNECTED")

    def test_12_clear_data_to_empty(self):
        clear_res = self.client.post("/api/data/fixtures/clear")
        self.assertEqual(clear_res.status_code, 200)

        status_res = self.client.get("/api/data/status")
        self.assertEqual(status_res.status_code, 200)
        self.assertEqual(status_res.json()["suppliers_count"], 0)
        self.assertFalse(status_res.json()["is_fixtures_loaded"])

if __name__ == "__main__":
    unittest.main()
