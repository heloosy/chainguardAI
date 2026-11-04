import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Package,
  Boxes,
  ClipboardList,
  Truck,
  AlertTriangle,
  GitBranch,
  CheckSquare,
  History,
  Bot,
  PlugZap,
  ShieldCheck,
  Settings
} from 'lucide-react';
import { useApp, NavTab } from '../../context/AppContext';

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ElementType;
  badge?: number | string | null;
  badgeVariant?: 'danger' | 'warning' | 'info' | 'neutral';
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, dataStatus, appStatus } = useApp();

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: Building2,
      badge: dataStatus?.suppliers_count ? dataStatus.suppliers_count : null,
      badgeVariant: 'neutral',
    },
    {
      id: 'products',
      label: 'Products & Materials',
      icon: Package,
      badge: appStatus?.records_count?.products ? appStatus.records_count.products : null,
      badgeVariant: 'neutral',
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Boxes,
      badge: dataStatus?.inventory_count ? dataStatus.inventory_count : null,
      badgeVariant: 'neutral',
    },
    {
      id: 'purchase-orders',
      label: 'Purchase Orders',
      icon: ClipboardList,
      badge: dataStatus?.purchase_orders_count ? dataStatus.purchase_orders_count : null,
      badgeVariant: 'neutral',
    },
    {
      id: 'shipments',
      label: 'Shipments',
      icon: Truck,
      badge: dataStatus?.shipments_count ? dataStatus.shipments_count : null,
      badgeVariant: 'neutral',
    },
    {
      id: 'disruptions',
      label: 'Disruptions',
      icon: AlertTriangle,
      badge: dataStatus?.disruptions_count ? dataStatus.disruptions_count : null,
      badgeVariant: 'danger',
    },
    {
      id: 'recovery-plans',
      label: 'Recovery Plans',
      icon: GitBranch,
      badge: dataStatus?.recovery_plans_count ? dataStatus.recovery_plans_count : null,
      badgeVariant: 'warning',
    },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: CheckSquare,
      badge: dataStatus?.approvals_pending_count ? dataStatus.approvals_pending_count : null,
      badgeVariant: 'warning',
    },
    {
      id: 'incident-history',
      label: 'Incident History',
      icon: History,
    },
    {
      id: 'ai-agents',
      label: 'AI Agents',
      icon: Bot,
      badge: '3 Active',
      badgeVariant: 'info',
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: PlugZap,
      badge: dataStatus?.active_connectors_count ? `${dataStatus.active_connectors_count} Connected` : 'Disconnected',
      badgeVariant: dataStatus?.active_connectors_count ? 'neutral' : 'warning',
    },
    {
      id: 'audit-logs',
      label: 'Audit & Governance',
      icon: ShieldCheck,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none">
      <div className="p-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Resilience Navigation
      </div>
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          const badgeClasses = {
            danger: 'bg-rose-50 text-rose-700 border-rose-200',
            warning: 'bg-amber-50 text-amber-700 border-amber-200',
            info: 'bg-blue-50 text-blue-700 border-blue-200',
            neutral: 'bg-slate-100 text-slate-600 border-slate-200',
          }[item.badgeVariant || 'neutral'];

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition duration-150 group ${
                isActive
                  ? 'bg-blue-50/80 text-blue-700 border border-blue-200/80 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${badgeClasses}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Engine Status</span>
          <span className="font-mono text-emerald-700 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Operational
          </span>
        </div>
      </div>
    </aside>
  );
};
