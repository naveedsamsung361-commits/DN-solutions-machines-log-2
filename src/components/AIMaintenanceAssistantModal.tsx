import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Copy, 
  Check, 
  RotateCcw, 
  AlertTriangle, 
  Wrench, 
  ExternalLink, 
  Cpu, 
  Package, 
  ShieldAlert, 
  Activity,
  Layers
} from 'lucide-react';
import { aiAssistantService } from '../services/aiAssistantService';
import { storageService } from '../services/storage';
import { AIMessage, BreakdownTicket, Machine } from '../types';

interface AIMaintenanceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTicket: (ticket: BreakdownTicket) => void;
  onSelectMachine: (machine: Machine) => void;
  onNavigateTab?: (tab: string) => void;
}

const SUGGESTED_PROMPTS = [
  'Which machines have the highest downtime this month?',
  'Show unresolved breakdowns affecting production.',
  'Which machines have overdue maintenance?',
  'Find previous tickets involving spindle vibration.',
  'Which spare parts are below minimum stock?',
  'Summarize yesterday\'s shift handover.',
  'Calculate MTTR for the previous 30 days.'
];

export const AIMaintenanceAssistantModal: React.FC<AIMaintenanceAssistantModalProps> = ({
  isOpen,
  onClose,
  onSelectTicket,
  onSelectMachine,
  onNavigateTab
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 **Welcome to the DN Solutions AI Maintenance Assistant.**

I have real-time access to registered CNC machines, breakdown logs, preventive maintenance schedules, spare parts inventory, and shift handovers.

Select a quick question below or ask in natural language:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || isLoading) return;

    const userMsg: AIMessage = {
      id: `USER-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const assistantMsg = await aiAssistantService.ask(q, [...messages, userMsg]);
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      console.error('Error querying AI assistant:', e);
      setMessages(prev => [
        ...prev,
        {
          id: `ERR-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ An unexpected error occurred while analyzing records. Please retry.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome_reset',
        role: 'assistant',
        content: 'Session reset. Ask me anything about machine downtime, tickets, spare parts, or diagnostic recommendations.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleCitationClick = (citation: { recordType: string; recordId: string }) => {
    if (citation.recordType === 'ticket') {
      const ticket = storageService.getTickets().find(t => t.id === citation.recordId || t.ticketNumber === citation.recordId);
      if (ticket) {
        onClose();
        onSelectTicket(ticket);
      }
    } else if (citation.recordType === 'machine') {
      const machine = storageService.getMachines().find(m => m.id === citation.recordId || m.machineId === citation.recordId);
      if (machine) {
        onClose();
        onSelectMachine(machine);
      }
    } else if (citation.recordType === 'part') {
      onClose();
      onNavigateTab?.('spares');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl h-[92vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-600/30 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading-industrial font-bold text-base sm:text-lg text-white tracking-wide">
                  AI MAINTENANCE ASSISTANT
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60 uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Grounded In Fleet Records
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Intelligent root-cause diagnosis, downtime analytics, and natural language shop-floor queries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs transition-colors flex items-center gap-1"
              title="Clear conversation"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
              title="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Safety & Protocol Banner */}
        <div className="bg-amber-950/30 border-b border-amber-800/40 px-4 py-2 flex items-center gap-2 text-[11px] text-amber-300/90 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Engineering Guardrail:</strong> AI responses cite actual records. Safety-critical troubleshooting requires qualified technician verification and physical LOTO. No direct machine commands executed.
          </span>
        </div>

        {/* Chat History Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-sm bg-slate-950/40">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-sm space-y-2 ${
                  isUser 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}>
                  <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 border-b border-slate-800/60 pb-1 mb-1.5">
                    <span className="font-semibold text-slate-300">
                      {isUser ? 'Technician / User' : 'DN AI Assistant'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="hover:text-white transition-colors"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>

                  {/* Interactive Citations / Jump-to Record Chips */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 mt-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1.5">
                        Referenced Operational Records:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleCitationClick(c)}
                            className="px-2 py-0.5 rounded bg-slate-950 hover:bg-blue-950 border border-slate-700 hover:border-blue-500 text-blue-300 text-[10px] font-mono flex items-center gap-1 transition-all group"
                          >
                            {c.recordType === 'ticket' ? (
                              <Wrench className="w-3 h-3 text-red-400" />
                            ) : c.recordType === 'machine' ? (
                              <Cpu className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Package className="w-3 h-3 text-amber-400" />
                            )}
                            <span className="group-hover:underline">{c.label}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-200 border border-blue-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                <span>Searching breakdown logs, telemetry, and machine records...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggested Prompt Pills */}
        <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800/80 shrink-0">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Suggested Inquiries</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white text-[11px] transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form Bar */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about breakdown tickets, spindle alarms, downtime, MTTR, or spare parts..."
              className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
