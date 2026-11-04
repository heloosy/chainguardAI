import React, { useState, useEffect } from 'react';
import { Settings, Save, Database, Trash2, ShieldCheck, Sliders, RefreshCw } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../common/PageHeader';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { useToast } from '../common/Toast';

export const SettingsPage: React.FC = () => {
  const { seedFixtures, clearData, dataStatus, isLoadingStatus } = useApp();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Record<string, { value: string; description: string }>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Dialog states
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [isSeedOpen, setIsSeedOpen] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getSettings();
      setSettings(res);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (key: string, value: string) => {
    try {
      setSavingKey(key);
      await apiClient.updateSetting(key, value);
      showToast('success', 'Setting Saved', `Updated ${key.replace(/_/g, ' ')}`);
      setSettings((prev) => ({
        ...prev,
        [key]: { ...prev[key], value },
      }));
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <PageHeader
        title="Resilience Policy & Settings"
        description="Configure enterprise risk thresholds, executive approval governance triggers, external telemetry intervals, and data fixture state."
        breadcrumbs={[{ label: 'Settings' }]}
        actions={
          <button
            onClick={fetchSettings}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {/* Section 1: Data Mode Management */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">Data Layer Isolation & Environment Mode</h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          In Phase 1, development fixtures allow you to verify UI layouts, relational drawer navigation, and governance workflows. Use the controls below to load or completely purge fixtures to test empty states.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-800">Current Operational Data Mode</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {dataStatus?.is_fixtures_loaded ? (
                <span className="text-amber-700 font-medium">Development Fixtures Active (5 Suppliers, 5 Inventory SKUs, 4 POs, 3 Shipments)</span>
              ) : (
                <span className="text-slate-600 font-medium">Empty State (Awaiting Live Enterprise Connectors)</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsSeedOpen(true)}
              disabled={isLoadingStatus}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition shadow-2xs disabled:opacity-50"
            >
              Seed Fixtures
            </button>
            <button
              onClick={() => setIsClearOpen(true)}
              disabled={isLoadingStatus}
              className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition disabled:opacity-50"
            >
              Purge All Data
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Governance & Decision Thresholds */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Sliders className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">Governance Gate Policies & Thresholds</h2>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {/* Threshold 1: Financial Authorization Gate */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-800">Executive Approval Financial Threshold (USD)</div>
              <div className="text-slate-500 mt-0.5 max-w-md">
                Recovery plans with estimated expediting cost equal to or exceeding this threshold require Tier-2 VP sign-off.
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                defaultValue={settings.approval_financial_threshold_usd?.value || '50000'}
                onBlur={(e) => handleUpdate('approval_financial_threshold_usd', e.target.value)}
                className="w-32 px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-slate-400 font-medium">USD</span>
            </div>
          </div>

          {/* Threshold 2: Starvation Warning Window */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-800">Starvation Forecasting Horizon (Days)</div>
              <div className="text-slate-500 mt-0.5 max-w-md">
                Lookahead window for projecting assembly plant stockouts and triggering early warning alerts.
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                defaultValue={settings.starvation_warning_horizon_days?.value || '14'}
                onBlur={(e) => handleUpdate('starvation_warning_horizon_days', e.target.value)}
                className="w-32 px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-slate-400 font-medium">Days</span>
            </div>
          </div>

          {/* Threshold 3: Telemetry Cadence */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-800">Telemetry Scanning Interval (Minutes)</div>
              <div className="text-slate-500 mt-0.5 max-w-md">
                External AIS transponder, weather advisory, and EDI carrier notice polling interval.
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                defaultValue={settings.default_telemetry_interval_mins?.value || '15'}
                onBlur={(e) => handleUpdate('default_telemetry_interval_mins', e.target.value)}
                className="w-32 px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-slate-400 font-medium">Minutes</span>
            </div>
          </div>

          {/* Threshold 4: Strict Mode Governance */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-800">Deterministic Governance Strict Mode</div>
              <div className="text-slate-500 mt-0.5 max-w-md">
                Strictly prohibits autonomous execution of purchase orders or logistics rerouting without audited human approval.
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                ENFORCED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={isClearOpen}
        onClose={() => setIsClearOpen(false)}
        onConfirm={async () => {
          setIsClearOpen(false);
          await clearData();
        }}
        title="Purge Operational Database?"
        message="This will delete all development records to test the pristine zero-data state across all 12 modules."
        confirmLabel="Purge All Records"
        variant="danger"
      />

      <ConfirmationDialog
        isOpen={isSeedOpen}
        onClose={() => setIsSeedOpen(false)}
        onConfirm={async () => {
          setIsSeedOpen(false);
          await seedFixtures();
        }}
        title="Load Development Fixtures?"
        message="This will populate isolated development fixtures for suppliers, inventory, purchase orders, shipments, disruptions, recovery plans, and governance approvals."
        confirmLabel="Load Fixtures"
        variant="info"
      />
    </div>
  );
};

