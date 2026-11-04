"""
ChainGuard AI - Gemini AI & Deterministic Compliance Alternative Analyzer
Evaluates preventive recovery alternatives for emerging issues, regulatory barriers,
operational bottlenecks, and country trade laws.

Uses Google Gemini 2.5 Flash API (via provided API key) when online.
Gracefully and seamlessly falls back to the deterministic TradePolicyEngine
if offline, network is restricted, or API is unreachable.
"""
import os
import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional

logger = logging.getLogger("chainguard.gemini_analyzer")

# Default Gemini API key retrieved from environment variable
DEFAULT_GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-2.5-flash"


def get_deterministic_alternative_analysis(
    alt_id: str,
    title: str,
    action_type: str
) -> Dict[str, Any]:
    """
    Deterministic trade-law, operational, and country policy compliance evaluation.
    Provides precise, legally cited statutory analysis and concrete mitigations.
    """
    if alt_id == "ACT-01" or action_type == "EXPEDITE_AIR_CHARTER":
        return {
            "engine": "Deterministic Compliance Policy Engine (Rule-based Fallback)",
            "status": "ANALYZED",
            "positive_factors": [
                "Bypasses stranded ocean berth at Chennai, compressing lead time from 21.5 days to 2.0 days.",
                "Recovers 4.1 days of assembly coverage gap, preventing complete shutdown of Detroit Plant 1010.",
                "Protects $1,815,000 in unmitigated idle labor and SLA contract breach penalties (Net Benefit: +$1,720,000).",
                "Secures priority Lufthansa Cargo main deck space for 5,000 units of CMP-MCU-01."
            ],
            "issues": [
                {
                    "issue": "EAR Dual-Use Export Control Licensing (15 CFR § 734.4 / ECCN 3A001)",
                    "category": "REGULATORY",
                    "severity": "HIGH",
                    "statute": "15 CFR § 734.4 / Wassenaar Arrangement Category 3",
                    "description": "Automotive 32-bit microcontrollers contain hardware cryptographic modules under ECCN 3A001.a.2. Transshipment through Frankfurt (Germany) into the United States requires validated dual-use trade declaration.",
                    "mitigation": "Agent auto-generates SNAP-R electronic filing invoking BIS License Exception STA (Strategic Trade Authorization) and embeds commercial invoice with ECCN 3A001 designation to clear German Zutzer customs without detention."
                },
                {
                    "issue": "IATA Dangerous Goods Regulation PI 965 (Lithium Battery Charge Ceiling)",
                    "category": "OPERATIONAL",
                    "severity": "MEDIUM",
                    "statute": "IATA DGR Packing Instruction 965 Section IA/IB (UN 3480)",
                    "description": "Associated RTC lithium coin battery backups on avionics boards cannot exceed 30% State of Charge (SoC) on dedicated cargo freighters.",
                    "mitigation": "Automated verification of supplier UN 38.3 test summary and Shipper's Declaration for Dangerous Goods (DGD) prior to aircraft pallet buildup."
                },
                {
                    "issue": "Frankfurt Hub (FRA) CargoCity South Apron Congestion",
                    "category": "OPERATIONAL",
                    "severity": "LOW",
                    "statute": "Fraport Ground Handling SLA v3.1",
                    "description": "Peak season cargo transfer queue can introduce 12-16 hour transshipment dwell times.",
                    "mitigation": "Contracted direct airside tarmac-to-freighter hotshot transfer, bypassing common warehouse sortation."
                }
            ],
            "immutable_statutory_barriers": [],
            "immutable_barrier_detected": False,
            "legal_verdict": "LEGALLY VIABLE: Compliant with EAR STA exception and IATA PI 965 standards. No immutable statutory barriers detected."
        }

    elif alt_id == "ACT-02" or action_type == "SECONDARY_SOURCING":
        return {
            "engine": "Deterministic Compliance Policy Engine (Rule-based Fallback)",
            "status": "ANALYZED",
            "positive_factors": [
                "Decouples Detroit plant from Bay of Bengal / Indian Ocean weather corridor.",
                "ISO-26262 ASIL-D automotive safety grade certified fab with cleanroom capacity.",
                "Reliable transatlantic air cargo routing via Munich (MUC) to Detroit (DTW)."
            ],
            "issues": [
                {
                    "issue": "PPAP Level 3 Tooling & Photolithography Mask Recalibration",
                    "category": "OPERATIONAL",
                    "severity": "HIGH",
                    "statute": "AIAG Production Part Approval Process (PPAP) 4th Edition",
                    "description": "Nordic Precision uses an alternate silicon stepping profile; requires Detroit QA engineering approval before microcontrollers can be assembled into Titan OEM vehicles.",
                    "mitigation": "Air-courier 20 sample test coupons for expedited 24-hour metallurgy and automated optical inspection (AOI) at Detroit Quality Center."
                },
                {
                    "issue": "EU Carbon Border Adjustment Mechanism (CBAM Regulation (EU) 2023/956)",
                    "category": "COUNTRY_POLICY",
                    "severity": "MEDIUM",
                    "statute": "Regulation (EU) 2023/956 / DG TAXUD",
                    "description": "European manufactured subcomponents require embedded carbon emissions accounting prior to export.",
                    "mitigation": "Leverage Nordic Precision's certified hydroelectric renewable origin certificates to zero out potential carbon fiscal levies."
                },
                {
                    "issue": "Tight Residual Lead Time Safety Margin (0.3 Days Buffer)",
                    "category": "OPERATIONAL",
                    "severity": "MEDIUM",
                    "statute": "Plant 1010 JIT Standard Operating Procedure",
                    "description": "4.5-day replacement lead time leaves only 7 hours of safety margin before Detroit inventory reaches zero.",
                    "mitigation": "Schedule temporary shift rescheduling at Detroit plant to reduce hourly MCU burn-down rate."
                }
            ],
            "immutable_statutory_barriers": [],
            "immutable_barrier_detected": False,
            "legal_verdict": "LEGALLY VIABLE: Requires PPAP metallurgical coupon clearance and CBAM green power documentation."
        }

    else:  # ACT-03 or DO_NOTHING
        return {
            "engine": "Deterministic Compliance Policy Engine (Rule-based Fallback)",
            "status": "ANALYZED",
            "positive_factors": [
                "Zero immediate emergency expenditure ($0.00 cash outlay)."
            ],
            "issues": [
                {
                    "issue": "Assembly Line Stockout & Daily Idle Penalties",
                    "category": "OPERATIONAL",
                    "severity": "CRITICAL",
                    "statute": "Detroit Assembly Labor Agreement & Fixed Overhead Allocation",
                    "description": "Plant 1010 inventory runs dry in 4.8 days. Assembly line idles for 4.1 days incurring $420,000/day in non-recoverable idle labor.",
                    "mitigation": "None feasible without physical component replacement."
                },
                {
                    "issue": "Titan OEM SLA Contract Breach & Liquidated Damages",
                    "category": "REGULATORY",
                    "severity": "CRITICAL",
                    "statute": "Master Automotive Supply Agreement Clause 14.2 (Default)",
                    "description": "Failure to deliver by SLA day 12 triggers immediate $93,000 fine plus Titan OEM right to terminate $2.40M annual supply agreement.",
                    "mitigation": "None. Loss is unmitigated under status quo."
                },
                {
                    "issue": "The Jones Act Domestic Cabotage Law (46 U.S.C. § 55102)",
                    "category": "COUNTRY_POLICY",
                    "severity": "CRITICAL",
                    "statute": "46 U.S.C. § 55102 / 19 CFR § 4.80",
                    "description": "Foreign-flagged vessel MV Pacific Trader cannot legally drop cargo at a secondary US port (e.g. Norfolk) and have another foreign vessel move it coastwise to Baltimore.",
                    "mitigation": "IMMUTABLE STATUTORY BARRIER: Strict statutory prohibition under federal maritime law. Any coastwise transfer must use bonded domestic rail (Norfolk Southern/CSX) or US-flagged carriers."
                }
            ],
            "immutable_statutory_barriers": [
                "Jones Act (46 U.S.C. § 55102): Total statutory prohibition on foreign vessel coastal transshipment between US ports without DHS National Defense Waiver. Cargo is subject to civil forfeiture if attempted."
            ],
            "immutable_barrier_detected": True,
            "legal_verdict": "CATASTROPHIC OPERATIONAL IMPACT & IMMUTABLE STATUTORY BARRIER: $1.815M loss cannot be legally avoided without air/ground intermodal intervention."
        }


