"""
Tests for ChainGuard AI - Consequence Calculator & Dependency Graph
"""
import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from chainguard.data.storage import storage
from chainguard.graph.dependency_engine import SupplyChainGraph
from chainguard.graph.consequence_calculator import ConsequenceCalculator


class TestConsequences(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.graph = SupplyChainGraph()
        cls.graph.build_from_tables(
            storage.get_table("suppliers"),
            storage.get_table("components"),
            storage.get_table("bom"),
            storage.get_table("customer_orders")
        )
        cls.calc = ConsequenceCalculator(cls.graph)

    def test_coverage_gap_calculation(self):
        # Component with 420 stock, 70 consumption rate => TTS = 6.0 days
        # If predicted replacement lead time is 10 days => coverage gap = 4.0 days
        res = self.calc.evaluate_component_consequences(
            component_id="CMP-MCU-01",
            predicted_lead_time_days=10.0,
            current_stock=420.0,
            daily_consumption=70.0
        )
        self.assertEqual(res["time_to_shortage_days"], 6.0)
        self.assertEqual(res["replacement_lead_time_days"], 10.0)
        self.assertEqual(res["coverage_gap_days"], 4.0)
        self.assertTrue(res["has_coverage_gap"])
        self.assertGreater(res["plant_idle_cost_usd"], 0)
        self.assertTrue(len(res["affected_assemblies"]) > 0)
        self.assertTrue(len(res["affected_products"]) > 0)
        self.assertTrue(len(res["affected_customer_orders"]) > 0)

    def test_no_coverage_gap_when_stock_sufficient(self):
        # 1000 stock, 10 consumption => TTS = 100 days, RLT = 5 days => gap = 0
        res = self.calc.evaluate_component_consequences(
            component_id="CMP-MCU-01",
            predicted_lead_time_days=5.0,
            current_stock=1000.0,
            daily_consumption=10.0
        )
        self.assertEqual(res["coverage_gap_days"], 0.0)
        self.assertFalse(res["has_coverage_gap"])
        self.assertEqual(res["plant_idle_cost_usd"], 0.0)
        self.assertEqual(res["sla_penalties_usd"], 0.0)


if __name__ == "__main__":
    unittest.main()

