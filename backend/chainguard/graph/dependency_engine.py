"""
ChainGuard AI - Supply Chain Dependency Network Graph
Constructs a directed graph linking suppliers, components, assemblies, products, facilities, and customer orders.
"""
import networkx as nx
import pandas as pd
from typing import Dict, Any, List, Set


class SupplyChainGraph:
    def __init__(self):
        self.graph = nx.DiGraph()

    def build_from_tables(self, 
                          suppliers_df: pd.DataFrame, 
                          components_df: pd.DataFrame, 
                          bom_df: pd.DataFrame, 
                          customer_orders_df: pd.DataFrame):
        self.graph.clear()

        # Add Suppliers
        for _, row in suppliers_df.iterrows():
            self.graph.add_node(
                row["supplier_id"],
                node_type="Supplier",
                name=row["name"],
                country=row["country"],
                tier=int(row["tier"]),
                category=row["category"],
                historical_on_time_rate=float(row["historical_on_time_rate"]),
                capacity_utilization=float(row["capacity_utilization"])
            )

        # Add Components
        for _, row in components_df.iterrows():
            self.graph.add_node(
                row["component_id"],
                node_type="Component",
                name=row["name"],
                supplier_id=row["supplier_id"],
                alt_supplier_id=row.get("alternative_supplier_id", None),
                unit_cost_usd=float(row["unit_cost_usd"]),
                current_stock=float(row["current_stock"]),
                safety_stock=float(row["safety_stock"]),
                daily_consumption_rate=float(row["daily_consumption_rate"]),
                criticality=row["criticality"],
                facility_id=row["facility_id"]
            )
            # Edge: Supplier -> Component
            self.graph.add_edge(row["supplier_id"], row["component_id"], relation="supplies")
            if pd.notna(row.get("alternative_supplier_id")) and row["alternative_supplier_id"]:
                self.graph.add_edge(row["alternative_supplier_id"], row["component_id"], relation="alt_supplies")

        # Add BOM edges (Component -> Assembly, Assembly -> Product, Product -> Facility)
        for _, row in bom_df.iterrows():
            parent = row["parent_id"]
            child = row["child_id"]
            
            # Ensure nodes exist with default types if not already present
            if not self.graph.has_node(parent):
                self.graph.add_node(parent, node_type=row["parent_type"], name=parent)
            if not self.graph.has_node(child):
                self.graph.add_node(child, node_type=row["child_type"], name=child)

            # Child flows into Parent (Child -> Parent in material flow)
            self.graph.add_edge(child, parent, relation="used_in", quantity=float(row["quantity_required"]))

        # Add Customer Orders & link from Product -> Customer Order
        for _, row in customer_orders_df.iterrows():
            order_id = row["order_id"]
            self.graph.add_node(
                order_id,
                node_type="CustomerOrder",
                name=f"{row['customer_name']} ({order_id})",
                customer_name=row["customer_name"],
                product_id=row["product_id"],
                quantity=float(row["quantity"]),
                contract_value_usd=float(row["contract_value_usd"]),
                promised_delivery_date=str(row["promised_delivery_date"]),
                late_penalty_usd_per_day=float(row["late_penalty_usd_per_day"]),
                sla_priority=row["sla_priority"]
            )
            # Product -> Customer Order
            if self.graph.has_node(row["product_id"]):
                self.graph.add_edge(row["product_id"], order_id, relation="fulfills")

    def get_downstream_impact(self, component_id: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Traces all downstream assemblies, products, facilities, and customer orders affected by a component.
        """
        if not self.graph.has_node(component_id):
            return {"assemblies": [], "products": [], "facilities": [], "customer_orders": []}

        descendants = nx.descendants(self.graph, component_id)
        
        affected = {
            "assemblies": [],
            "products": [],
            "facilities": [],
            "customer_orders": []
        }

        for node_id in descendants:
            node_data = self.graph.nodes[node_id]
            ntype = node_data.get("node_type")
            node_info = {"id": node_id, **node_data}
            
            if ntype == "Assembly":
                affected["assemblies"].append(node_info)
            elif ntype == "Product":
                affected["products"].append(node_info)
            elif ntype == "Facility":
                affected["facilities"].append(node_info)
            elif ntype == "CustomerOrder":
                affected["customer_orders"].append(node_info)

        return affected

    def to_cytoscape_elements(self) -> List[Dict[str, Any]]:
        """
        Converts graph to frontend visual format (nodes and edges).
        """
        elements = []
        for n, data in self.graph.nodes(data=True):
            elements.append({
                "data": {
                    "id": str(n),
                    "label": data.get("name", str(n)),
                    "type": data.get("node_type", "Unknown"),
                    **{k: (None if pd.isna(v) else v) for k, v in data.items() if k not in ["name", "node_type"]}
                }
            })
        for u, v, data in self.graph.edges(data=True):
            elements.append({
                "data": {
                    "source": str(u),
                    "target": str(v),
                    "relation": data.get("relation", "connects"),
                    "quantity": data.get("quantity", 1.0)
                }
            })
        return elements

