"""
ChainGuard AI - Data Storage & Ingestion Manager
Provides persistence, retrieval, and runtime updating of all supply chain entities.
Supports CSV ingestion and live operational data updates.
"""
import os
import io
import pandas as pd
from typing import Dict, Any, Optional
from chainguard.data.generator import generate_benchmark_data

DATA_DIR = os.path.join(os.path.dirname(__file__), "sample_data")
os.makedirs(DATA_DIR, exist_ok=True)


class DataStorage:
    def __init__(self, data_dir: str = DATA_DIR):
        self.data_dir = data_dir
        self.tables: Dict[str, pd.DataFrame] = {}
        self.load_or_generate()

    def load_or_generate(self, force_refresh: bool = False):
        required_tables = [
            "suppliers", "components", "facilities", "bom", "customer_orders",
            "purchase_orders", "shipments", "external_signals", "historical_deliveries"
        ]
        
        all_exist = all(os.path.exists(os.path.join(self.data_dir, f"{t}.csv")) for t in required_tables)
        
        if not all_exist or force_refresh:
            generated = generate_benchmark_data()
            for name, df in generated.items():
                file_path = os.path.join(self.data_dir, f"{name}.csv")
                df.to_csv(file_path, index=False)
                self.tables[name] = df
        else:
            for name in required_tables:
                file_path = os.path.join(self.data_dir, f"{name}.csv")
                self.tables[name] = pd.read_csv(file_path)

    def get_table(self, table_name: str) -> pd.DataFrame:
        if table_name not in self.tables:
            file_path = os.path.join(self.data_dir, f"{table_name}.csv")
            if os.path.exists(file_path):
                self.tables[table_name] = pd.read_csv(file_path)
            else:
                raise KeyError(f"Table '{table_name}' does not exist.")
        return self.tables[table_name]

    def save_table(self, table_name: str, df: pd.DataFrame):
        self.tables[table_name] = df.copy()
        file_path = os.path.join(self.data_dir, f"{table_name}.csv")
        df.to_csv(file_path, index=False)

    def ingest_records(self, table_name: str, csv_or_json_content: str, format_type: str = "csv", mode: str = "append") -> int:
        """
        Ingests records from CSV or JSON string into the target table.
        mode can be 'append' or 'replace'.
        """
        if format_type.lower() == "csv":
            new_df = pd.read_csv(io.StringIO(csv_or_json_content))
        elif format_type.lower() == "json":
            new_df = pd.read_json(io.StringIO(csv_or_json_content))
        else:
            raise ValueError(f"Unsupported format_type: {format_type}")

        if mode == "replace":
            self.save_table(table_name, new_df)
            return len(new_df)
        else:
            existing_df = self.get_table(table_name)
            # Find primary key column if possible (e.g. po_id, shipment_id, supplier_id)
            pk_candidates = [col for col in ["po_id", "shipment_id", "supplier_id", "component_id", "order_id", "signal_id"] if col in existing_df.columns]
            if pk_candidates:
                pk = pk_candidates[0]
                # Upsert
                combined = pd.concat([existing_df[~existing_df[pk].isin(new_df[pk])], new_df], ignore_index=True)
            else:
                combined = pd.concat([existing_df, new_df], ignore_index=True)
            self.save_table(table_name, combined)
            return len(new_df)

    def update_record(self, table_name: str, key_col: str, key_val: Any, updates: Dict[str, Any]) -> bool:
        df = self.get_table(table_name)
        mask = df[key_col] == key_val
        if not mask.any():
            return False
        for k, v in updates.items():
            if k in df.columns:
                df.loc[mask, k] = v
        self.save_table(table_name, df)
        return True


# Global default instance
storage = DataStorage()

