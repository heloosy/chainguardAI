import React, { useState } from 'react';
import { 
  Database, 
  Server, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  RefreshCw, 
  FileCode, 
  ExternalLink, 
  Sliders, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Copy,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const RealDataStudio: React.FC = () => {
  const { 
    externalConnectors, 
    testConnector, 
    syncConnector, 
    ingestRealPayload, 
    isAgentRunning,
    setActiveTab,
    dataMode,
    setDataMode
  } = useApp();

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; latency: number; success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Preset JSON payloads for real-world testing
  const presets: Record<string, { title: string; type: string; json: string }> = {
    SAP_PO: {
      title: 'SAP S/4HANA PO Schedule Line Delay (OData v4)',
      type: 'SAP_PURCHASE_ORDER',
      json: JSON.stringify({
        "d": {
          "results": [
            {
              "EBELN": "4500981240",
              "EBELP": "00010",
              "LIFNR": "0000109821",
              "NAME1": "Apex Microelectronics Corp",
              "MATNR": "COMP-MCU-8849",
              "TXZ01": "Automotive 32-Bit Microcontroller",
              "WERKS": "1010",
              "LGORT": "WH01",
              "MENGE": 1200,
              "MEINS": "EA",
              "NETPR": 145.00,
              "WAERS": "USD",
              "EINDT": "2026-11-22T00:00:00Z",
              "ORIGINAL_EINDT": "2026-11-04T00:00:00Z",
              "DELAY_DAYS": 18,
              "STATU": "CRITICAL_DELAY",
              "BOL_NUMBER": "EMCU9284102",
              "CARRIER_SCAC": "EGLV",
              "PORT_OF_LADING": "TWKHH"
            }
          ]
        }
      }, null, 2),
    },
    AIS_VESSEL: {
      title: 'Satellite AIS Marine Vessel Stream (NMEA / Spire Global)',
      type: 'AIS_SATELLITE_STREAM',
      json: JSON.stringify({
        "ais_packet": {
          "mmsi": 416005000,
          "vessel_name": "EVER FORWARD",
          "callsign": "BK4910",
          "nav_status_code": 1,
          "nav_status_text": "AT_ANCHOR",
          "speed_knots": 0.1,
          "heading_deg": 142.0,
          "latitude": 22.5841,
          "longitude": 120.2104,
          "anchorage_zone": "KAOHSIUNG_OUTER_ANCHORAGE_ZONE_B",
          "port_authority_status": "PORT_CLOSED_TYPHOON_SURGE_CAT4",
          "sea_state": "ROUGH_FORCE_11",
          "projected_unberth_delay_days": 18,
          "timestamp_utc": new Date().toISOString()
        }
      }, null, 2),
    },
    IOT_BIN: {
      title: 'Plant Floor RFID Bin Weight-Cell Telemetry (MQTT)',
      type: 'IOT_BIN_SENSOR',
      json: JSON.stringify({
        "telemetry_event": {
          "sensor_id": "RFID-TX-BIN-04A",
          "plant_id": "PLANT-1010-US",
          "facility_name": "Austin Gigafactory",
          "rack_location": "AUSTIN-WH1-RACK-12B",
          "material_number": "COMP-MCU-8849",
          "loadcell_raw_weight_kg": 2.88,
          "unit_tare_kg": 0.072,
          "computed_units_on_hand": 40,
          "safety_threshold_units": 150,
          "daily_burn_rate": 50,
          "depletion_countdown_hours": 19.2,
          "alert_level": "CRITICAL_SHORTAGE"
        }
      }, null, 2),
    },
    ARIBA_AUDIT: {
      title: 'SAP Ariba Supplier Lifecycle & Performance Audit Status',
      type: 'ARIBA_SLP_AUDIT',
      json: JSON.stringify({
        "ariba_vendor_evaluation": {
          "vendor_id": "ARB-VN-44019",
          "supplier_name": "NexaCore Semiconductors Ltd",
          "facility_country": "Vietnam",
          "audit_status": "EXPIRED_AUDIT",
          "claimed_production_capacity_daily": 400,
          "verified_capacity_daily": null,
          "engineering_audit_passed": false,
          "certifications": [
            { "standard": "ISO-9001", "status": "VALID", "expires": "2027-05-10" },
            { "standard": "ISO-26262_ASIL_D", "status": "EXPIRED", "expired_days_ago": 42 },
            { "standard": "IATF-16949", "status": "NOT_FOUND", "required_for": "Automotive Tier 1" }
          ],
          "zero_trust_status": "BLOCKED_PENDING_AUDIT"
        }
      }, null, 2),
    },
  };

  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('SAP_PO');
  const [jsonContent, setJsonContent] = useState<string>(presets.SAP_PO.json);
  const [ingestSuccess, setIngestSuccess] = useState<boolean>(false);

  const handleSelectPreset = (key: string) => {
    setSelectedPresetKey(key);
    setJsonContent(presets[key].json);
    setIngestSuccess(false);
  };

  const handleTestPing = async (connectorId: string) => {
    setTestingId(connectorId);
    setTestResult(null);
    const result = await testConnector(connectorId);
    setTestingId(null);
    setTestResult({
      id: connectorId,
      latency: result.latencyMs,
      success: result.success,
      message: result.details,
    });
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleIngest = async () => {
    try {
      const parsed = JSON.parse(jsonContent);
      const success = await ingestRealPayload(parsed, presets[selectedPresetKey].type);
      if (success) {
        setIngestSuccess(true);
      }
    } catch (e: any) {
      alert(`Invalid JSON format: ${e.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 text-white rounded-xl p-5 border border-blue-900/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-400/30 text-blue-300">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white">
                  Real Enterprise Data Studio & Live Connectors
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider font-semibold">
                  Zero Simulation Mode
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Directly connect to real REST / OData v4 endpoints, paste actual enterprise payloads, and observe the Agentic AI parse, reason, and act in real-time.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setActiveTab('agent-swarm')}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <span>View Agent Swarm Reasoning</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Enterprise Connectors Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Server className="w-4 h-4 text-blue-600" />
              <span>Configured Enterprise REST & OData Connectors</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Production data pipelines connected to ERP, WMS, and Carrier TMS endpoints.
            </p>
          </div>

          <span className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            {externalConnectors.length} Pipelines Configured
          </span>
        </div>

        {/* Connectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {externalConnectors.map((connector) => {
            const isTesting = testingId === connector.id;
            const thisResult = testResult?.id === connector.id ? testResult : null;

            return (
              <div 
                key={connector.id}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                      {connector.category}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-semibold border border-emerald-300">
                      {connector.healthStatus}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900">
                    {connector.name}
                  </h3>
                  <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                    {connector.endpointUrl}
                  </div>

                  <div className="mt-2 text-[10px] font-mono text-slate-600 space-y-0.5">
                    <div>Auth: <strong>{connector.authMethod}</strong></div>
                    <div>Last Sync: <strong>{connector.lastSyncTimestamp}</strong></div>
                    <div>Records Indexed: <strong>{connector.recordsIndexed}</strong></div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => handleTestPing(connector.id)}
                    disabled={isTesting}
                    className="flex items-center space-x-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testing Handshake...' : 'Test Live Ping'}</span>
                  </button>

                  {thisResult && (
                    <span className={`text-[10px] font-mono font-bold ${thisResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                      {thisResult.latency}ms (200 OK)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Raw Real-World JSON Ingestion Studio */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Raw Real-World JSON Ingestion Studio
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                Direct Telemetry Ingest
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select or paste actual JSON payloads received from SAP S/4HANA OData, AIS satellites, or IoT bin sensors.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {Object.entries(presets).map(([key, item]) => (
              <button
                key={key}
                onClick={() => handleSelectPreset(key)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                  selectedPresetKey === key
                    ? 'bg-blue-600 text-white border-blue-700 shadow-2xs font-semibold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {key.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* JSON Editor Box */}
        <div className="relative">
          <div className="flex items-center justify-between bg-slate-900 text-slate-300 px-3 py-1.5 rounded-t-lg text-xs font-mono border-b border-slate-800">
            <span>{presets[selectedPresetKey].title}</span>
            <button
              onClick={handleCopyJson}
              className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          <textarea
            rows={14}
            value={jsonContent}
            onChange={(e) => setJsonContent(e.target.value)}
            className="w-full p-3 font-mono text-xs bg-slate-950 text-emerald-400 rounded-b-lg border border-slate-800 focus:outline-hidden selection:bg-blue-800"
            spellCheck={false}
          />
        </div>

        {/* Ingest Action & Feedback */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500">
            Clicking ingest will parse this live payload, trigger the <strong className="text-slate-800">Sentinel Disruption Agent</strong>, and propagate the event across the swarm.
          </div>

          <div className="flex items-center space-x-3">
            {ingestSuccess && (
              <span className="text-xs font-semibold text-emerald-700 flex items-center space-x-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Payload Ingested & Dispatched to Swarm!</span>
              </span>
            )}

            <button
              onClick={handleIngest}
              disabled={isAgentRunning}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              {isAgentRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing Payload...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Ingest Payload & Trigger Agent Swarm</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Schema Field Mapping Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900">
            Canonical Normalization Architecture (Zero-Code Vendor Replacement)
          </h3>
          <p className="text-xs text-slate-500">
            How disparate ERP / TMS payloads are mapped into internal resilience schemas without rewriting any decision logic.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-y border-slate-200">
              <tr>
                <th className="py-2 px-3">External ERP JSON Path</th>
                <th className="py-2 px-3">Canonical Schema Field</th>
                <th className="py-2 px-3">Transformation Rule</th>
                <th className="py-2 px-3">Sample Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              <tr>
                <td className="py-2 px-3 text-blue-700 font-bold">d.results[0].EBELN</td>
                <td className="py-2 px-3 text-slate-800">PurchaseOrder.poNumber</td>
                <td className="py-2 px-3 text-slate-500">Direct String mapping</td>
                <td className="py-2 px-3 text-emerald-700">"4500981240"</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-blue-700 font-bold">d.results[0].MENGE</td>
                <td className="py-2 px-3 text-slate-800">PurchaseOrder.quantity</td>
                <td className="py-2 px-3 text-slate-500">Cast to Integer</td>
                <td className="py-2 px-3 text-emerald-700">1200</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-blue-700 font-bold">d.results[0].EINDT</td>
                <td className="py-2 px-3 text-slate-800">PurchaseOrder.projectedDeliveryDate</td>
                <td className="py-2 px-3 text-slate-500">ISO-8601 Date Parsing</td>
                <td className="py-2 px-3 text-emerald-700">"2026-11-22"</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-blue-700 font-bold">ais_packet.mmsi</td>
                <td className="py-2 px-3 text-slate-800">DisruptionEvent.sourceTelemetryId</td>
                <td className="py-2 px-3 text-slate-500">Vessel MMSI Indexing</td>
                <td className="py-2 px-3 text-emerald-700">416005000</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-blue-700 font-bold">telemetry_event.computed_units_on_hand</td>
                <td className="py-2 px-3 text-slate-800">InventoryItem.currentStock</td>
                <td className="py-2 px-3 text-slate-500">Weight-Cell Formula (Gross / Tare)</td>
                <td className="py-2 px-3 text-emerald-700">40</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};