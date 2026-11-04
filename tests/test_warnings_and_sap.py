"""
Tests for ChainGuard AI - Warning Dispatcher & SAP ERP Technologies Integration
"""
import unittest
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from chainguard.api.app import app
from chainguard.validation.retraining_pipeline import pipeline_manager
from chainguard.warnings.warning_dispatcher import warning_dispatcher
from chainguard.sap.sap_engine import sap_engine


class TestWarningsAndSAP(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not pipeline_manager.calibrated_predictor.is_fitted:
            pipeline_manager.train_initial_models()
        cls.client = TestClient(app)

    def test_warning_dispatch_and_cascade(self):
        payload = {
            "title": "Severe Cyclone Alert on Route",
            "warning_type": "WEATHER_STORM",
            "severity": "CRITICAL",
            "description": "Category 4 tropical storm forcing container vessels to hold station or detour.",
            "source": "Maritime Satellite Alert",
            "target_shipment_id": "SHP-801",
            "target_component_id": "CMP-MCU-01",
            "delay_impact_days": 4.0,
            "port_congestion_delta": 2.0,
            "weather_severity_override": 8.5
        }
        resp = self.client.post("/api/warnings/send", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "WARNING_PROCESSED_AND_PROPAGATED")
        self.assertIn("resulting_predictions", data)
        self.assertIn("resulting_consequences", data)
        self.assertIn("resulting_recommendations", data)
        self.assertIn("sap_mrp_live_impact", data)
        
        # Check active warnings list
        active_resp = self.client.get("/api/warnings/active")
        self.assertEqual(active_resp.status_code, 200)
        self.assertTrue(len(active_resp.json()["warnings"]) > 0)

    def test_sap_md04_stock_requirements(self):
        resp = self.client.get("/api/sap/odata/v4/MD04/CMP-MCU-01")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["Material"], "CMP-MCU-01")
        self.assertIn("MD04_Elements", data)
        self.assertIn("Active_Exception_Codes", data)
        self.assertTrue(len(data["MD04_Elements"]) >= 4)

    def test_sap_bapi_po_create(self):
        payload = {
            "vendor": "SUP-007",
            "material": "CMP-MCU-01",
            "quantity": 1000.0,
            "net_price": 92.50,
            "plant": "1010"
        }
        resp = self.client.post("/api/sap/bapi/BAPI_PO_CREATE1", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["bapi_function"], "BAPI_PO_CREATE1")
        self.assertEqual(data["bapi_return"][0]["TYPE"], "S")
        self.assertTrue("generated_sap_po_number" in data)

    def test_sap_idoc_generation(self):
        resp = self.client.get("/api/sap/idoc/ORDERS05")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["idoc_type"], "ORDERS05")
        self.assertIn("idoc_data_structure", data)


if __name__ == "__main__":
    unittest.main()

