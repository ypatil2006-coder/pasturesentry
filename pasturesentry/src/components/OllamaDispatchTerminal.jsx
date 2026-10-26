import React, { useState } from 'react';
import { soundManager } from '../utils/audio';
import { chatWithDispatcher } from '../utils/ollama';
import { Cpu, ShieldAlert, Send, Sparkles, Terminal, Navigation } from 'lucide-react';

export const OllamaDispatchTerminal = ({
  isBreached,
  activeModel = 'qwen2.5-coder:3b',
}) => {
  const [userQuery, setUserQuery] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isThinking, setIsThinking] = useState(false);

  const handleAskDispatcher = async (e) => {
    e.preventDefault();
    if (!userQuery.trim() || isThinking) return;
    soundManager.playLockBeep();

    const q = userQuery.trim();
    setUserQuery('');
    setChatLog((prev) => [...prev, { sender: 'rancher', text: q }]);
    setIsThinking(true);

    try {
      const history = chatLog.map((c) => ({
        sender: c.sender === 'rancher' ? 'user' : 'dispatcher',
        text: c.text,
      }));
      const answer = await chatWithDispatcher(q, history, activeModel);
      soundManager.playRadarBlip();
      setChatLog((prev) => [...prev, { sender: 'ollama', text: answer }]);
    } catch (err) {
      console.error('Ollama dispatch terminal error:', err);
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'ollama',
          text: `⚠️ LOCAL MODEL ERROR: ${err.message || 'Local Ollama model failed to respond.'}`,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="bg-[#141414] text-white border-4 border-black rounded-2xl p-4 shadow-comic space-y-3 font-mono">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b-2 border-neutral-700 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00D26A] animate-ping" />
          <Terminal className="w-4 h-4 text-[#FFE600]" />
          <span className="font-comic text-xs uppercase text-white tracking-wider">
            OLLAMA EDGE DISPATCH TERMINAL
          </span>
        </div>
        <span className="text-[10px] bg-black text-[#FFE600] border border-[#FFE600] px-2 py-0.5 rounded font-bold">
          {activeModel}
        </span>
      </div>

      {/* Terminal Output Screen */}
      <div className="bg-black p-3 rounded-xl border border-neutral-800 text-xs space-y-2 min-h-[140px] max-h-[180px] overflow-y-auto">
        {isBreached ? (
          <div className="space-y-1.5 animate-fadeIn">
            <div className="flex items-center gap-1.5 text-[#FF3B30] font-black">
              <ShieldAlert className="w-4 h-4" />
              <span>[19:00:03] CRITICAL MUSTER BREACH DETECTED</span>
            </div>
            <div className="text-yellow-200 text-[11px]">
              &bull; <strong>Missing Head:</strong> 4 cattle [COW-12, COW-19, COW-04, COW-31]
            </div>
            <div className="text-neutral-300 text-[11px]">
              &bull; <strong>Last Visual Vector:</strong> CAM-04 (East Gap #42) @ 18:38
            </div>
            <div className="text-neutral-300 text-[11px]">
              &bull; <strong>Velocity / Heading:</strong> 1.4 m/s &bull; Bearing 082&deg; toward Highway 81
            </div>
            <div className="bg-[#FFE600] text-black font-bold p-1.5 rounded border border-black text-[10px] flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" />
              <span>DRONE ALPHA-01 DISPATCHED &bull; INTERCEPTING SECTOR CHARLIE</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1 text-neutral-400 text-[11px]">
            <div>[18:59:40] SENTRY SYSTEM ARMED &bull; 100% OFFLINE AIRPLANE MODE</div>
            <div>[18:59:45] CAM-01 Water Trough: 14 head accounted for.</div>
            <div>[18:59:52] CAM-02 Shelter Barn: 46 head resting in muster corral.</div>
            <div>[19:00:00] Curfew curfew rule active. All 50 head accounted for.</div>
            <div className="text-[#00D26A] font-bold">
              [STATUS] ALL SECTORS SECURED &bull; AWAITING BREACH TRIGGER
            </div>
          </div>
        )}

        {/* Dynamic chat queries */}
        {chatLog.map((msg, idx) => (
          <div
            key={idx}
            className={`text-[11px] p-1.5 rounded ${
              msg.sender === 'rancher'
                ? 'bg-neutral-800 text-yellow-300'
                : 'bg-neutral-900 border border-neutral-700 text-[#00D26A]'
            }`}
          >
            <strong>{msg.sender === 'rancher' ? '🤠 RANCHER:' : '🤖 OLLAMA:'}</strong>{' '}
            {msg.text}
          </div>
        ))}

        {isThinking && (
          <div className="text-[10px] text-yellow-300 flex items-center gap-1 animate-pulse">
            <Sparkles className="w-3 h-3" />
            <span>Ollama synthesizing tactical response on local edge silicon...</span>
          </div>
        )}
      </div>

      {/* Interactive Query Input */}
      <form onSubmit={handleAskDispatcher} className="flex gap-2">
        <input
          type="text"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          placeholder="Ask Ollama: 'Where are they heading?' or 'Dispatch drone!'"
          className="flex-1 bg-black border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFE600]"
        />
        <button
          type="submit"
          className="bg-[#FFE600] hover:bg-[#FFD000] text-black px-3 py-1.5 rounded-xl border border-black font-bold text-xs flex items-center gap-1 btn-comic shadow-comic-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>QUERY</span>
        </button>
      </form>
    </div>
  );
};