def analyze_alternative_with_gemini(
    alt_id: str,
    title: str,
    action_type: str,
    cost_usd: float,
    context: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Attempts to analyze alternative issues, regulations, and mitigations using
    Google Gemini 2.5 Flash API with the provided key.

    If network connection fails, sandbox blocks outbound traffic, or API errors out,
    seamlessly falls back to get_deterministic_alternative_analysis().
    """
    api_key = os.environ.get("GEMINI_API_KEY", DEFAULT_GEMINI_API_KEY)
    
    # 1. Prepare structured prompt for Gemini
    prompt_text = (
        f"You are an enterprise supply-chain resilience and trade-compliance legal intelligence AI.\n"
        f"Evaluate the following emergency recovery alternative for an automotive supply chain disruption:\n"
        f"Alternative ID: {alt_id}\n"
        f"Title: {title}\n"
        f"Action Type: {action_type}\n"
        f"Cost: ${cost_usd:,.2f}\n"
        f"Context: Critical component CMP-MCU-01 (32-bit automotive microcontroller) stranded due to cyclone at Chennai Port, India. Assembly plant in Detroit, USA will exhaust stock in 4.8 days without intervention.\n\n"
        f"Analyze:\n"
        f"1. Key positive factors / advantages.\n"
        f"2. Specific issues that arise across Regulatory (EAR, ECCN, export controls, CBAM), Operational (air freight capacity, dangerous goods, dwell times, PPAP), and Country Policies (tariffs, cabotage, Jones Act).\n"
        f"3. Concrete actionable mitigations for each issue.\n"
        f"4. Any immutable statutory barriers (where law strictly prohibits action without exception).\n\n"
        f"Return ONLY valid JSON matching this schema:\n"
        f"{{\n"
        f'  "positive_factors": ["string"],\n'
        f'  "issues": [\n'
        f'    {{"issue": "name", "category": "REGULATORY|OPERATIONAL|COUNTRY_POLICY", "severity": "HIGH|MEDIUM|LOW", "statute": "legal cite", "description": "detail", "mitigation": "how to mitigate"}}\n'
        f'  ],\n'
        f'  "immutable_statutory_barriers": ["string"],\n'
        f'  "immutable_barrier_detected": false,\n'
        f'  "legal_verdict": "summary verdict"\n'
        f"}}"
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={api_key}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt_text}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 1000,
            "responseMimeType": "application/json"
        }
    }

    # 2. Attempt Gemini API call with tight timeout (2.0s) so UI remains instantaneous
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=2.0) as resp:
            if resp.status == 200:
                resp_data = json.loads(resp.read().decode("utf-8"))
                candidates = resp_data.get("candidates", [])
                if candidates:
                    content_parts = candidates[0].get("content", {}).get("parts", [])
                    if content_parts:
                        raw_json_str = content_parts[0].get("text", "{}")
                        parsed = json.loads(raw_json_str)
                        parsed["engine"] = "Google Gemini 2.5 Flash API (Live AI)"
                        parsed["status"] = "ANALYZED"
                        logger.info(f"Successfully analyzed alternative {alt_id} with Gemini 2.5 Flash.")
                        return parsed
    except Exception as exc:
        logger.warning(
            f"Gemini API call offline or unavailable ({type(exc).__name__}: {exc}). "
            f"Seamlessly falling back to Deterministic Compliance Policy Engine."
        )

    # 3. Fallback to deterministic compliance engine
    fallback = get_deterministic_alternative_analysis(alt_id, title, action_type)
    fallback["offline_fallback_reason"] = "Gemini API unavailable or offline; deterministic compliance rules applied"
    return fallback

