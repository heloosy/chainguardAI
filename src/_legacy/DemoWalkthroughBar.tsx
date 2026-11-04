import React from 'react';
import { 
  CheckCircle, 
  ArrowRight, 
  Compass, 
  HelpCircle,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  History,
  Layers,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DemoWalkthroughBar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    setSelectedResponse, 
    candidateResponses 
  } = useApp();

  const steps = [
    { 
      num: 1, 
      tab: 'risk', 
      title: '1. Early Warning Detection',
      action: () => setActiveTab('risk'),
    },
    { 
      num: 2, 
      tab: 'network', 
      title: '2. Multi-Tier Dependencies',
      action: () => setActiveTab('network'),
    },
    { 
      num: 3, 
      tab: 'history', 
      title: '3. Historical Memory Match',
      action: () => setActiveTab('history'),
    },
    { 
      num: 4, 
      tab: 'simulator', 
      title: '4. Scenario Comparison',
      action: () => {
        setActiveTab('simulator');
        const opt = candidateResponses.find(c => c.actionType === 'BALANCED_HYBRID');
        if (opt) setSelectedResponse(opt);
      },
    },
    { 
      num: 5, 
      tab: 'simulator', 
      title: '5. Secondary Shortage Flag',
      action: () => {
        setActiveTab('simulator');
        const opt = candidateResponses.find(c => c.actionType === 'INVENTORY_TRANSFER');
        if (opt) setSelectedResponse(opt);
      },
    },
    { 
      num: 6, 
      tab: 'validation', 
      title: '6. Unverified Evidence Gap',
      action: () => {
        setActiveTab('validation');
        const opt = candidateResponses.find(c => c.actionType === 'SUPPLIER_SWITCH');
        if (opt) setSelectedResponse(opt);
      },
    },
    { 
      num: 7, 
      tab: 'validation', 
      title: '7. Decision Gate (4 States)',
      action: () => {
        setActiveTab('validation');
        const opt = candidateResponses.find(c => c.actionType === 'BALANCED_HYBRID');
        if (opt) setSelectedResponse(opt);
      },
    },
    { 
      num: 8, 
      tab: 'validation', 
      title: '8. Human Executive Approval',
      action: () => {
        setActiveTab('validation');
        const opt = candidateResponses.find(c => c.actionType === 'BALANCED_HYBRID');
        if (opt) setSelectedResponse(opt);
      },
    },
    { 
      num: 9, 
      tab: 'history', 
      title: '9. Record Actual Outcome',
      action: () => setActiveTab('history'),
    },
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 text-xs flex items-center justify-between overflow-x-auto text-slate-300">
      <div className="flex items-center space-x-2 shrink-0 pr-3 border-r border-slate-700">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-bold text-slate-200">End-to-End Resilience Journey:</span>
      </div>

      <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-0.5">
        {steps.map((st, idx) => {
          const isCurrent = activeTab === st.tab;
          return (
            <React.Fragment key={st.num}>
              <button
                onClick={st.action}
                className={`flex items-center space-x-1.5 px-2 py-0.5 rounded transition-all whitespace-nowrap text-[11px] ${
                  isCurrent 
                    ? 'bg-blue-600 text-white font-semibold shadow-xs ring-1 ring-blue-400' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  isCurrent ? 'bg-white text-blue-700' : 'bg-slate-700 text-slate-300'
                }`}>
                  {st.num}
                </span>
                <span>{st.title}</span>
              </button>
              {idx < steps.length - 1 && (
                <span className="text-slate-600 text-[10px] hidden xl:inline">›</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="shrink-0 pl-3 border-l border-slate-700 hidden lg:block text-[11px] text-slate-400">
        <span className="text-amber-400 font-medium">Scenario:</span> Shipment delayed, shortage in 4 days
      </div>
    </div>
  );
};
