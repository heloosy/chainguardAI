import React, { useState } from 'react';
import { 
  Network, 
  Truck, 
  Cpu, 
  Factory as FactoryIcon, 
  Box, 
  ShoppingBag, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Layers,
  ArrowRight,
  ShieldAlert,
  Warehouse,
  FileText,
  Ship,
  Sparkles,
  Database
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

type NodeType = 'SUPPLIER_T2' | 'SUPPLIER' | 'COMPONENT' | 'WAREHOUSE' | 'FACTORY' | 'PRODUCT' | 'ORDER' | 'SHIPMENT';

interface NetworkNode {
  id: string;
  name: string;
  type: NodeType;
  code: string;
  status: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  subtitle: string;
  dataSource: string;
  completeness: '100% Verified' | '60% Partial' | 'Unverified';
  completenessNote: string;
  details: Record<string, string | number>;
  upstreamIds: string[];
  downstreamIds: string[];
}

export const SupplyChainNetwork: React.FC = () => {
  const { setActiveTab } = useApp();
  const [selectedNodeId, setSelectedNodeId] = useState<string>('COMP-MCU-8849');

  // Build unified multi-tier network nodes
  const nodes: Record<string, NetworkNode> = {
    // Tier-2 Supplier
    'SUP-T2-WAFER': {
      id: 'SUP-T2-WAFER',
      name: 'Hsinchu Silicon Wafer Foundry (Tier-2)',
      type: 'SUPPLIER_T2',
      code: 'WAFER-TW',
      status: 'WARNING',
      subtitle: 'Taiwan • Tier-2 Wafer Ingot Supplier',
      dataSource: 'Tier-2 Sub-Tier Component Registry & Verified BOM',
      completeness: '60% Partial',
      completenessNote: 'Ingot fab verified. Sub-tier raw chemical gas suppliers remain undisclosed per commercial NDA (preserved as unverified per zero-hallucination mandate).',
      details: {
        'Tier Level': 'Tier 2 (Sub-Supplier)',
        'Supplies To': 'Supplier X (Apex Micro)',
        'Product': '300mm Epitaxial Ingot Wafers',
        'Verification': 'Certified ISO-9001 Fab',
      },
      upstreamIds: [],
      downstreamIds: ['SUP-X'],
    },

    // Tier-1 Suppliers
    'SUP-X': {
      id: 'SUP-X',
      name: 'Supplier X (Apex Micro)',
      type: 'SUPPLIER',
      code: 'APEX-TW',
      status: 'CRITICAL',
      subtitle: 'Taiwan • Disrupted (+18d delay)',
      dataSource: 'SAP S/4HANA Vendor Master (LFA1) & AIS Transponder',
      completeness: '100% Verified',
      completenessNote: 'Direct Tier-1 contract with real-time EDI 856 Advanced Shipping Notice feed.',
      details: {
        'Ariba Vendor ID': 'ARB-TW-98210',
        'Lead Time': '45 days (+18d delay)',
        'Reliability Score': '68% (Declining)',
        'Disruption': 'Typhoon Gaemi Kaohsiung Embargo',
      },
      upstreamIds: ['SUP-T2-WAFER'],
      downstreamIds: ['SHP-99210', 'COMP-MCU-8849', 'COMP-PWR-220'],
    },
    'SUP-Y': {
      id: 'SUP-Y',
      name: 'Supplier Y (NexaCore)',
      type: 'SUPPLIER',
      code: 'NEXA-VN',
      status: 'WARNING',
      subtitle: 'Vietnam • Unverified Audit',
      dataSource: 'SAP Ariba SLP Candidate Registry',
      completeness: '60% Partial',
      completenessNote: 'Commercial registration verified; on-site ISO-26262 automotive safety audit incomplete.',
      details: {
        'Ariba Vendor ID': 'ARB-VN-44019',
        'Audit Status': 'PENDING_ON_SITE_AUDIT',
        'Quoted Lead Time': '12 days (Unverified)',
        'Compliance Gap': 'Missing Form 409-B Cleanroom Audit',
      },
      upstreamIds: [],
      downstreamIds: ['COMP-MCU-8849'],
    },
    'SUP-Z': {
      id: 'SUP-Z',
      name: 'Supplier Z (Kyoto Precision)',
      type: 'SUPPLIER',
      code: 'KYOTO-JP',
      status: 'HEALTHY',
      subtitle: 'Japan • Certified Tier-1 Partner',
      dataSource: 'SAP S/4HANA Vendor Master & Pre-Cleared Buffer Agreement',
      completeness: '100% Verified',
      completenessNote: 'Long-term certified strategic partner with guaranteed 4h air freight dispatch.',
      details: {
        'Ariba Vendor ID': 'ARB-JP-11920',
        'Audit Status': 'VERIFIED',
        'Reliability Score': '97%',
        'Expedited Air': 'Available (200 units on standby)',
      },
      upstreamIds: [],
      downstreamIds: ['COMP-MCU-8849', 'COMP-SEN-401'],
    },
    'SUP-D': {
      id: 'SUP-D',
      name: 'Bavaria Power Systems',
      type: 'SUPPLIER',
      code: 'BAV-DE',
      status: 'HEALTHY',
      subtitle: 'Germany • On Schedule',
      dataSource: 'SAP S/4HANA Vendor Master',
      completeness: '100% Verified',
      completenessNote: 'Direct Tier-1 European manufacturer with weekly milk-run deliveries.',
      details: {
        'Ariba Vendor ID': 'ARB-DE-77391',
        'Reliability Score': '94%',
        'Standard Lead Time': '7 days',
      },
      upstreamIds: [],
      downstreamIds: ['COMP-PWR-220'],
    },

    // In-Transit Shipments
    'SHP-99210': {
      id: 'SHP-99210',
      name: 'Ocean Cargo: Vessel Ever Forward',
      type: 'SHIPMENT',
      code: 'SHP-PACIFIC',
      status: 'CRITICAL',
      subtitle: 'Anchored outside Kaohsiung Port',
      dataSource: 'Project44 / AIS Marine Telemetry (IMO: 9812401)',
      completeness: '100% Verified',
      completenessNote: 'Satellite GPS fix confirmed vessel berthed in holding anchorage.',
      details: {
        'Carrying': '1,200 units MCU-8849 (PO 4500981240)',
        'Carrier': 'Evergreen Marine Line',
        'Delayed Days': '18 days delay',
        'Original ETA': '2026-11-04 (Now Nov 22)',
      },
      upstreamIds: ['SUP-X'],
      downstreamIds: ['COMP-MCU-8849'],
    },

    // Components
    'COMP-MCU-8849': {
      id: 'COMP-MCU-8849',
      name: 'MCU-8849 Microcontroller',
      type: 'COMPONENT',
      code: 'MCU-8849',
      status: 'CRITICAL',
      subtitle: 'Shared Bottleneck between Austin & Munich',
      dataSource: 'SAP S/4HANA Material Master (MARC) & Production BOM',
      completeness: '100% Verified',
      completenessNote: 'Dual-plant shared bill-of-materials component.',
      details: {
        'Category': 'Automotive 32-Bit Semiconductor',
        'Unit Cost': '$145.00',
        'Austin Stock': '40 units (Runout: 19 hours)',
        'Munich Stock': '520 units (Burn rate: 60/day)',
        'Shared Usage': 'Used by BOTH Austin (FAC-A) and Munich (FAC-B)',
      },
      upstreamIds: ['SHP-99210', 'SUP-X', 'SUP-Y', 'SUP-Z'],
      downstreamIds: ['FAC-A', 'FAC-B'],
    },
    'COMP-PWR-220': {
      id: 'COMP-PWR-220',
      name: 'SiC Power Module 800V',
      type: 'COMPONENT',
      code: 'PWR-220',
      status: 'HEALTHY',
      subtitle: 'Adequate Buffer (13.7 days)',
      dataSource: 'SAP S/4HANA Material Master',
      completeness: '100% Verified',
      completenessNote: 'Single-source certified European component.',
      details: {
        'Category': 'Power Module (Silicon Carbide)',
        'Austin Stock': '480 units on hand',
        'Primary Supplier': 'Bavaria Power Systems GmbH',
      },
      upstreamIds: ['SUP-D', 'SUP-X'],
      downstreamIds: ['FAC-A'],
    },
    'COMP-SEN-401': {
      id: 'COMP-SEN-401',
      name: 'Inertial Precision Sensor',
      type: 'COMPONENT',
      code: 'SEN-401',
      status: 'HEALTHY',
      subtitle: 'Adequate Buffer (13.0 days)',
      dataSource: 'SAP S/4HANA Material Master',
      completeness: '100% Verified',
      completenessNote: 'Direct Japanese supply with dedicated air corridor.',
      details: {
        'Category': 'Passives / Inertial MEMS',
        'Munich Stock': '650 units on hand',
        'Primary Supplier': 'Kyoto Precision Micro',
      },
      upstreamIds: ['SUP-Z'],
      downstreamIds: ['FAC-B'],
    },

    // Factories
    'FAC-A': {
      id: 'FAC-A',
      name: 'Austin Gigafactory (Plant 1010)',
      type: 'FACTORY',
      code: 'FAC-A',
      status: 'CRITICAL',
      subtitle: 'Austin, Texas • Stockout in 19 Hours',
      dataSource: 'SAP Plant Configuration (T001W) & S/4HANA MM-IM',
      completeness: '100% Verified',
      completenessNote: 'Production schedule lines verified in ERP.',
      details: {
        'Current MCU Stock': '40 units (Runout: 0.8 days)',
        'Daily Burn Rate': '50 units / day',
        'Plant Overhead': '$185,000 / day idle loss',
        'Target Product': 'Model-E High-Voltage EV Powertrain',
      },
      upstreamIds: ['COMP-MCU-8849', 'COMP-PWR-220'],
      downstreamIds: ['PRD-101'],
    },
    'FAC-B': {
      id: 'FAC-B',
      name: 'Munich Precision Assembly (Plant 2020)',
      type: 'FACTORY',
      code: 'FAC-B',
      status: 'WARNING',
      subtitle: 'Munich, Germany • Vulnerable Buffer',
      dataSource: 'SAP Plant Configuration (T001W) & S/4HANA MM-IM',
      completeness: '100% Verified',
      completenessNote: 'Buffer threshold configured at 180 units.',
      details: {
        'Current MCU Stock': '520 units (8.6 days buffer)',
        'Daily Burn Rate': '60 units / day',
        'Safety Threshold': '180 units (3.0 days mandatory buffer)',
        'Vulnerability': 'Aggressive 450-unit transfer causes secondary line shutdown in 2.2 days!',
      },
      upstreamIds: ['COMP-MCU-8849', 'COMP-SEN-401'],
      downstreamIds: ['PRD-202', 'PRD-303'],
    },

    // Products
    'PRD-101': {
      id: 'PRD-101',
      name: 'Model-E High-Voltage EV Powertrain',
      type: 'PRODUCT',
      code: 'PRD-101',
      status: 'CRITICAL',
      subtitle: 'Produced at Austin • Margin $2,800',
      dataSource: 'SAP S/4HANA Product Master & Costing (CK11N)',
      completeness: '100% Verified',
      completenessNote: 'BOM components: MCU-8849 and PWR-220.',
      details: {
        'Selling Price': '$8,500 / unit',
        'Unit Margin': '$2,800',
        'Manufacturing Line': 'Austin Main Assembly Bay 4',
      },
      upstreamIds: ['FAC-A'],
      downstreamIds: ['ORD-8901'],
    },
    'PRD-202': {
      id: 'PRD-202',
      name: 'Industrial Edge Controller',
      type: 'PRODUCT',
      code: 'PRD-202',
      status: 'HEALTHY',
      subtitle: 'Produced at Munich • Margin $950',
      dataSource: 'SAP S/4HANA Product Master',
      completeness: '100% Verified',
      completenessNote: 'BOM components: MCU-8849 and SEN-401.',
      details: {
        'Selling Price': '$3,200 / unit',
        'Unit Margin': '$950',
        'Manufacturing Line': 'Munich Precision Cell 2',
      },
      upstreamIds: ['FAC-B'],
      downstreamIds: ['ORD-8902'],
    },
    'PRD-303': {
      id: 'PRD-303',
      name: 'Smart Grid Telemetry Node',
      type: 'PRODUCT',
      code: 'PRD-303',
      status: 'HEALTHY',
      subtitle: 'Produced at Munich • Margin $1,400',
      dataSource: 'SAP S/4HANA Product Master',
      completeness: '100% Verified',
      completenessNote: 'BOM components: MCU-8849.',
      details: {
        'Selling Price': '$4,200 / unit',
        'Unit Margin': '$1,400',
        'Manufacturing Line': 'Munich Electronics Cell 1',
      },
      upstreamIds: ['FAC-B'],
      downstreamIds: ['ORD-9024'],
    },

    // Customer Orders
    'ORD-8901': {
      id: 'ORD-8901',
      name: 'SO-008901: AeroDrive EV Titan',
      type: 'ORDER',
      code: 'ORD-8901',
      status: 'CRITICAL',
      subtitle: 'Tier 1 Strategic • Penalty $45k/day',
      dataSource: 'SAP S/4HANA Sales Order Schedule Line',
      completeness: '100% Verified',
      completenessNote: 'Legally binding SLA with liquidated damages.',
      details: {
        'Customer Tier': 'Tier 1 Strategic EV Titan',
        'Order Value': '$1,530,000 (180 units)',
        'Contract Penalty': '$45,000 / day late',
        'Promised Delivery': '2026-11-07 (Late by 16d if unmitigated)',
      },
      upstreamIds: ['PRD-101'],
      downstreamIds: [],
    },
    'ORD-8902': {
      id: 'ORD-8902',
      name: 'SO-008902: Continental Grid',
      type: 'ORDER',
      code: 'ORD-8902',
      status: 'HEALTHY',
      subtitle: 'Tier 2 Enterprise • Safe unless Munich starves',
      dataSource: 'SAP S/4HANA Sales Order',
      completeness: '100% Verified',
      completenessNote: 'Breached if Option 1 transfers 450 units away from Munich.',
      details: {
        'Customer Tier': 'Tier 2 Enterprise Alliance',
        'Order Value': '$384,000 (120 units)',
        'Vulnerability': 'Delayed by 12 days if Factory B stock is transferred!',
      },
      upstreamIds: ['PRD-202'],
      downstreamIds: [],
    },
  };

  const selectedNode = nodes[selectedNodeId] || nodes['COMP-MCU-8849'];

  // Check connectivity
  const isNodeConnected = (nodeId: string): boolean => {
    if (selectedNodeId === nodeId) return true;
    if (selectedNode.downstreamIds.includes(nodeId)) return true;
    if (selectedNode.upstreamIds.includes(nodeId)) return true;

    // Check 2-hop downstream if component or supplier selected
    if (selectedNode.type === 'COMPONENT' || selectedNode.type === 'SUPPLIER' || selectedNode.type === 'SHIPMENT') {
      const directDownstream = selectedNode.downstreamIds;
      if (directDownstream.some(d => nodes[d]?.downstreamIds.includes(nodeId))) return true;
      // 3-hop to orders
      for (const d of directDownstream) {
        const secondHop = nodes[d]?.downstreamIds || [];
        if (secondHop.some(s => nodes[s]?.downstreamIds.includes(nodeId))) return true;
      }
    }
    return false;
  };

  const columns: { title: string; icon: any; nodeIds: string[] }[] = [
    { title: '1. Upstream Tier-1/2', icon: Truck, nodeIds: ['SUP-T2-WAFER', 'SUP-X', 'SUP-Y', 'SUP-Z', 'SUP-D'] },
    { title: '2. Shipments', icon: Ship, nodeIds: ['SHP-99210'] },
    { title: '3. Components', icon: Cpu, nodeIds: ['COMP-MCU-8849', 'COMP-PWR-220', 'COMP-SEN-401'] },
    { title: '4. Manufacturing Plants', icon: FactoryIcon, nodeIds: ['FAC-A', 'FAC-B'] },
    { title: '5. Finished Products', icon: Box, nodeIds: ['PRD-101', 'PRD-202', 'PRD-303'] },
    { title: '6. Customer Orders', icon: ShoppingBag, nodeIds: ['ORD-8901', 'ORD-8902'] },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-900">
              Feature Two: Multi-Tier Dependency Mapping
            </h1>
            <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
              Deterministic Cascade Analysis
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualizes multi-tier dependencies from raw silicon ingots and container shipments down to plant buffers and strategic customer SLAs.
          </p>
        </div>

        {/* Bottleneck Warning Pill */}
        <div className="flex items-center space-x-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Key Vulnerability:</strong> Component <code>MCU-8849</code> is shared between <strong>Austin (FAC-A)</strong> and <strong>Munich (FAC-B)</strong>.
          </span>
        </div>
      </div>

      {/* Main Interactive Multi-Tier Visual Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 6 Tier Columns Visual Graph */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
          <div className="min-w-[780px] grid grid-cols-6 gap-2.5">
            {columns.map((col) => {
              const Icon = col.icon;
              return (
                <div key={col.title} className="flex flex-col space-y-2.5">
                  {/* Column Header */}
                  <div className="flex items-center space-x-1.5 pb-2 border-b border-slate-200 text-[11px] font-bold text-slate-700">
                    <Icon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{col.title}</span>
                  </div>

                  {/* Nodes in this column */}
                  <div className="space-y-2 flex-1">
                    {col.nodeIds.map(nodeId => {
                      const node = nodes[nodeId];
                      if (!node) return null;
                      const isSelected = selectedNodeId === nodeId;
                      const isConnected = isNodeConnected(nodeId);

                      let statusBadge = 'bg-slate-100 text-slate-600';
                      if (node.status === 'CRITICAL') statusBadge = 'bg-red-100 text-red-700 border-red-200';
                      if (node.status === 'WARNING') statusBadge = 'bg-amber-100 text-amber-800 border-amber-200';
                      if (node.status === 'HEALTHY') statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200';

                      return (
                        <div
                          key={nodeId}
                          onClick={() => setSelectedNodeId(nodeId)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                              : isConnected
                              ? 'bg-blue-50/70 border-blue-300 text-slate-800 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-500 opacity-60 hover:opacity-100 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-mono font-bold tracking-tight">
                              {node.code}
                            </span>
                            <span className={`text-[8px] px-1 py-0.2 rounded font-semibold uppercase ${
                              isSelected ? 'bg-blue-700 text-white' : statusBadge
                            }`}>
                              {node.status}
                            </span>
                          </div>

                          <div className={`text-[11px] font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {node.name}
                          </div>

                          <div className={`text-[9px] mt-1 line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                            {node.subtitle}
                          </div>

                          {/* Shared component callout on component node */}
                          {nodeId === 'COMP-MCU-8849' && (
                            <div className={`mt-1.5 text-[8px] font-semibold px-1 py-0.5 rounded text-center ${
                              isSelected ? 'bg-blue-800 text-amber-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              ⚡ Shared by FAC-A & FAC-B
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>Click any node to illuminate upstream origins and downstream cascade impact paths.</span>
            <span className="text-blue-600 font-medium font-mono text-[11px]">Selected: {selectedNode.code}</span>
          </div>
        </div>

        {/* Right Column: Node Details & Data Provenance Inspector */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  {selectedNode.type.replace('_', ' ')} NODE
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedNode.name}
                </h3>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                selectedNode.status === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {selectedNode.status}
              </span>
            </div>

            {/* Downstream Cascade Path Callout */}
            <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg space-y-1.5 text-xs text-red-950 mb-3">
              <div className="font-bold flex items-center space-x-1.5 text-red-900">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>Downstream Cascade Impact Path:</span>
              </div>
              <p className="text-[11px] text-red-800 leading-relaxed font-mono">
                {selectedNodeId === 'SUP-X' || selectedNodeId === 'SHP-99210' || selectedNodeId === 'COMP-MCU-8849' ? (
                  <span>Apex Micro (TW) ➔ Ever Forward ➔ COMP-MCU-8849 ➔ [Austin & Munich] ➔ Model-E Powertrain ➔ Strategic OEM Order SO-008901 ($45k/d penalty)</span>
                ) : (
                  <span>Selected node upstream and downstream flow lines highlighted in blue on the topology grid.</span>
                )}
              </p>
            </div>

            {/* Data Source & Completeness (Prompt Section 4 Requirement) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs mb-3">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>Data Source & Provenance</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  selectedNode.completeness === '100% Verified' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedNode.completeness}
                </span>
              </div>
              <div className="text-[11px] text-slate-600">
                <strong>Source:</strong> {selectedNode.dataSource}
              </div>
              <p className="text-[10px] text-slate-500 italic leading-snug">
                {selectedNode.completenessNote}
              </p>
            </div>

            {/* Entity Attributes Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 font-bold text-slate-600 text-[10px] uppercase">
                Node Telemetry Attributes
              </div>
              <div className="divide-y divide-slate-100">
                {Object.entries(selectedNode.details).map(([key, val]) => (
                  <div key={key} className="p-2.5 flex items-center justify-between">
                    <span className="text-slate-500 font-medium text-[11px]">{key}</span>
                    <span className="font-mono text-slate-900 font-bold text-[11px] text-right max-w-[200px] truncate">
                      {String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('recovery')}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm transition-all"
          >
            <span>Inspect Strategic Recovery Options (Strategist Agent)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
