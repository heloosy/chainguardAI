import React, { useState } from 'react';
import { Radio, AlertTriangle, CloudLightning, Anchor, Flame, Plus, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RiskSeverity } from '../../types';

export const DisruptionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { injectDisruption, suppliers, setActiveTab } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'WEATHER' | 'LOGISTICS' | 'QUALITY' | 'GEOPOLITICAL'>('WEATHER');
  const [severity, setSeverity] = useState<RiskSeverity>('CRITICAL');
  const [location, setLocation] = useState('');
  const [durationDays, setDurationDays] = useState(14);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || 'SUP-X');

  const presets = [
    {
      title: 'Typhoon Gaemi Port Embargo (Default Seed)',
      category: 'WEATHER',
      severity: 'CRITICAL',
      location: 'Kaohsiung Port / Taiwan Strait',
      durationDays: 18,
      supplierId: 'SUP-X',
      icon: CloudLightning,
      desc: 'Halts ocean container carrier "Ever Forward" with 2,500 units of MCU-8849.',
    },
    {
      title: 'Rotterdam Port Crane Strike & Terminal Gridlock',
      category: 'LOGISTICS',
      severity: 'HIGH',
      location: 'Rotterdam Maasvlakte, Netherlands',
      durationDays: 10,
      supplierId: 'SUP-D',
      icon: Anchor,
      desc: 'Container dwell time spikes from 2.8 days to 12.4 days across North Sea freight.',
    },
    {
      title: 'Semiconductor Cleanroom Power Fluctuation',
      category: 'QUALITY',
      severity: 'HIGH',
      location: 'Hsinchu Science Park, Taiwan',
      durationDays: 8,
      supplierId: 'SUP-X',
      icon: Flame,
      desc: 'Lot scrapping triggers urgent delivery delay notices across 3 automotive customers.',
    },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    injectDisruption({
      title: p.title,
      category: p.category as any,
      severity: p.severity as any,
      location: p.location,
      estimatedDurationDays: p.durationDays,
      impactedSuppliers: [p.supplierId],
      description: p.desc,
    });
    onClose();
    setActiveTab('risk');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    injectDisruption({
      title,
      category,
      severity,
      location: location || 'Global Transit Hub',
      estimatedDurationDays: Number(durationDays),
      impactedSuppliers: [selectedSupplierId],
      description: `Custom simulated disruption injected at ${location || 'transit hub'}.`,
    });
    onClose();
    setActiveTab('risk');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-amber-500 animate-pulse" />
            <h3 className="text-base font-bold text-slate-900">
              Simulate External Disruption Event (Agent 1)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Inject a supply shock into the SAP data feeds to test rule-based early warning detection and downstream propagation.
        </p>

        {/* Quick Presets */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Quick Incident Presets:
          </div>
          <div className="space-y-2">
            {presets.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  onClick={() => handleApplyPreset(p)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all flex items-start space-x-3 text-xs"
                >
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{p.title}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 uppercase">
                        {p.severity}
                      </span>
                    </div>
                    <div className="text-slate-500 mt-0.5 text-[11px]">{p.desc}</div>
                    <div className="text-slate-400 text-[10px] mt-1 font-mono">
                      Location: {p.location} • Impact: +{p.durationDays} days delay
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Form */}
        <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-slate-200 space-y-3 text-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Or Configure Custom Event:
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Disruption Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Baltic Sea Cable Severance"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Severity</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Impacted Supplier</label>
              <select
                value={selectedSupplierId}
                onChange={e => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded-lg font-semibold flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Inject & Recalculate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
