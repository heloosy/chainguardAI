import React, { useState, useMemo } from 'react';
import { 
  Globe, 
  Radio, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw, 
  Filter, 
  Search, 
  ExternalLink, 
  Info, 
  Cpu, 
  Anchor, 
  Truck, 
  CloudLightning, 
  MapPin, 
  Layers, 
  ChevronRight, 
  Zap, 
  Database,
  ArrowRight,
  Eye,
  Activity,
  Terminal,
  Lock,
  Compass
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GeospatialWarningSource, RiskSeverity, WarningSourceCategory } from '../../types';

// Coordinate projection helper: Equirectangular onto a 1000 x 500 SVG canvas
export const projectCoord = (lat: number, lng: number): { x: number; y: number } => {
  const x = ((lng + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
};

export const GeospatialWarningMap: React.FC = () => {
  const { 
    warningSources, 
    selectedWarningSource, 
    setSelectedWarningSource, 
    refreshWarningSignals,
    dataMode,
    setDataMode,
    setActiveTab,
    setSelectedRisk,
    risks,
    setSelectedResponse,
    candidateResponses
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPayloadRaw, setShowPayloadRaw] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showExplainer, setShowExplainer] = useState<boolean>(true);

  // Active source for drawer (default to selected or first critical)
  const activeSource = selectedWarningSource || warningSources.find(s => s.severity === 'CRITICAL') || warningSources[0];

  // Filtering
  const filteredSources = useMemo(() => {
    return warningSources.filter(source => {
      if (selectedCategory !== 'ALL' && source.category !== selectedCategory) return false;
      if (selectedSeverity !== 'ALL' && source.severity !== selectedSeverity) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          source.name.toLowerCase().includes(q) ||
          source.locationName.toLowerCase().includes(q) ||
          source.sourceSystem.toLowerCase().includes(q) ||
          source.summary.toLowerCase().includes(q) ||
          source.impactedEntity.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [warningSources, selectedCategory, selectedSeverity, searchQuery]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshWarningSignals();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleInspectDisruption = (source: GeospatialWarningSource) => {
    if (source.targetRiskId) {
      const risk = risks.find(r => r.id === source.targetRiskId) || risks[0];
      setSelectedRisk(risk);
      setActiveTab('risk');
    } else {
      setActiveTab('risk');
    }
  };

  const handleViewMitigation = () => {
    const hybrid = candidateResponses.find(c => c.actionType === 'BALANCED_HYBRID') || candidateResponses[0];
    if (hybrid) setSelectedResponse(hybrid);
    setActiveTab('recovery');
  };

  // Severity style helpers
  const getSeverityBadge = (severity: RiskSeverity | 'INFO', status: string) => {
    if (status === 'UNVERIFIED') {
      return {
        bg: 'bg-purple-100 text-purple-800 border-purple-300',
        dot: 'bg-purple-600',
        ring: 'ring-purple-400',
        label: 'UNVERIFIED / PENDING AUDIT'
      };
    }
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-100 text-red-800 border-red-300',
          dot: 'bg-red-600',
          ring: 'ring-red-400',
          label: 'CRITICAL ALERT'
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          ring: 'ring-amber-400',
          label: 'HIGH WARNING'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          dot: 'bg-yellow-500',
          ring: 'ring-yellow-400',
          label: 'ELEVATED RISK'
        };
      case 'LOW':
      case 'INFO':
      default:
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          ring: 'ring-emerald-400',
          label: 'OPERATIONAL / OPTIMAL'
        };
    }
  };

  const getCategoryIcon = (category: WarningSourceCategory) => {
    switch (category) {
      case 'AIS_SATELLITE':
        return <Anchor className="w-4 h-4 text-blue-600" />;
      case 'IOT_TELEMETRY':
        return <Activity className="w-4 h-4 text-indigo-600" />;
      case 'PORT_AUTHORITY':
        return <Compass className="w-4 h-4 text-sky-600" />;
      case 'CARRIER_TMS':
        return <Truck className="w-4 h-4 text-emerald-600" />;
      case 'FOUNDRY_MES':
        return <Cpu className="w-4 h-4 text-violet-600" />;
      case 'COMPLIANCE_AUDIT':
        return <ShieldAlert className="w-4 h-4 text-purple-600" />;
      case 'WEATHER_RADAR':
        return <CloudLightning className="w-4 h-4 text-rose-600" />;
      default:
        return <Radio className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Data Mode Alignment Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200/60">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900">
                  Global Geospatial Warning & Telemetry Map
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  Real Source Feeds
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical sensor origins, AIS vessel transponders, port authorities, weather satellite advisories, and factory WMS telemetry.
              </p>
            </div>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono font-medium">10 Active Sources</span>
            <span className="text-slate-300">|</span>
            <span className="font-medium text-slate-700">14,290 Signals Today</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors shadow-2xs disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>{isRefreshing ? 'Polling Feeds...' : 'Refresh Telemetry'}</span>
          </button>

          <button
            onClick={() => setActiveTab('integrations')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-2xs"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Configure REST Connectors</span>
          </button>
        </div>
      </div>

      {/* Explainer: Why Real Data Needs Consequence Simulation */}
      {showExplainer && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-xl border border-indigo-900/40 shadow-sm relative overflow-hidden">
          <div className="absolute right-4 top-4">
            <button 
              onClick={() => setShowExplainer(false)} 
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-white/10"
            >
              Dismiss
            </button>
          </div>
          <div className="max-w-4xl space-y-3">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded">
                Real-World Grounding
              </span>
              <h2 className="text-sm font-semibold text-white">
                How ChainGuard AI Works With Real Enterprise Data (And Why Simulation Is Mathematically Required)
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Real enterprise feeds (AIS satellite transponders, SAP S/4HANA OData, WMS RFID tags, carrier TMS) provide the <strong className="text-white">ground truth</strong> about delays and inventory counts. However, real-world data only tells you what is happening <em>now</em>. When an 18-day port embargo occurs, executing an emergency stock transfer without running <strong className="text-white">deterministic mass-balance equations</strong> creates <strong className="text-amber-300">secondary shortages</strong> that shut down donor plants.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                <div className="flex items-center space-x-2 text-xs font-semibold text-blue-300 mb-1">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] text-blue-200">1</span>
                  <span>1. Real Signal Ingestion</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Consumes live JSON/OData from AIS transponders, port authorities, and ERP REST connectors shown on the map below.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                <div className="flex items-center space-x-2 text-xs font-semibold text-amber-300 mb-1">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] text-amber-200">2</span>
                  <span>2. Consequence Differential Math</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Calculates cross-facility inventory curves <span className="font-mono text-amber-200">I_B(t)</span> to verify if transferring stock from Munich starves European assembly.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-2.5">
                <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-300 mb-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-200">3</span>
                  <span>3. Zero-Trust Decision Gate</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Blocks unverified supplier candidates (e.g. NexaCore Vietnam) until capacity and ISO certifications are physically verified.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search source, port, system..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-56"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Source Types</option>
            <option value="AIS_SATELLITE">AIS Satellite Transponders</option>
            <option value="IOT_TELEMETRY">Plant IoT & Bin Sensors</option>
            <option value="PORT_AUTHORITY">Port TOS Terminals</option>
            <option value="CARRIER_TMS">Carrier TMS & Flight XML</option>
            <option value="FOUNDRY_MES">Sub-Tier Foundry MES</option>
            <option value="COMPLIANCE_AUDIT">Ariba Compliance Audit</option>
            <option value="WEATHER_RADAR">Weather & Typhoon Radar</option>
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="CRITICAL">Critical Alerts</option>
            <option value="HIGH">High Warnings</option>
            <option value="INFO">Operational Standby</option>
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-[11px] text-slate-500 overflow-x-auto py-1">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
            <span>Critical Disruption</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>High Risk / Advisory</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
            <span>Unverified Zero-Trust</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Operational Feed</span>
          </span>
        </div>
      </div>

      {/* Main Map View & Inspection Drawer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive World Map Canvas */}
        <div className="lg:col-span-8 bg-slate-950 rounded-xl border border-slate-800 shadow-md p-4 relative overflow-hidden flex flex-col">
          {/* Map Top Bar */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/80 text-xs">
            <div className="flex items-center space-x-2 text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
              <span className="text-[11px] text-blue-400 font-semibold">GLOBAL SATELLITE & TELEMETRY RADAR</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <span>Projection: Equirectangular</span>
              <span>•</span>
              <span>Coordinates: WGS84 Standard</span>
            </div>
          </div>

          {/* SVG Map Container */}
          <div className="relative w-full aspect-[2/1] bg-slate-950 rounded-lg overflow-hidden border border-slate-900 select-none">
            <svg
              viewBox="0 0 1000 500"
              className="w-full h-full object-contain"
              style={{ background: 'radial-gradient(ellipse at center, #091326 0%, #030712 100%)' }}
            >
              <defs>
                {/* Glowing Marker Filters */}
                <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>

                {/* Linear Gradients for Route Arcs */}
                <linearGradient id="grad-red" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f87171" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="grad-amber" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* Grid Lines (Longitude & Latitude) */}
              <g className="opacity-15 stroke-slate-600" strokeWidth="0.5" strokeDasharray="3 3">
                {/* Equator */}
                <line x1="0" y1="250" x2="1000" y2="250" strokeWidth="1" stroke="#38bdf8" opacity="0.4" />
                {/* Tropic of Cancer (23.5 N) */}
                <line x1="0" y1="184.7" x2="1000" y2="184.7" />
                {/* Tropic of Capricorn (23.5 S) */}
                <line x1="0" y1="315.3" x2="1000" y2="315.3" />
                {/* Prime Meridian (0) */}
                <line x1="500" y1="0" x2="500" y2="500" strokeWidth="1" stroke="#38bdf8" opacity="0.4" />
                {/* 90W */}
                <line x1="250" y1="0" x2="250" y2="500" />
                {/* 90E */}
                <line x1="750" y1="0" x2="750" y2="500" />
              </g>

              {/* Stylized Vector World Continents */}
              <g fill="#1e293b" stroke="#334155" strokeWidth="0.8" className="transition-all duration-300">
                {/* North America */}
                <path d="M 115 80 L 175 60 L 235 65 L 290 85 L 280 130 L 230 145 L 250 180 L 220 200 L 195 180 L 170 215 L 145 180 L 105 150 L 100 110 Z" />
                {/* Greenland */}
                <path d="M 330 45 L 390 40 L 410 70 L 370 100 L 330 85 Z" />
                {/* South America */}
                <path d="M 230 235 L 280 240 L 330 270 L 320 330 L 290 390 L 250 420 L 235 370 L 220 300 Z" />
                {/* Europe */}
                <path d="M 465 110 L 515 90 L 565 95 L 560 140 L 520 155 L 485 150 L 470 130 Z" />
                {/* United Kingdom & Ireland */}
                <path d="M 460 100 L 475 95 L 475 115 L 460 120 Z" />
                {/* Africa */}
                <path d="M 470 170 L 545 160 L 585 210 L 595 260 L 560 350 L 515 370 L 480 320 L 465 240 L 450 190 Z" />
                {/* Asia (Eurasia) */}
                <path d="M 570 95 L 650 75 L 750 70 L 870 90 L 890 140 L 850 170 L 800 190 L 760 210 L 715 220 L 685 190 L 640 180 L 600 160 Z" />
                {/* Indian Subcontinent */}
                <path d="M 685 190 L 730 200 L 715 265 L 685 240 Z" />
                {/* Southeast Asia */}
                <path d="M 760 210 L 810 215 L 805 270 L 775 275 L 765 235 Z" />
                {/* Japan */}
                <path d="M 880 135 L 895 145 L 885 175 L 870 165 Z" />
                {/* Taiwan */}
                <path d="M 830 185 L 838 185 L 836 195 L 828 195 Z" stroke="#60a5fa" strokeWidth="1" fill="#1e3a8a" />
                {/* Indonesia & Philippines */}
                <path d="M 780 280 L 840 280 L 855 315 L 790 320 Z" />
                <path d="M 830 220 L 845 230 L 835 255 L 825 240 Z" />
                {/* Australia */}
                <path d="M 800 340 L 880 330 L 920 370 L 890 430 L 820 425 L 790 380 Z" />
              </g>

              {/* Major Global Shipping Corridors (Subtle Dashed Paths) */}
              <g className="opacity-25 stroke-blue-400" strokeWidth="1" strokeDasharray="4 6" fill="none">
                {/* Trans-Pacific Route (Kaohsiung/Yokohama -> Long Beach/Austin) */}
                <path d="M 834 187 C 920 160, 980 140, 1000 140" />
                <path d="M 0 140 C 50 140, 120 150, 171 156" />
                {/* Europe-Asia via Suez / Bab-el-Mandeb */}
                <path d="M 532 116 C 560 160, 600 200, 620 215 C 680 230, 750 250, 834 187" />
                {/* Transatlantic (Munich/Rotterdam -> Austin/Gulf Coast) */}
                <path d="M 532 116 C 450 120, 320 140, 228 165" />
              </g>

              {/* Route Arcs between specific Source Nodes and Destinations */}
              {filteredSources.map((source) => {
                if (!source.routeArcTo) return null;
                const origin = projectCoord(source.coordinates[0], source.coordinates[1]);
                const dest = projectCoord(source.routeArcTo[0], source.routeArcTo[1]);

                // Calculate bezier control point
                const midX = (origin.x + dest.x) / 2;
                const midY = Math.min(origin.y, dest.y) - 40;

                const isDisrupted = source.severity === 'CRITICAL';
                const strokeColor = source.arcColor || (isDisrupted ? '#ef4444' : '#10b981');

                return (
                  <g key={`arc-${source.id}`}>
                    <path
                      d={`M ${origin.x} ${origin.y} Q ${midX} ${midY} ${dest.x} ${dest.y}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isDisrupted ? '2.5' : '1.8'}
                      strokeDasharray={isDisrupted ? '6 4' : '4 4'}
                      opacity={isDisrupted ? '0.85' : '0.6'}
                      className={isDisrupted ? 'animate-pulse' : ''}
                    />
                    {/* Destination Marker */}
                    <circle
                      cx={dest.x}
                      cy={dest.y}
                      r="4"
                      fill={strokeColor}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}

              {/* Geospatial Source Warning Markers */}
              {filteredSources.map((source) => {
                const pt = projectCoord(source.coordinates[0], source.coordinates[1]);
                const isSelected = activeSource?.id === source.id;
                const isCritical = source.severity === 'CRITICAL';
                const isHigh = source.severity === 'HIGH';
                const isUnverified = source.status === 'UNVERIFIED';

                let pinColor = '#10b981'; // green
                let filterId = 'glow-emerald';

                if (isUnverified) {
                  pinColor = '#a855f7'; // purple
                  filterId = 'glow-purple';
                } else if (isCritical) {
                  pinColor = '#ef4444'; // red
                  filterId = 'glow-red';
                } else if (isHigh) {
                  pinColor = '#f59e0b'; // amber
                  filterId = 'glow-amber';
                }

                return (
                  <g
                    key={source.id}
                    className="cursor-pointer group"
                    onClick={() => setSelectedWarningSource(source)}
                  >
                    {/* Animated Pulsing Ring for Critical / High */}
                    {(isCritical || isHigh) && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isSelected ? '14' : '10'}
                        fill="none"
                        stroke={pinColor}
                        strokeWidth="1.5"
                        opacity="0.75"
                        className="animate-ping"
                      />
                    )}

                    {/* Outer Selection Highlight */}
                    {isSelected && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="12"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        opacity="0.9"
                      />
                    )}

                    {/* Main Pin Circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? '7' : isCritical ? '6' : '5'}
                      fill={pinColor}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      filter={`url(#${filterId})`}
                    />

                    {/* Center Core */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="2"
                      fill="#0f172a"
                    />

                    {/* Quick Label on Hover / Selection */}
                    <g className={`${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200 pointer-events-none`}>
                      <rect
                        x={pt.x > 800 ? pt.x - 170 : pt.x + 12}
                        y={pt.y - 14}
                        width="160"
                        height="26"
                        rx="4"
                        fill="#0f172a"
                        stroke="#334155"
                        strokeWidth="1"
                        opacity="0.95"
                      />
                      <text
                        x={pt.x > 800 ? pt.x - 162 : pt.x + 20}
                        y={pt.y + 3}
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="600"
                        fontFamily="monospace"
                      >
                        {source.locationName.length > 20 ? source.locationName.slice(0, 18) + '...' : source.locationName}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* In-Map Quick Overlay Info */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-xs border border-slate-700/80 px-3 py-2 rounded-lg text-slate-200 text-xs shadow-lg max-w-sm pointer-events-none">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="font-semibold text-white">Active Primary Disruption:</span>
                <span className="font-mono text-red-400">Typhoon Gaemi</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Kaohsiung Port outer anchorage embargo • Container vessel Ever Forward delayed +18 days
              </p>
            </div>

            <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs border border-slate-700/80 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-300 font-mono flex items-center space-x-2">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>LIVE AIS & IOT FEED INGESTION</span>
            </div>
          </div>

          {/* Quick Click Indicator Bar */}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Click any marker above to inspect raw telemetric payload, source API, and downstream impacts.</span>
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              Showing {filteredSources.length} of {warningSources.length} sources
            </span>
          </div>
        </div>

        {/* Source Detail & Real Telemetry Inspection Drawer */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getCategoryIcon(activeSource.category)}
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  {activeSource.category.replace('_', ' ')}
                </span>
              </div>

              {/* Status Badge */}
              {(() => {
                const badge = getSeverityBadge(activeSource.severity, activeSource.status);
                return (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center space-x-1 ${badge.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                    <span>{badge.label}</span>
                  </span>
                );
              })()}
            </div>

            <h3 className="text-base font-bold text-slate-900 mt-2">
              {activeSource.name}
            </h3>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{activeSource.locationName}, {activeSource.country}</span>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="p-4 space-y-4 text-xs flex-1 overflow-y-auto max-h-[580px]">
            {/* Core Summary Card */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div className="font-semibold text-slate-800 flex items-center justify-between">
                <span>Observed Telemetry</span>
                <span className="text-[10px] font-mono text-slate-500">
                  {activeSource.dataFreshness}
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {activeSource.summary}
              </p>
            </div>

            {/* Ingestion & Origin Details */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Source System</span>
                <span className="font-semibold text-slate-800 break-words mt-0.5 block">
                  {activeSource.sourceSystem}
                </span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Protocol</span>
                <span className="font-semibold font-mono text-blue-700 mt-0.5 block">
                  {activeSource.connectionProtocol}
                </span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Coordinates</span>
                <span className="font-mono text-slate-700 mt-0.5 block">
                  {activeSource.coordinates[0].toFixed(4)}°, {activeSource.coordinates[1].toFixed(4)}°
                </span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Data Grounding</span>
                <span className={`font-semibold text-[10px] px-1.5 py-0.5 rounded inline-block mt-0.5 ${
                  activeSource.isVerifiedRealData 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-purple-100 text-purple-800 border border-purple-300'
                }`}>
                  {activeSource.isVerifiedRealData ? 'VERIFIED TELEMETRY' : 'UNVERIFIED AUDIT'}
                </span>
              </div>
            </div>

            {/* Impacted Supply Chain Entity */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-900 block">
                Impacted Supply Chain Entity
              </span>
              <div className="text-xs font-semibold text-slate-900">
                {activeSource.impactedEntity}
              </div>
              {activeSource.suggestedAction && (
                <p className="text-[11px] text-amber-800 mt-1">
                  <strong>Recommended Engine Response:</strong> {activeSource.suggestedAction}
                </p>
              )}
            </div>

            {/* Raw JSON Telemetry Inspector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-600" />
                  <span>Real Ingestion Payload (JSON)</span>
                </span>
                <button
                  onClick={() => setShowPayloadRaw(!showPayloadRaw)}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showPayloadRaw ? 'Collapse' : 'Expand'}
                </button>
              </div>

              {showPayloadRaw && (
                <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto border border-slate-800 shadow-inner max-h-48">
                  <pre className="text-emerald-400">
                    {JSON.stringify(activeSource.telemetryPayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => handleInspectDisruption(activeSource)}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition-colors shadow-2xs"
              >
                <span>Inspect in Disruption Monitor (Agent 1)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleViewMitigation}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg text-xs transition-colors"
              >
                <Cpu className="w-3.5 h-3.5 text-slate-600" />
                <span>Strategic Recovery Action (Strategist Agent)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Stream Ticker Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Real-Time Source Signals Stream</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live normalized packets arriving from external REST webhooks, IoT MQTT brokers, and AIS marine streams.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            HTTP 200 OK • Ingestion Latency: 42ms avg
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Source Name</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-3">Location / Geo</th>
                <th className="py-2.5 px-3">Freshness</th>
                <th className="py-2.5 px-3">Impact Target</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSources.map((source) => {
                const badge = getSeverityBadge(source.severity, source.status);
                const isSelected = activeSource.id === source.id;

                return (
                  <tr 
                    key={`row-${source.id}`}
                    className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
                  >
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center space-x-1 ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                        <span>{source.severity}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {source.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-blue-600">
                      {source.connectionProtocol}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {source.locationName}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                      {source.dataFreshness}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {source.impactedEntity}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedWarningSource(source)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        Inspect Pin
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};