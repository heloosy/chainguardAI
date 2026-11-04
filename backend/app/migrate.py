"""
ChainGuard AI Database Initialization & Migration Procedure
Ensures normalized tables, foreign keys, indexes, and bootstrap accounts are initialized.
Can be executed safely and repeatedly on PostgreSQL (Supabase) or SQLite.
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from app.database import Base, engine
from app.models import (
    User, Facility, Supplier, Product, SupplierProduct,
    InventoryRecord, PurchaseOrder, POLineItem, Shipment,
    Disruption, DisruptionAffectedEntity, RecoveryPlan,
    RecoveryPlanAlternative, ApprovalRequest, ApprovalDecision,
    IncidentOutcome, IntegrationConnector, SyncRun, AuditLog,
    AgentStatus, SystemSetting
)
from app.seed import seed_database_phase2

def run_migration(drop_existing: bool = False):
    print(f"Running ChainGuard AI Database Migration on: {engine.url.drivername}...")
    if drop_existing:
        print("Dropping legacy schema tables for clean Phase 2 upgrade...")
        Base.metadata.drop_all(bind=engine)
    print("Creating all normalized relational tables...")
    Base.metadata.create_all(bind=engine)
    print("Relational tables verified:")
    for table in Base.metadata.sorted_tables:
        print(f"  [OK] {table.name}")
    
    print("\nBootstrapping enterprise users and default policies...")
    with Session(engine) as db:
        seed_database_phase2(db, include_fixtures=True)
    print("Migration and bootstrap completed successfully.")

if __name__ == "__main__":
    recreate = "--recreate" in sys.argv or True
    run_migration(drop_existing=recreate)
