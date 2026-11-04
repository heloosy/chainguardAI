import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Terminal, 
  Activity, 
  ShieldAlert, 
  Network, 
  Cpu, 
  ShieldCheck, 
  History, 
  FileText, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  RefreshCw, 
  Zap, 
  MessageSquare,
  Lock,
  Layers,
  ChevronRight,
  Database
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AgentRole, AgentLogType } from '../../types';

export const AgenticCommandCenter: React.FC = () => {
  const { 
    agents, 
    agentActivities, 
    isAgentRunning, 
    dispatchAgentPrompt,
    setActiveTab,
    dataMode
  } = useApp();

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');

  const handleSendPrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isAgentRunning) return;
    const text = inputPrompt;
    setInputPrompt('');
    await dispatchAgentPrompt(text);
  };

  const handlePresetClick = async (presetText: string) => {
    if (isAgentRunning) return;
    await dispatchAgentPrompt(presetText);
  };

  // Filter logs
  const filteredLogs = agentActivities.filter(log => {
    if (selectedAgentFilter !== 'ALL' && log.agentRole !== selectedAgentFilter) return false;
    if (logSearchQuery.trim() !== '') {
      const q = logSearchQuery.toLowerCase();
      return (
        log.content.toLowerCase().includes(q) ||
        log.agentName.toLowerCase().includes(q) ||
        (log.toolInvoked && log.toolInvoked.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Icon mapping
  const getAgentIcon = (role: AgentRole) => {
    switch (role) {
      case 'SENTINEL':
        return <Activity className="w-5 h-5 text-red-600" />;
      case 'IMPACT_REASONER':
        return <Network className="w-5 h-5 text-blue-600" />;
      case 'STRATEGIST':
        return <Cpu className="w-5 h-5 text-amber-600" />;
      case 'EVIDENCE_VERIFIER':
        return <ShieldCheck className="w-5 h-5 text-purple-600" />;
      case 'GOVERNANCE_GATE':
        return <Lock className="w-5 h-5 text-emerald-600" />;
      case 'MEMORY_REASONER':
        return <History className="w-5 h-5 text-indigo-600" />;
      default:
        return <Bot className="w-5 h-5 text-slate-600" />;
    }
  };

  const getLogBadge = (type: AgentLogType) => {
    switch (type) {
      case 'TOOL_CALL':
        return { bg: 'bg-blue-100 text-blue-800 border-blue-200', label: 'TOOL CALL' };
      case 'OBSERVATION':
        return { bg: 'bg-slate-100 text-slate-800 border-slate-200', label: 'OBSERVATION' };
      case 'INTER_AGENT_MSG':
        return { bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'CROSS-AGENT MSG' };
      case 'DECISION':
        return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'DECISION' };
      case 'ACTION_PROPOSED':
        return { bg: 'bg-purple-100 text-purple-800 border-purple-200', label: 'ACTION PROPOSED' };
      case 'THOUGHT':
      default:
        return { bg: 'bg-amber-100 text-amber-800 border-amber-200', label: 'REASONING' };
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Agent Swarm Architecture */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 border border-indigo-900/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30 text-indigo-300">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white">
                  Autonomous Multi-Agent Command Center
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider font-semibold">
                  6 Agents Orchestrated
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  dataMode === 'CONNECTED' 
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' 
                    : 'bg-blue-500/20 text-blue-200 border-blue-400/30'
                }`}>
                  {dataMode === 'CONNECTED' ? 'REAL LIVE DATA' : 'DEMO PERSISTENCE'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Collaborative agent swarm executing continuous origin anomaly detection, graph cascade traversal, zero-trust verification, and policy-gated execution.
              </p>
            </div>
          </div>
        </div>

        {/* Swarm Quick Stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-right">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Inferences Today</span>
            <span className="text-base font-bold font-mono text-emerald-400">4,137 ops</span>
          </div>

          <button
            onClick={() => setActiveTab('real-data')}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Ingest Real JSON Payload</span>
          </button>
        </div>
      </div>

      {/* 6 Specialized Agent Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const isAwaiting = agent.status === 'AWAITING_INPUT';

          return (
            <div 
              key={agent.role}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                      {getAgentIcon(agent.role)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">
                        {agent.name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        {agent.role}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${
                    isAwaiting 
                      ? 'bg-purple-50 text-purple-700 border-purple-200' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isAwaiting ? 'bg-purple-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                    <span>{agent.status.replace('_', ' ')}</span>
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed mt-2 mb-3">
                  {agent.description}
                </p>

                {/* Current Active Task */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 mb-3">
                  <span className="text-[9px] font-mono uppercase font-bold text-slate-500 block mb-0.5">
                    Current Operational Focus
                  </span>
                  <p className="text-[11px] text-slate-800 font-medium line-clamp-2">
                    {agent.currentTask}
                  </p>
                </div>

                {/* Assigned Tools */}
                <div className="space-y-1 mb-3">
                  <span className="text-[9px] font-mono uppercase font-bold text-slate-400 block">
                    Assigned Execution Tools
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {agent.assignedTools.map((tool) => (
                      <span 
                        key={tool}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {tool}()
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Inferences: {agent.totalInferencesToday}</span>
                <span>Active {agent.lastActionTime}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Command & Prompt Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Interactive Agent Swarm Direct Prompt & Instruction
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Autonomous multi-turn reasoning with live citations
          </span>
        </div>

        {/* Preset Prompt Suggestions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-slate-400 font-mono">Presets:</span>
          <button
            onClick={() => handlePresetClick('Sentinel: What is the current AIS satellite status for Port of Kaohsiung?')}
            disabled={isAgentRunning}
            className="text-[11px] px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            🚢 Sentinel: Kaohsiung AIS Status
          </button>
          <button
            onClick={() => handlePresetClick('Verifier: Why was the 450-unit transfer from Munich blocked under Rule SEC-01?')}
            disabled={isAgentRunning}
            className="text-[11px] px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            🛡️ Verifier: Munich Transfer Audit
          </button>
          <button
            onClick={() => handlePresetClick('Verifier: Check audit compliance and ISO-26262 status of NexaCore Vietnam.')}
            disabled={isAgentRunning}
            className="text-[11px] px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            🔍 Verifier: NexaCore Ariba Audit
          </button>
          <button
            onClick={() => handlePresetClick('Memory Agent: Retrieve the closest historical parallel to this typhoon embargo.')}
            disabled={isAgentRunning}
            className="text-[11px] px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            🧠 Memory: 2024 Yantian Precedent
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendPrompt} className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Give instruction or query the agent swarm (e.g. 'Strategist: Formulate an air expedite option avoiding Munich cannibalization')..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={isAgentRunning}
              className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isAgentRunning}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors disabled:opacity-50 shadow-xs"
          >
            {isAgentRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Reasoning...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Instruct Swarm</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Live Agent Reasoning Trace Stream */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Live Agent Reasoning & Decision Stream
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                Deterministic Audit Trail
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent multi-agent chain-of-thought, tool calls, and cross-agent verification messages.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search trace..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg w-44 focus:outline-hidden"
              />
            </div>

            <select
              value={selectedAgentFilter}
              onChange={(e) => setSelectedAgentFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Agents</option>
              <option value="SENTINEL">Sentinel Agent</option>
              <option value="IMPACT_REASONER">Impact Reasoner</option>
              <option value="STRATEGIST">Strategist Agent</option>
              <option value="EVIDENCE_VERIFIER">Evidence Verifier</option>
              <option value="GOVERNANCE_GATE">Governance Gate</option>
              <option value="MEMORY_REASONER">Memory Reasoner</option>
            </select>
          </div>
        </div>

        {/* Activity Stream Feed */}
        <div className="space-y-3 font-sans">
          {filteredLogs.map((log) => {
            const badge = getLogBadge(log.type);

            return (
              <div 
                key={log.id}
                className="p-3.5 rounded-lg border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                      {getAgentIcon(log.agentRole)}
                      <span>{log.agentName}</span>
                    </span>

                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${badge.bg}`}>
                      {badge.label}
                    </span>

                    {log.targetAgent && (
                      <span className="text-[10px] text-slate-500 font-mono flex items-center space-x-1">
                        <span>→ Target:</span>
                        <strong className="text-slate-700">{log.targetAgent}</strong>
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">
                    {log.timestamp}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {log.content}
                </p>

                {/* Tool Invocation Parameter Details */}
                {log.toolInvoked && (
                  <div className="mt-2 p-2 bg-slate-900 rounded-md font-mono text-[11px] text-slate-200 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-blue-400">Tool Executed: </span>
                      <strong className="text-amber-300">{log.toolInvoked}()</strong>
                      {log.toolParameters && (
                        <span className="text-slate-400 ml-2">
                          args: {JSON.stringify(log.toolParameters)}
                        </span>
                      )}
                    </div>
                    {log.confidenceScore && (
                      <span className="text-[10px] text-emerald-400">
                        Confidence: {(log.confidenceScore * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};