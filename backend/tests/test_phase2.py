import unittest
import os
import sys

# Ensure backend directory is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models
from app.database import Base, get_db
from app.main import app
from app.seed import seed_database_phase2

# In-memory database with StaticPool for isolated unit testing
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

class TestChainGuardPhase2(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=test_engine)
        with TestingSessionLocal() as session:
            seed_database_phase2(session, include_fixtures=True)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=test_engine)

    def test_01_health_and_status(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["version"], "2.0.0")

        # Detailed status check
        status_res = self.client.get("/api/status")
        self.assertEqual(status_res.status_code, 200)
        s_data = status_res.json()
        self.assertTrue(s_data["persistent_storage_operational"])
        self.assertTrue(s_data["auth_configured"])
        self.assertFalse(s_data["postgres_configured"]) # Accurately reports PostgreSQL not configured
        self.assertIn("SUPABASE_DATABASE_URL", s_data["missing_credentials"][0])
        self.assertGreaterEqual(s_data["records_count"]["suppliers"], 5)
        self.assertGreaterEqual(s_data["records_count"]["products"], 5)
        self.assertGreaterEqual(s_data["records_count"]["purchase_orders"], 4)

    def test_02_authentication_and_jwt(self):
        # Invalid password
        bad_res = self.client.post(
            "/api/auth/login",
            json={"email": "admin@chainguard.ai", "password": "WrongPassword!"}
        )
        self.assertEqual(bad_res.status_code, 401)

        # Valid login
        login_res = self.client.post(
            "/api/auth/login",
            json={"email": "admin@chainguard.ai", "password": "AdminPass123!"}
        )
        self.assertEqual(login_res.status_code, 200)
        auth_data = login_res.json()
        self.assertIn("access_token", auth_data)
        self.assertEqual(auth_data["user"]["role"], "ADMIN")
        token = auth_data["access_token"]

        # Profile check /api/auth/me
        me_res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["email"], "admin@chainguard.ai")

    def test_03_unauthorized_access_protection(self):
        # Protected mutation without token
        unauth_res = self.client.post(
            "/api/suppliers",
            json={
                "supplier_code": "SUP-NEW-99",
                "name": "New Silicon Partner",
                "tier": 2
            }
        )
        self.assertEqual(unauth_res.status_code, 401)

    def test_04_supplier_crud_and_provenance(self):
        # Authenticate as admin
        login = self.client.post("/api/auth/login", json={"email": "admin@chainguard.ai", "password": "AdminPass123!"}).json()
        headers = {"Authorization": f"Bearer {login['access_token']}"}

        # Create
        create_res = self.client.post(
            "/api/suppliers",
            headers=headers,
            json={
                "supplier_code": "SUP-TEST-88",
                "name": "Test Microelectronics GmbH",
                "tier": 2,
                "status": "ACTIVE",
                "risk_score": 18.5,
                "country": "Austria",
                "source_connector": "MANUAL",
                "provenance_status": "VERIFIED"
            }
        )
        self.assertEqual(create_res.status_code, 201)
        supp_id = create_res.json()["id"]
        self.assertEqual(create_res.json()["provenance_status"], "VERIFIED")

        # Update
        update_res = self.client.put(
            f"/api/suppliers/{supp_id}",
            headers=headers,
            json={"risk_score": 22.0, "status": "AT_RISK"}
        )
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.json()["status"], "AT_RISK")

        # Safe delete unreferenced supplier
        del_res = self.client.delete(f"/api/suppliers/{supp_id}", headers=headers)
        self.assertEqual(del_res.status_code, 200)

    def test_05_safe_deletion_blocking(self):
        login = self.client.post("/api/auth/login", json={"email": "admin@chainguard.ai", "password": "AdminPass123!"}).json()
        headers = {"Authorization": f"Bearer {login['access_token']}"}

        # TSMC (id=1) has active POs and products, deleting must fail with 409 Conflict
        del_res = self.client.delete("/api/suppliers/1", headers=headers)
        self.assertEqual(del_res.status_code, 409)
        self.assertIn("Cannot delete supplier", del_res.json()["detail"])

        # Product MCU (id=1) is in inventory, deleting must fail with 409 Conflict
        prod_del_res = self.client.delete("/api/products/1", headers=headers)
        self.assertEqual(prod_del_res.status_code, 409)
        self.assertIn("Cannot delete product", prod_del_res.json()["detail"])

    def test_06_approval_decision_and_audit_trail(self):
        login = self.client.post("/api/auth/login", json={"email": "admin@chainguard.ai", "password": "AdminPass123!"}).json()
        headers = {"Authorization": f"Bearer {login['access_token']}"}

        # List pending approvals
        apps = self.client.get("/api/approvals").json()
        self.assertGreaterEqual(len(apps), 1)
        target_app = apps[0]

        # Execute decision
        decision_res = self.client.post(
            f"/api/approvals/{target_app['id']}/decision",
            headers=headers,
            json={
                "decision": "APPROVE",
                "notes": "Emergency air expedite authorized under quarterly buffer reserves."
            }
        )
        self.assertEqual(decision_res.status_code, 200)
        self.assertEqual(decision_res.json()["status"], "APPROVED")

        # Verify audit log was recorded
        audit_res = self.client.get("/api/audit-logs", headers=headers)
        self.assertEqual(audit_res.status_code, 200)
        logs = audit_res.json()
        approval_logs = [l for l in logs if l["event_type"] == "APPROVE"]
        self.assertGreaterEqual(len(approval_logs), 1)

    def test_07_integration_sync_runs(self):
        login = self.client.post("/api/auth/login", json={"email": "admin@chainguard.ai", "password": "AdminPass123!"}).json()
        headers = {"Authorization": f"Bearer {login['access_token']}"}

        # Test reachability
        test_res = self.client.post("/api/integrations/conn-sap-s4hana/test")
        self.assertEqual(test_res.status_code, 200)
        self.assertFalse(test_res.json()["success"]) # Accurate honest report

        # Trigger sync run
        sync_res = self.client.post(
            "/api/integrations/conn-sap-s4hana/sync",
            headers=headers,
            json={"sync_type": "INCREMENTAL"}
        )
        self.assertEqual(sync_res.status_code, 200)
        self.assertEqual(sync_res.json()["status"], "SUCCESS")

        # Fetch sync runs list
        runs_res = self.client.get("/api/integrations/conn-sap-s4hana/sync-runs")
        self.assertEqual(runs_res.status_code, 200)
        self.assertGreaterEqual(len(runs_res.json()), 1)

if __name__ == "__main__":
    unittest.main()
