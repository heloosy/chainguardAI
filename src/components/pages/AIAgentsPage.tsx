import React, { useState, useEffect } from 'react';
import { Bot, Play, Power, RefreshCw, Activity, ShieldCheck, Cpu, Layers } from 'lucide-react';
import { apiClient, AgentRecord } from '../../services/apiClient';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import { useToast } from '../common/Toast';

export const AIAgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getAgents();
      setAgents(res);
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleRunCycle = async (agentId: string, agentName: string) => {
    try {
      setRunningAgentId(agentId);
      const res = await apiClient.runAgentCycle(agentId);
      showToast('success', `${agentName} Active`, 'Triggered telemetry scan cycle across multi-tier corridors.');
      await fetchAgents();
    } catch (err: any) {
      showToast('error', 'Execution Error', err.message);
    } finally {
      setRunningAgentId(null);
    }
  };

  const handleToggle = async (agentId: string, agentName: string) => {
    try {
      const res = await apiClient.toggleAgent(agentId);
      showToast('info', 'Agent State Updated', res.message);
      await fetchAgents();
    } catch (err: any) {
      showToast('error', 'Toggle Error', err.message);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="AI Resilience Agents"
        description="Autonomous multi-agent intelligence swarm coordinating early warning detection, secondary consequence trajectory simulations, and evidence-based decision validation."
        breadcrumbs={[{ label: 'AI Agents' }]}
        actions={
          <button
            onClick={fetchAgents}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium">Checking agent processes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div
              key={agent.agent_id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition duration-150"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={agent.status} size="sm" isFixture={agent.is_fixture} />
                    <span className="font-mono text-[10px] text-slate-400">{agent.version}</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">{agent.agent_name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{agent.role}</p>

                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 space-y-2 mb-4 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Active Telemetry Threads</span>
                    <span className="font-mono font-semibold text-slate-800">{agent.active_tasks_count} threads</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Last Telemetry Scan</span>
                    <span className="font-mono text-slate-700">
                      {agent.last_run_at ? new Date(agent.last_run_at).toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>
                </div>

                {agent.description && (
                  <p className="text-[11px] text-slate-500 italic mb-4 leading-normal">
                    "{agent.description}"
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => handleToggle(agent.agent_id, agent.agent_name)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                    agent.status === 'DISABLED'
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <Power className="w-3.5 h-3.5 text-slate-500" />
                  {agent.status === 'DISABLED' ? 'Enable' : 'Disable'}
                </button>

                <button
                  onClick={() => handleRunCycle(agent.agent_id, agent.agent_name)}
                  disabled={runningAgentId === agent.agent_id || agent.status === 'DISABLED'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-2xs transition"
                >
                  {runningAgentId === agent.agent_id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  Run Cycle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

