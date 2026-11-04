"""
ChainGuard AI - SAP Technologies & ERP Integration Engine
Implements native SAP S/4HANA MRP Live (MD04), SAP Global Track & Trace (GTT),
SAP BAPI functions (BAPI_PO_CREATE1), SAP IDoc generation (ORDERS05, PORDCR1), and OData v4 endpoints.
"""
import datetime
import uuid
from typing import Dict, Any, List, Optional
import pandas as pd
from chainguard.data.storage import storage


class SAPIntegrationEngine:
    def __init__(self):
        self.gtt_events: List[Dict[str, Any]] = []
        self._seed_gtt_events()

    def _seed_gtt_events(self):
        now = datetime.datetime.now().isoformat()
        self.gtt_events = [
            {
                "TrackingID": "GTT-SHP-801-TW",
                "TrackingIDType": "Shipment",
                "EventType": "PORT_BERTH_CONGESTION",
                "EventReason": "Vessel queue at San Pedro Bay exceeds standard berthing SLA by 5.2 days",
                "Location": "PORT_LONGBEACH_CA",
                "ReportedAt": now,
                "EstimatedArrivalTime": "2026-11-17T18:00:00Z",
                "OriginalScheduledArrival": "2026-11-05T08:00:00Z",
                "Status": "EXCEPTION_RAISED"
            },
            {
                "TrackingID": "GTT-SHP-802-DE",
                "TrackingIDType": "Shipment",
                "EventType": "CUSTOMS_CLEARED_AIR",
                "EventReason": "Air cargo cleared Frankfurt hub and dispatched on schedule",
                "Location": "AIRPORT_FRANKFURT_FRA",
                "ReportedAt": now,
                "EstimatedArrivalTime": "2026-11-07T12:00:00Z",
                "OriginalScheduledArrival": "2026-11-05T08:00:00Z",
                "Status": "NORMAL"
            }
        ]

    # 1. SAP S/4HANA MRP Live & Stock-Requirements List (MD04)
    def get_md04_stock_requirements(self, material_id: str = "CMP-MCU-01") -> Dict[str, Any]:
        components_df = storage.get_table("components")
        pos_df = storage.get_table("purchase_orders")
        shipments_df = storage.get_table("shipments")
        
        c_match = components_df[components_df["component_id"] == material_id]
        if c_match.empty:
            raise KeyError(f"Material {material_id} not found in SAP material master.")
        c = c_match.iloc[0]

        current_stock = float(c["current_stock"])
        safety_stock = float(c["safety_stock"])
        daily_rate = float(c["daily_consumption_rate"])

        # Find matching PO
        po_match = pos_df[pos_df["component_id"] == material_id]
        po_qty = float(po_match.iloc[0]["quantity"]) if not po_match.empty else 1000.0
        po_num = po_match.iloc[0]["po_id"] if not po_match.empty else "PO-501"

        # Find matching Shipment ETA
        shp_match = shipments_df[shipments_df["component_id"] == material_id]
        eta_days = float(shp_match.iloc[0]["eta_days_remaining"] + shp_match.iloc[0]["last_milestone_deviation_days"]) if not shp_match.empty else 10.0

        today = datetime.datetime.now()
        req_date_str = (today + datetime.timedelta(days=int(current_stock / daily_rate))).strftime("%Y-%m-%d")
        deliv_date_str = (today + datetime.timedelta(days=int(eta_days))).strftime("%Y-%m-%d")

        # Build SAP MD04 MRP Elements Table
        mrp_elements = [
            {
                "Item": 1,
                "Date": today.strftime("%Y-%m-%d"),
                "MRP_Element": "Stock",
                "Element_Data": "Unrestricted Physical Use",
                "Rescheduling_Date": "-",
                "Receipt_Requirement_Qty": round(current_stock, 1),
                "Available_Qty": round(current_stock, 1),
                "Storage_Location": "0001 (Main Warehouse)",
                "Exception_Message": "None"
            },
            {
                "Item": 2,
                "Date": req_date_str,
                "MRP_Element": "DepReq",
                "Element_Data": "Planned Order 001004812 / ASM-AUTOPILOT",
                "Rescheduling_Date": "-",
                "Receipt_Requirement_Qty": -round(current_stock, 1),
                "Available_Qty": 0.0,
                "Storage_Location": "1010 (Assembly Line 1)",
                "Exception_Message": "Coverage Deficit Imminent"
            },
            {
                "Item": 3,
                "Date": deliv_date_str,
                "MRP_Element": "POitem",
                "Element_Data": f"Standard PO {po_num} / Item 00010",
                "Rescheduling_Date": req_date_str,
                "Receipt_Requirement_Qty": round(po_qty, 1),
                "Available_Qty": round(po_qty, 1),
                "Storage_Location": "0001 (Inbound Dock)",
                "Exception_Message": "10: Reschedule In (Delay Detected)"
            },
            {
                "Item": 4,
                "Date": "-",
                "MRP_Element": "SafeStk",
                "Element_Data": "Dynamic Safety Buffer Target",
                "Rescheduling_Date": "-",
                "Receipt_Requirement_Qty": -round(safety_stock, 1),
                "Available_Qty": -round(safety_stock, 1),
                "Storage_Location": "-",
                "Exception_Message": "50: Safety Stock Breached"
            }
        ]

        # Determine overall MRP controller diagnosis
        has_coverage_deficit = eta_days > (current_stock / daily_rate)
        mrp_status = "CRITICAL_MRP_EXCEPTION" if has_coverage_deficit else "BALANCED"

        return {
            "Material": material_id,
            "Material_Description": c["name"],
            "Plant": "1010 (Detroit Advanced Manufacturing Plant)",
            "MRP_Controller": "042 (Electronics Procurement Hub)",
            "MRP_Type": "PD (Deterministic MRP Live)",
            "Lot_Size": "EX (Exact Lot-for-Lot)",
            "Base_Unit": "EA",
            "Current_Stock": current_stock,
            "Safety_Stock": safety_stock,
            "Daily_Requirement": daily_rate,
            "MRP_Status": mrp_status,
            "Active_Exception_Codes": ["10 - Bring Process Forward (Reschedule In)", "50 - Coverage Deficit in Planning Horizon"],
            "MD04_Elements": mrp_elements
        }

    # 2. SAP Global Track and Trace (GTT) Event Processor
    def ingest_gtt_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        tracking_id = event_data.get("TrackingID", f"GTT-{uuid.uuid4().hex[:6]}")
        event_entry = {
            "TrackingID": tracking_id,
            "TrackingIDType": event_data.get("TrackingIDType", "Shipment"),
            "EventType": event_data.get("EventType", "DELAYED_IN_TRANSIT"),
            "EventReason": event_data.get("EventReason", "Port or transit corridor slowdown"),
            "Location": event_data.get("Location", "GLOBAL_TRANSIT"),
            "ReportedAt": datetime.datetime.now().isoformat(),
            "EstimatedArrivalTime": event_data.get("EstimatedArrivalTime", (datetime.datetime.now() + datetime.timedelta(days=8)).isoformat()),
            "Status": "INGESTED_TO_CHAINGUARD"
        }
        self.gtt_events.insert(0, event_entry)
        return {
            "status": "SAP_GTT_EVENT_PROCESSED",
            "gtt_event": event_entry
        }

    def get_all_gtt_events(self) -> List[Dict[str, Any]]:
        return self.gtt_events

    # 3. SAP BAPI Simulator: BAPI_PO_CREATE1 (Generate Formal SAP Purchase Order)
    def execute_bapi_po_create(self, 
                              vendor: str = "SUP-007", 
                              material: str = "CMP-MCU-01", 
                              quantity: float = 1200.0, 
                              net_price: float = 95.20,
                              plant: str = "1010",
                              doc_type: str = "NB") -> Dict[str, Any]:
        po_number = f"45000{datetime.datetime.now().strftime('%M%S')}{uuid.uuid4().hex[:3].upper()}"
        now_date = datetime.datetime.now().strftime("%Y-%m-%d")
        deliv_date = (datetime.datetime.now() + datetime.timedelta(days=3)).strftime("%Y-%m-%d")

        bapi_header = {
            "PO_NUMBER": po_number,
            "DOC_TYPE": doc_type,
            "PURCH_ORG": "1000",
            "PUR_GROUP": "001",
            "VENDOR": vendor,
            "COMP_CODE": "1000",
            "DOC_DATE": now_date,
            "CURRENCY": "USD"
        }

        bapi_items = [
            {
                "PO_ITEM": "00010",
                "MATERIAL": material,
                "PLANT": plant,
                "STGE_LOC": "0001",
                "QUANTITY": quantity,
                "PO_UNIT": "EA",
                "NET_PRICE": net_price,
                "DELIV_DATE": deliv_date,
                "TAX_CODE": "V1",
                "ACCTASSCAT": "F (Production Order Direct Allocation)"
            }
        ]

        bapi_return = [
            {
                "TYPE": "S",
                "ID": "06",
                "NUMBER": "017",
                "MESSAGE": f"Standard PO {po_number} created successfully in SAP S/4HANA",
                "LOG_NO": "",
                "LOG_MSG_NO": "000001",
                "MESSAGE_V1": po_number
            }
        ]

        return {
            "status": "SUCCESS",
            "bapi_function": "BAPI_PO_CREATE1",
            "generated_sap_po_number": po_number,
            "bapi_header": bapi_header,
            "bapi_items": bapi_items,
            "bapi_return": bapi_return,
            "sap_audit_timestamp": datetime.datetime.now().isoformat()
        }

    # 4. SAP IDoc Generator: ORDERS05 / PORDCR1 / WMMBID02
    def generate_idoc(self, idoc_type: str = "ORDERS05", context_data: Dict[str, Any] = None) -> Dict[str, Any]:
        idoc_num = f"00000000{datetime.datetime.now().strftime('%H%M%S')}{uuid.uuid4().hex[:2].upper()}"
        now_dt = datetime.datetime.now()

        if idoc_type == "ORDERS05":
            payload = {
                "EDI_DC40": {
                    "TABNAM": "EDI_DC40",
                    "MANDT": "100",
                    "DOCNUM": idoc_num,
                    "DIRECT": "1",  # Outbound
                    "IDOCTYP": "ORDERS05",
                    "MESTYP": "ORDCHG",  # Purchase Order Change / Expedite instruction
                    "SNDPRT": "LS",
                    "SNDPRN": "CHAINGUARD_AI",
                    "RCVPRT": "LS",
                    "RCVPRN": "SAP_S4HANA_100",
                    "CREDAT": now_dt.strftime("%Y%m%d"),
                    "CRETIM": now_dt.strftime("%H%M%S")
                },
                "E1EDK01": {
                    "ACTION": "004",  # Change / Expedite
                    "KZABS": "1",     # Acknowledgment required
                    "CURCY": "USD",
                    "ZTERM": "NT30",
                    "BSART": "NB"
                },
                "E1EDP01": {
                    "POSEX": "00010",
                    "ACTION": "002",  # Expedite line item
                    "MENGE": context_data.get("quantity", 1200) if context_data else 1200,
                    "MENEE": "EA",
                    "VPREI": context_data.get("unit_price", 95.20) if context_data else 95.20,
                    "MATNR": context_data.get("material", "CMP-MCU-01") if context_data else "CMP-MCU-01",
                    "WERKS": "1010",
                    "LGORT": "0001",
                    "EXPEDITE_MODE": "AIR_PRIORITY_FREIGHT"
                }
            }
        elif idoc_type == "WMMBID02":
            payload = {
                "EDI_DC40": {
                    "TABNAM": "EDI_DC40",
                    "DOCNUM": idoc_num,
                    "IDOCTYP": "WMMBID02",
                    "MESTYP": "WMMBXY",  # Goods movement / stock transfer
                    "SNDPRN": "CHAINGUARD_AI",
                    "RCVPRN": "SAP_S4HANA_100"
                },
                "E1MBXYH": {
                    "BLDAT": now_dt.strftime("%Y%m%d"),
                    "BUDAT": now_dt.strftime("%Y%m%d"),
                    "BWART": "301",  # Plant-to-plant transfer
                    "WERKS": "1020 (Austin Sister Hub)",
                    "UMWRK": "1010 (Detroit Plant)"
                },
                "E1MBXYI": {
                    "MATNR": "CMP-MCU-01",
                    "ERFMG": 1296,
                    "ERFME": "EA",
                    "LGORT": "0001"
                }
            }
        else:
            payload = {"DOCNUM": idoc_num, "IDOCTYP": idoc_type, "STATUS": "GENERATED"}

        return {
            "idoc_number": idoc_num,
            "idoc_type": idoc_type,
            "sender_port": "SAPCHAINGUARD",
            "receiver_partner": "S4HANA_CORE",
            "created_timestamp": now_dt.isoformat(),
            "idoc_data_structure": payload
        }


# Global Singleton
sap_engine = SAPIntegrationEngine()

