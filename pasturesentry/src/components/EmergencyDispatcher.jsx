import React, { useState, useRef, useEffect } from 'react';
import { useRanch } from '../context/RanchContext';
import { chatWithDispatcher, synthesizeSARDispatch } from '../utils/ollama';
import { soundManager } from '../utils/audio';
import {
  AlertTriangle,
  Bot,
  CheckCircle,
  Compass,
  FileText,
  MapPin,
  MessageSquare,
  Navigation,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  Terminal,
  User,
  X,
  Zap,
} from 'lucide-react';

export const EmergencyDispatcher = ({ isOpen, onClose }) => {
  const {
    breachEvent,
    sarReport,
    isSynthesizingSAR,
    resolveBreach,
    ollamaStatus,
  } = useRanch();

  const fallbackBreach = {
    ruleId: 'rule-curfew-01',
    taskName: 'Evening Shelter Curfew',
    curfew: '19:00',
    expectedCount: 50,
    inShelterCount: 46,
    missingCount: 4,
    missingIds: ['COW-12', 'COW-19', 'COW-04', 'COW-31'],
    transit_log: [
      { cow_id: 'COW-12', last_cam: 'East Fence (CAM-04)', last_time: '18:35', heading: 'East towards Highway 81' },
      { cow_id: 'COW-19', last_cam: 'East Fence (CAM-04)', last_time: '18:38', heading: 'East towards Highway 81' },
      { cow_id: 'COW-04', last_cam: 'Water Trough (CAM-01)', last_time: '17:10', heading: 'North Creek Riparian Brush' },
      { cow_id: 'COW-31', last_cam: 'Water Trough (CAM-01)', last_time: '17:10', heading: 'North Creek Riparian Brush' },
    ],
    timestamp: '19:00:00',
  };

  const activeBreach = breachEvent || fallbackBreach;

  const [activeTab, setActiveTab] = useState('DISPATCH_DIRECTIVE'); // 'DISPATCH_DIRECTIVE' | 'TRANSIT_LOGS' | 'TACTICAL_CHAT'
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'dispatcher',
      time: '19:00:15',
      text: '🚨 ALERT: Curfew breach confirmed at 19:00. 4 cattle unaccounted for. Thermal drone dispatched to East Fence corridor. Ready for situational orders.',
    },
  ]);
  const [isChatting, setIsChatting] = useState(false);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    soundManager.playLockBeep();
    const userMsg = {
      sender: 'user',
      time: new Date().toLocaleTimeString(),
      text: chatInput,
    };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatting(true);

    try {
      const reply = await chatWithDispatcher(userMsg.text, messages, ollamaStatus.activeModel);
      soundManager.playRadioChirp();
      setMessages((prev) => [
        ...prev,
        {
          sender: 'dispatcher',
          time: new Date().toLocaleTimeString(),
          text: reply,
        },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'dispatcher',
          time: new Date().toLocaleTimeString(),
          text: `⚠️ LOCAL MODEL ERROR: ${err.message || 'Local Ollama failed to respond. No hardcoded fallbacks.'}`,
        },
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm font-mono">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#F4EEDD] halftone-bg border-4 border-black rounded-3xl shadow-comic-xl flex flex-col overflow-hidden text-black">
        {/* Flashing Top Alert Banner */}
        <div className="bg-[#FF3B30] px-5 py-3 border-b-4 border-black flex items-center justify-between text-white font-black font-comic tracking-wide text-sm">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 animate-bounce text-[#FFE600] fill-[#FF3B30] stroke-black stroke-[2.5]" />
            <span className="uppercase tracking-wider">CRITICAL INCIDENT: CURFEW BREACH & PERIMETER COMPROMISE</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="bg-white text-black px-2.5 py-1 rounded-lg border-2 border-black font-bold shadow-comic-sm">
              AUDIT: 46/50 (4 MISSING)
            </span>
            <button
              onClick={onClose}
              className="p-1.5 bg-white text-black hover:bg-[#FFE600] rounded-lg border-2 border-black shadow-comic-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Tactical Subheader & Navigation Tabs */}
        <div className="px-4 py-3 bg-[#FFE600] border-b-4 border-black flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('DISPATCH_DIRECTIVE')}
              className={`px-3.5 py-1.5 rounded-xl border-2 border-black flex items-center gap-1.5 font-comic font-black text-xs transition-all shadow-comic-sm cursor-pointer ${
                activeTab === 'DISPATCH_DIRECTIVE'
                  ? 'bg-[#FF3B30] text-white'
                  : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
              OLLAMA SAR DISPATCH
            </button>

            <button
              onClick={() => setActiveTab('TRANSIT_LOGS')}
              className={`px-3.5 py-1.5 rounded-xl border-2 border-black flex items-center gap-1.5 font-comic font-black text-xs transition-all shadow-comic-sm cursor-pointer ${
                activeTab === 'TRANSIT_LOGS'
                  ? 'bg-[#FF3B30] text-white'
                  : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 stroke-[2.5]" />
              TRANSIT LOGS & BREADCRUMBS
            </button>

            <button
              onClick={() => setActiveTab('TACTICAL_CHAT')}
              className={`px-3.5 py-1.5 rounded-xl border-2 border-black flex items-center gap-1.5 font-comic font-black text-xs transition-all shadow-comic-sm cursor-pointer ${
                activeTab === 'TACTICAL_CHAT'
                  ? 'bg-[#00D26A] text-black'
                  : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
              DISPATCHER CHAT
            </button>
          </div>

          <div className="text-[11px] font-bold text-black hidden sm:flex items-center gap-2">
            <span>MODEL: {ollamaStatus.activeModel}</span>
            <span className="bg-[#00D26A] px-2 py-0.5 rounded-full border-2 border-black text-black text-[10px] font-black">• 100% OFFLINE</span>
          </div>
        </div>

        {/* Tab 1: Ollama Tactical SAR Dispatch Report */}
        {activeTab === 'DISPATCH_DIRECTIVE' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isSynthesizingSAR ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <RefreshCw className="w-8 h-8 text-[#FF3B30] animate-spin stroke-[2.5]" />
                <p className="text-sm font-black font-comic text-black tracking-wider uppercase">
                  OLLAMA SYNTHESIZING TACTICAL SEARCH & RESCUE DIRECTIVE...
                </p>
                <p className="text-xs font-bold text-neutral-600">
                  Calculating speed vectors, fence gap telemetry & highway traffic buffer
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Source Engine Badge */}
                <div className="flex items-center justify-between text-xs border-b-2 border-black/20 pb-2">
                  <div className="flex items-center gap-2 text-black font-black font-comic">
                    <Radio className="w-4 h-4 text-[#FF3B30] animate-pulse stroke-[2.5]" />
                    <span className="font-black text-sm">AUTONOMOUS SEARCH VECTOR DIRECTIVE</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-[#FF3B30] border-2 border-black text-white px-2.5 py-0.5 rounded-full uppercase shadow-comic-sm">
                    ORIGIN: {sarReport?.source || 'OLLAMA EDGE'}
                  </span>
                </div>

                {/* Tactical Dispatch Text */}
                <div
                  className={`border-3 border-black rounded-2xl p-4 text-xs font-mono font-bold leading-relaxed whitespace-pre-wrap shadow-comic max-h-[45vh] overflow-y-auto ${
                    sarReport?.error
                      ? 'bg-[#FF3B30] text-white selection:bg-black selection:text-white'
                      : 'bg-black text-[#FFE600] selection:bg-[#FF3B30] selection:text-white'
                  }`}
                >
                  {sarReport?.text || 'Awaiting live dispatch directive synthesis from local Ollama model...'}
                </div>

                {/* Quick Action Dispatch Commands */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="bg-white border-3 border-black p-3.5 rounded-2xl shadow-comic">
                    <span className="text-[10px] font-black text-neutral-500 uppercase">PRIORITY 1 TARGET</span>
                    <p className="text-base font-black font-comic text-[#FF3B30] mt-0.5">COW-12 & COW-19</p>
                    <p className="text-xs font-bold text-black">East Highway 81 Buffer (0.85 mi)</p>
                  </div>
                  <div className="bg-white border-3 border-black p-3.5 rounded-2xl shadow-comic">
                    <span className="text-[10px] font-black text-neutral-500 uppercase">DRONE SENTRY-01</span>
                    <p className="text-base font-black font-comic text-[#00D26A] mt-0.5">DISPATCHED (FLIR)</p>
                    <p className="text-xs font-bold text-black">Altitude: 45m | Waypoint: East-04</p>
                  </div>
                  <div className="bg-white border-3 border-black p-3.5 rounded-2xl shadow-comic">
                    <span className="text-[10px] font-black text-neutral-500 uppercase">GROUND TEAM CODE</span>
                    <p className="text-base font-black font-comic text-black mt-0.5">INTERCEPT ALPHA</p>
                    <p className="text-xs font-bold text-black">Block East Gate Culvert</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Recent Transit Logs & Trajectory Breakdown */}
        {activeTab === 'TRANSIT_LOGS' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            <h3 className="text-black font-black font-comic flex items-center gap-1.5 text-sm uppercase">
              <Navigation className="w-4 h-4 text-[#FF3B30] stroke-[2.5]" />
              LAST OBSERVED TRANSIT LOG (MISSING CATTLE BREADCRUMBS)
            </h3>

            <div className="border-3 border-black rounded-2xl overflow-hidden shadow-comic bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FFE600] text-black text-[11px] font-black uppercase border-b-3 border-black">
                    <th className="p-3">COW ID</th>
                    <th className="p-3">LAST SENSOR CAM</th>
                    <th className="p-3">TIME OBSERVED</th>
                    <th className="p-3">ESTIMATED HEADING</th>
                    <th className="p-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 text-black font-bold">
                  {activeBreach.transit_log.map((log, idx) => {
                    const isHighwayThreat = log.heading.includes('Highway');
                    return (
                      <tr key={idx} className="hover:bg-[#F4EEDD] transition-colors">
                        <td className="p-3 font-black text-black flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] animate-ping" />
                          {log.cow_id}
                        </td>
                        <td className="p-3 text-neutral-800">{log.last_cam}</td>
                        <td className="p-3 text-black font-mono font-black">{log.last_time} MST</td>
                        <td className="p-3">{log.heading}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black border-2 border-black shadow-comic-sm ${
                              isHighwayThreat
                                ? 'bg-[#FF3B30] text-white'
                                : 'bg-[#FFE600] text-black'
                            }`}
                          >
                            {isHighwayThreat ? 'CRITICAL RISK' : 'MODERATE RISK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-[#FFE600] border-3 border-black rounded-2xl p-4 text-black space-y-1 shadow-comic">
              <h4 className="font-black font-comic flex items-center gap-1.5 text-black uppercase">
                <AlertTriangle className="w-4 h-4 fill-black stroke-[#FFE600]" />
                SPATIAL REASONING VECTOR SUMMARY
              </h4>
              <p className="text-xs font-bold text-neutral-900 leading-relaxed">
                Telemetry indicates herd separation initiated at 17:10 near Central Water Trough.
                COW-12 and COW-19 drifted eastward along the drainage ditch, finding an opening at
                fence post 42 (East Boundary). Neon dashed breadcrumbs on the 3D aerial view show the
                exact ground trace.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Interactive Tactical Chat with Dispatcher */}
        {activeTab === 'TACTICAL_CHAT' && (
          <div className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden text-xs">
            {/* Chat Messages Log */}
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto space-y-3 bg-[#F4EEDD] border-3 border-black rounded-2xl p-4 shadow-inner"
            >
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    m.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-neutral-600 mb-1 font-comic uppercase">
                    {m.sender === 'user' ? (
                      <>
                        <span>RANCH OPERATOR</span>
                        <User className="w-3.5 h-3.5 stroke-[2.5]" />
                      </>
                    ) : (
                      <>
                        <Bot className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>TACTICAL DISPATCHER</span>
                      </>
                    )}
                    <span>• {m.time}</span>
                  </div>

                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl border-2 border-black leading-relaxed font-bold text-xs shadow-comic-sm ${
                      m.sender === 'user'
                        ? 'bg-[#FFE600] text-black rounded-tr-none'
                        : 'bg-white text-black rounded-tl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {isChatting && (
                <div className="flex items-center gap-2 text-black font-bold text-xs italic">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF3B30]" />
                  Dispatcher is calculating tactical response...
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Dispatcher: e.g. What is drone battery level? Should we deploy ATV to highway?"
                className="flex-1 bg-white border-2 border-black focus:border-black rounded-xl px-3.5 py-2.5 text-xs text-black font-bold focus:outline-none focus:ring-2 focus:ring-black shadow-comic-sm"
              />
              <button
                type="submit"
                disabled={isChatting || !chatInput.trim()}
                className="px-5 py-2.5 bg-[#00D26A] hover:bg-[#00b85c] text-black font-black font-comic rounded-xl text-xs border-2 border-black shadow-comic-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                TRANSMIT
              </button>
            </form>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="p-4 bg-white border-t-4 border-black flex items-center justify-between text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#F4EEDD] hover:bg-neutral-200 border-2 border-black rounded-xl text-black font-black font-comic shadow-comic-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            MINIMIZE DISPATCH (KEEP ACTIVE)
          </button>

          <button
            onClick={resolveBreach}
            className="px-5 py-2 bg-[#00D26A] hover:bg-[#00b85c] text-black font-black font-comic rounded-xl flex items-center gap-2 border-2 border-black shadow-comic active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <CheckCircle className="w-4 h-4 stroke-[2.5]" />
            ACKNOWLEDGE & RESOLVE INCIDENT
          </button>
        </div>
      </div>
    </div>
  );
};
