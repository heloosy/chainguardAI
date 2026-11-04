import React from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  ShieldAlert, 
  Package, 
  Truck, 
  ArrowRight, 
  CheckCircle2, 
  AlertOctagon,
  Factory as FactoryIcon,
  Layers,
  ChevronRight,
  Info,
  Calendar,
  ShieldCheck,
  History,
  FileCheck,
  UserCheck,
  Cpu,
  Globe,
  Radio,
  Activity,
  Anchor,
  Compass,
  Bot
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { useApp } from '../../context/AppContext';

export const OverviewDashboard: React.FC = () => {
  const { 
    kpis, 
    risks, 
    suppliers, 
    components,
    orders, 
    factories, 
    purchaseOrders,
    candidateResponses,
    validationReports,
    similarIncidents,
    warningSources,
    setSelectedWarningSource,
    dataMode,
    setSelectedRisk, 
    setSelectedResponse,
    setActiveTab 
  } = useApp();

  // 14-day trend simulation data
  const trendData = [
    { day: 'Day -6', riskLevel: 32, exposure: 420 },
    { day: 'Day -5', riskLevel: 35, exposure: 450 },
    { day: 'Day -4', riskLevel: 30, exposure: 410 },
    { day: 'Day -3', riskLevel: 42, exposure: 680 },
    { day: 'Day -2', riskLevel: 48, exposure: 720 },
    { day: 'Day -1', riskLevel: 65, exposure: 1100 },
    { day: 'Today', riskLevel: 94, exposure: 1845 },
    { day: 'Day +1', riskLevel: 98, exposure: 2400 },
    { day: 'Day +2', riskLevel: 92, exposure: 2100 },
    { day: 'Day +3', riskLevel: 75, exposure: 1400 },
    { day: 'Day +4', riskLevel: 45, exposure: 800 },
  ];

  const handleRiskClick = (risk: any) => {
    setSelectedRisk(risk);
    setActiveTab('recovery');
  };

  const handlePlanClick = (plan: any) => {
    setSelectedResponse(plan);
    setActiveTab('recovery');
  };

  const topMatch = similarIncidents[0];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Operational Incident Alert Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-xl p-4 shadow-sm border border-blue-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-blue-500/20 rounded-lg border border-blue-400/30 text-blue-300">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="font-semibold text-sm flex items-center space-x-2">
              <span>Operational Resilience Control Tower — Live Incident Detection</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono border bg-emerald-500/30 text-emerald-200 border-emerald-400/30 font-bold">
                LIVE ENTERPRISE FEED
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Super Typhoon Gaemi caused Kaohsiung port embargo for Taiwan semiconductor freight. 
              Austin Gigafactory faces line stoppage in 19.2 operational hours unless mitigated.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setActiveTab('agent-swarm')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-200" />
            <span>Agent Swarm</span>
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 shadow-sm transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>Warning Map</span>
          </button>
          <button
            onClick={() => setActiveTab('recovery')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <span>Strategic Recovery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Section 2 metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Metric 1: Overall Risk Status */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-blue-300" onClick={() => setActiveTab('risk')}>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Overall Risk Status</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">CRITICAL</div>
          <div className="text-[11px] text-red-700 font-medium mt-1 flex items-center">
            <span className="font-bold mr-1">{kpis.criticalRisksCount}</span> Active Disruption
          </div>
        </div>

        {/* Metric 2: Delayed POs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Delayed POs</span>
            <Truck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{kpis.delayedPOsCount}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            PO #4500981240 (+18d)
          </div>
        </div>

        {/* Metric 3: At-Risk Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">At-Risk Orders</span>
            <Package className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{kpis.atRiskOrdersCount}</div>
          <div className="text-[11px] text-orange-600 font-medium mt-1">
            SO-008901 (EV Titan)
          </div>
        </div>

        {/* Metric 4: Days Until Shortage */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Days to Shortage</span>
            <FactoryIcon className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">0.8 Days</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Austin Gigafactory (40 units)
          </div>
        </div>

        {/* Metric 5: Financial Exposure */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Financial Exposure</span>
            <DollarSign className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            ${(kpis.totalFinancialExposure / 1000).toFixed(0)}k
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Idle loss & SLA penalties
          </div>
        </div>

        {/* Metric 6: Pending Checks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-purple-300" onClick={() => setActiveTab('validation')}>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Checks</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {kpis.evidencePendingCount + 1}
          </div>
          <div className="text-[11px] text-purple-700 font-medium mt-1">
            1 Evidence • 1 Approval
          </div>
        </div>
      </div>

      {/* Main Section: Chart + Dependency flow preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Risk Exposure & Trend Over Time */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Disruption Trajectory & Financial Exposure Curve
              </h2>
              <p className="text-xs text-slate-500">
                Derived deterministically from plant burn rates ($185k/day idle overhead) and OEM contractual delay penalties ($45k/day)
              </p>
            </div>
            <span className="text-xs font-mono font-medium px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Units: USD Thousands ($k)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="exposureGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} 
                  formatter={(val: any) => [`$${val}k`, 'Financial Exposure']}
                />
                <Area type="monotone" dataKey="exposure" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#exposureGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-red-500 inline-block mr-1.5"></span>
                Unmitigated Exposure Peak: $2.4M at Day +1
              </span>
              <span className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block mr-1.5"></span>
                Optimal Recovery Spend: $68.5k (Net savings: $3.24M)
              </span>
            </div>
            <span className="font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => setActiveTab('recovery')}>
              Compare candidate strategies →
            </span>
          </div>
        </div>

        {/* Right 1 Col: Interconnected Nodes & Bottleneck Preview */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-slate-900">
                Network Interdependence
              </h2>
              <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200">
                Shared Bottleneck
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Both Austin and Munich assemble products relying on MCU-8849 from Supplier X.
            </p>

            {/* Visual Node Diagram */}
            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-red-900">Supplier X (Apex Micro, Taiwan)</div>
                  <div className="text-[11px] text-red-700">Delayed 18 days (Typhoon Gaemi)</div>
                </div>
                <span className="text-[10px] font-bold bg-red-200 text-red-900 px-1.5 py-0.5 rounded">
                  Origin Risk
                </span>
              </div>

              <div className="flex justify-center text-slate-400 font-mono text-[11px]">↓ supplies MCU-8849</div>

              <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-center font-mono font-medium text-slate-800">
                COMP-MCU-8849 (Microcontroller)
              </div>

              <div className="flex justify-around text-slate-400 font-mono text-[11px]">
                <span>↙ Factory A</span>
                <span>↘ Factory B</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-red-50 border border-red-300 text-center">
                  <div className="font-bold text-red-900">Austin Gigafactory</div>
                  <div className="text-[10px] text-red-700 font-semibold">Stock: 40 units</div>
                  <div className="text-[9px] text-slate-500">Runout: 19h (0.8d)</div>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-300 text-center">
                  <div className="font-bold text-blue-900">Munich Precision</div>
                  <div className="text-[10px] text-blue-700 font-semibold">Stock: 520 units</div>
                  <div className="text-[9px] text-slate-500">Threshold: 180 units</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('network')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>Inspect Multi-Tier Graph Visualization</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Geospatial Warning Sources from Live Origin Feeds */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Geospatial Warning Sources & Physical Telemetry
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Live Origin Feeds
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Warning signals tracked across satellite AIS feeds, plant floor IoT loadcells, carrier TMS, and supplier compliance audits.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('map')}
            className="flex items-center space-x-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50/60 hover:bg-blue-100/80 px-3 py-1.5 rounded-lg border border-blue-200/60"
          >
            <span>Open Interactive Warning Map ({warningSources.length} Sources)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Source Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {warningSources.slice(0, 4).map((source) => {
            const isCrit = source.severity === 'CRITICAL';
            const isHigh = source.severity === 'HIGH';

            return (
              <div
                key={source.id}
                onClick={() => {
                  setSelectedWarningSource(source);
                  setActiveTab('map');
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
                  isCrit 
                    ? 'bg-red-50/40 border-red-200 hover:border-red-400' 
                    : isHigh 
                    ? 'bg-amber-50/30 border-amber-200 hover:border-amber-400' 
                    : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    {source.category.replace('_', ' ')}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    isCrit 
                      ? 'bg-red-100 text-red-800 border-red-300' 
                      : isHigh 
                      ? 'bg-amber-100 text-amber-800 border-amber-300' 
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {source.severity}
                  </span>
                </div>

                <div className="font-bold text-xs text-slate-900 line-clamp-1 mb-1">
                  {source.name}
                </div>
                <div className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-2">
                  {source.summary}
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{source.locationName}</span>
                  <span className="text-blue-600 font-medium">Inspect →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delayed Purchase Orders & Delivery Risks (Prompt Section 2 requirement) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Delayed Purchase Orders & Inbound Delivery Risks
            </h2>
            <p className="text-xs text-slate-500">
              Telemetry synchronized from ERP Purchase Order Schedule Lines and Carrier AIS Feeds
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            {purchaseOrders.length} Inbound POs Monitored
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4">PO Number</th>
                <th className="py-2.5 px-4">Supplier</th>
                <th className="py-2.5 px-4">Component</th>
                <th className="py-2.5 px-4">Destination Plant</th>
                <th className="py-2.5 px-4">Original ETA</th>
                <th className="py-2.5 px-4">Projected ETA</th>
                <th className="py-2.5 px-4">Variance</th>
                <th className="py-2.5 px-4">Status & Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseOrders.map((po) => {
                const isCrit = po.status === 'CRITICAL_DELAY';
                const isDel = po.status === 'DELAYED';

                return (
                  <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{po.poNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{po.supplierName}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{po.componentName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{po.quantity} units (${po.totalAmount.toLocaleString()})</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{po.destinationFactoryName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{po.originalDeliveryDate}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{po.projectedDeliveryDate}</td>
                    <td className="py-3 px-4 font-mono">
                      {po.delayedDays > 0 ? (
                        <span className="text-red-600 font-bold">+{po.delayedDays} days</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">On Schedule</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                          isCrit 
                            ? 'bg-red-100 text-red-800 border-red-300' 
                            : isDel 
                            ? 'bg-amber-100 text-amber-800 border-amber-300' 
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {po.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{po.riskImpact}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Recovery Plans Under Consideration + Historical Recovery Outcomes Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recovery Plans Currently Under Consideration */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Recovery Strategies Under Consideration
              </h2>
              <p className="text-xs text-slate-500">
                Evaluated deterministically across cost, delivery delay, and secondary consequences
              </p>
            </div>
            <button
              onClick={() => setActiveTab('simulator')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>Full Studio</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {candidateResponses.map((cand) => {
              const report = validationReports[cand.id];
              const isRecommended = cand.id === 'ACT-BALANCED-03';

              return (
                <div 
                  key={cand.id}
                  onClick={() => handlePlanClick(cand)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isRecommended 
                      ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-500/20' 
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        {isRecommended && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                            Recommended
                          </span>
                        )}
                        <span className="font-bold text-slate-900 text-xs">{cand.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">{cand.description}</div>
                    </div>

                    <span className={`text-[9px] px-2 py-0.5 rounded border font-bold shrink-0 ${
                      cand.validationOutcome === 'BLOCKED'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : cand.validationOutcome === 'EVIDENCE_REQUIRED'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : cand.validationOutcome === 'APPROVAL_REQUIRED'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      {cand.validationOutcome.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                    <span>Spend: <strong>${cand.estimatedCost.toLocaleString()}</strong></span>
                    <span>Line Downtime: <strong>{cand.recoveryTimeDays} days</strong></span>
                    <span>Secondary Risk: <strong className={cand.secondaryShortage.detected ? 'text-red-600' : 'text-emerald-600'}>
                      {cand.secondaryShortage.detected ? 'DETECTED' : 'Zero'}
                    </strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Historical Disruptions & Memory Preview */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Historical Memory & Past Outcomes
                </h2>
                <p className="text-xs text-slate-500">
                  Past incident retrieval to avoid repeating secondary failure patterns
                </p>
              </div>
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <span>View Memory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {topMatch && (
              <div className="mt-3 p-4 rounded-lg bg-indigo-50/70 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    MATCH ({topMatch.similarityScore}%)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{topMatch.date}</span>
                </div>

                <div className="font-bold text-slate-900 text-xs">{topMatch.title}</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <strong>What Failed in 2024:</strong> Supply planners transferred 400 units from Munich to Austin. Munich ran out on Day 3.2, creating a secondary line shutdown and $942k in emergency freight loss.
                </p>

                <div className="p-2.5 bg-white rounded border border-indigo-100 text-[11px] text-indigo-950 font-medium">
                  <strong>Lesson Applied Today:</strong> Rule SEC-01 blocks Option 1. Option 3 limits Munich transfer to 180 units and supplements with certified Supplier Z cargo.
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('history')}
            className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <span>Explore All Historical Cases & Record Outcomes</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
