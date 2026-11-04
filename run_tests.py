"""
ChainGuard AI - Automated Test Suite Runner
Runs unit tests across models, graph consequences, preventive recommendations,
retraining pipeline, and REST API endpoints.
"""
import unittest
import sys
import os

if __name__ == "__main__":
    test_dir = os.path.join(os.path.dirname(__file__), "tests")
    loader = unittest.TestLoader()
    suite = loader.discover(start_dir=test_dir, pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=2)
    print("=" * 70)
    print("  Running ChainGuard AI Comprehensive Test Suite")
    print("=" * 70)
    result = runner.run(suite)
    sys.exit(not result.wasSuccessful())

