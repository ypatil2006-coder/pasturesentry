import React, { useState } from 'react';
import { useRanch } from '../context/RanchContext';
import { parseScheduleFromNL } from '../utils/ollama';
import { soundManager } from '../utils/audio';
import {
  AlertTriangle,
  Calendar,
  Clock,
  Cpu,
  Flame,
  Plus,
  RotateCcw,
  Send,
  Shield,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';

export const SchedulerPanel = ({ isOpen, onClose }) => {
  const {
    schedules,
    addScheduleRule,
    removeScheduleRule,
    clearSchedules,
    resetDefaultSchedules,
    executeCurfewAudit,
    ollamaStatus,
  } = useRanch();
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Quick preset natural language suggestions for rapid demo
  const quickPrompts = [
    'All cattle must be inside the shelter by 7 PM every day',
    'Audit water trough headcount at 1 PM',
    'East perimeter boundary check at 8 AM',
  ];

  const handlePromptSubmit = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const promptToUse = (typeof textOverride === 'string' ? textOverride : prompt || '').trim();
    if (!promptToUse || isProcessing) return;

    soundManager.playLockBeep();
    setIsProcessing(true);
    setExtractedPreview(null);
    setErrorMessage(null);

    try {
      const result = await parseScheduleFromNL(promptToUse, ollamaStatus.activeModel);
      setExtractedPreview(result);
      addScheduleRule(result.rule);
      setPrompt('');
    } catch (err) {
      console.error('Ollama extraction error:', err);
      setErrorMessage(err.message || 'Local Ollama model failed to parse prompt');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickPromptClick = (text) => {
    setPrompt(text);
    handlePromptSubmit(null, text);
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full sm:w-[460px] bg-[#F4EEDD] halftone-bg border-l-4 border-black z-40 shadow-[-10px_0_0_0_#000] flex flex-col font-mono transition-transform duration-300 ease-out text-black ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Drawer Header */}
      <div className="p-4 border-b-4 border-black flex items-center justify-between bg-[#FFE600]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white border-2 border-black shadow-comic-sm text-black">
            <Cpu className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-sm font-black font-comic tracking-wide text-black flex items-center gap-1.5 uppercase">
              AUTONOMOUS AI SCHEDULER
            </h2>
            <p className="text-[10px] font-bold text-black/70 uppercase">
              Ollama Agent • {ollamaStatus.activeModel}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 bg-white hover:bg-[#FF3B30] hover:text-white text-black rounded-lg border-2 border-black shadow-comic-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Natural Language Prompt Input Box */}
        <div className="bg-white border-3 border-black rounded-2xl p-4 shadow-comic space-y-3">
          <label className="text-xs font-black text-black flex items-center justify-between font-comic">
            <span className="flex items-center gap-1.5 text-black">
              <Sparkles className="w-4 h-4 text-[#FFE600] fill-[#FFE600] stroke-black" />
              NATURAL LANGUAGE INSTRUCTION
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00D26A] text-black border-2 border-black">
              EDGE NLP
            </span>
          </label>

          <form onSubmit={handlePromptSubmit} className="space-y-2.5">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePromptSubmit(e);
                }
              }}
              placeholder='Type a ranch rule (or click a 1-click suggestion below)...'
              rows={3}
              className="w-full bg-[#F4EEDD] border-2 border-black focus:bg-white rounded-xl p-2.5 text-xs text-black font-bold placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-black transition-all resize-none shadow-inner"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-bold text-neutral-600">
                Ollama extracts strict JSON rules
              </span>
              <button
                type="submit"
                disabled={isProcessing || !prompt.trim()}
                className="px-4 py-2 bg-[#00D26A] hover:bg-[#00b85c] text-black font-comic font-black rounded-xl text-xs flex items-center gap-1.5 border-2 border-black shadow-comic-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Zap className="w-3.5 h-3.5 animate-spin" />
                    EXTRACTING...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                    ARM SCHEDULE
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Suggestion Pills (Wrap cleanly without ellipsis truncation) */}
          <div className="pt-2 border-t-2 border-black/10">
            <p className="text-[10px] font-black uppercase text-neutral-600 mb-1.5 font-comic">
              DEMO SUGGESTIONS (1-CLICK):
            </p>
            <div className="space-y-1.5">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPromptClick(qp)}
                  className="w-full text-left text-xs font-bold p-2 bg-[#F4EEDD] hover:bg-[#FFE600] border-2 border-black text-black rounded-xl shadow-comic-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer leading-snug"
                >
                  "{qp}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Extracted Preview Banner */}
        {extractedPreview && (
          <div className="bg-[#00D26A]/20 border-3 border-black rounded-2xl p-3 space-y-1.5 text-xs text-black shadow-comic">
            <div className="flex items-center justify-between font-black text-black font-comic">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 stroke-[2.5]" />
                RULE EXTRACTED & ARMED
              </span>
              <span className="text-[10px] font-mono uppercase bg-white border border-black px-2 py-0.5 rounded font-bold">
                SRC: {extractedPreview.source}
              </span>
            </div>
            <pre className="text-[11px] text-black overflow-x-auto bg-white p-2.5 rounded-xl border-2 border-black font-mono font-bold">
              {JSON.stringify(extractedPreview.rule, null, 2)}
            </pre>
          </div>
        )}

        {/* Live Ollama Error Banner (Zero Hardcoded Fallbacks) */}
        {errorMessage && (
          <div className="bg-[#FF3B30] text-white border-3 border-black rounded-2xl p-3 space-y-1.5 text-xs shadow-comic">
            <div className="flex items-center gap-1.5 font-black font-comic">
              <AlertTriangle className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span>LOCAL MODEL INFERENCE ERROR</span>
            </div>
            <p className="font-mono text-[11px] opacity-95 leading-relaxed bg-black/30 p-2 rounded-lg border border-black/40">
              {errorMessage}
            </p>
            <p className="text-[10px] font-mono opacity-80">
              Zero fallbacks enforced. Please check that Ollama is listening on http://localhost:11434.
            </p>
          </div>
        )}

        {/* Active Operations & Schedules Board */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-black font-black font-comic">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 stroke-[2.5]" />
              ACTIVE OPERATIONS & SCHEDULES ({schedules.length})
            </span>

            <div className="flex items-center gap-1.5">
              {schedules.length > 0 ? (
                <button
                  onClick={clearSchedules}
                  className="px-2 py-1 bg-[#FF3B30] hover:bg-red-600 text-white rounded-lg border-2 border-black shadow-comic-sm font-comic text-[10px] font-black flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                  title="Clear all schedules for fresh testing"
                >
                  <Trash2 className="w-3 h-3 stroke-[2.5]" />
                  <span>CLEAR ALL</span>
                </button>
              ) : (
                <button
                  onClick={resetDefaultSchedules}
                  className="px-2 py-1 bg-[#FFE600] hover:bg-[#FFD000] text-black rounded-lg border-2 border-black shadow-comic-sm font-comic text-[10px] font-black flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                  title="Load bootstrap demo presets"
                >
                  <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                  <span>LOAD PRESETS</span>
                </button>
              )}
            </div>
          </div>

          {/* If clean/empty, show informative testing placeholder */}
          {schedules.length === 0 ? (
            <div className="bg-white border-3 border-dashed border-black/30 rounded-2xl p-6 text-center space-y-3 shadow-comic-sm">
              <div className="w-10 h-10 bg-[#FFE600] border-2 border-black rounded-xl flex items-center justify-center mx-auto shadow-comic-sm">
                <Sparkles className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              <div>
                <h4 className="font-comic font-black text-xs uppercase text-black">
                  SCHEDULER IS CLEAN & READY
                </h4>
                <p className="text-[11px] font-bold text-neutral-600 mt-1 max-w-[280px] mx-auto leading-relaxed">
                  Zero active rules. Type any plain English instruction above or click a demo suggestion to test Ollama schedule extraction!
                </p>
              </div>
              <button
                onClick={resetDefaultSchedules}
                className="px-3.5 py-1.5 bg-[#FFE600] hover:bg-[#FFD000] text-black font-comic font-black text-xs rounded-xl border-2 border-black shadow-comic-sm active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>LOAD 2 DEMO PRESETS</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((rule) => {
                const isCurfew = rule.task_name.includes('Curfew');

                return (
                  <div
                    key={rule.id}
                    className={`border-3 border-black rounded-2xl p-3.5 shadow-comic transition-all space-y-2.5 ${
                      isCurfew ? 'bg-[#FFE600]' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-black font-comic text-black flex items-center gap-1.5 uppercase">
                          {rule.task_name}
                        </h4>
                        <p className="text-[11px] font-bold text-neutral-700 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                          {rule.target_time} MST ({rule.frequency})
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-white text-black border-2 border-black shadow-comic-sm flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-ping" />
                          ARMED
                        </span>
                        <button
                          onClick={() => removeScheduleRule(rule.id)}
                          className="p-1 bg-white hover:bg-[#FF3B30] hover:text-white text-neutral-600 rounded-md border-2 border-black shadow-comic-sm active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                          title={`Delete ${rule.task_name}`}
                        >
                          <Trash2 className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-bold bg-[#F4EEDD] p-2.5 rounded-xl border-2 border-black">
                      <div>
                        <span className="text-neutral-500 text-[10px] uppercase block font-black">ZONE:</span>
                        <p className="text-black font-black break-words leading-tight">{rule.target_zone}</p>
                      </div>
                      <div>
                        <span className="text-neutral-500 text-[10px] uppercase block font-black">HEADCOUNT AUDIT:</span>
                        <p className="text-black font-black">
                          {rule.expected_headcount} Cattle
                        </p>
                      </div>
                    </div>

                    {/* Immediate Trigger Button */}
                    <div className="flex items-center justify-between pt-1 text-[11px] font-bold">
                      <span className="text-neutral-700">
                        ON FAILURE: <span className="text-[#FF3B30] font-black">{rule.action_on_failure}</span>
                      </span>

                      <button
                        onClick={() => executeCurfewAudit(rule)}
                        className={`px-3 py-1 border-2 border-black rounded-lg font-black font-comic shadow-comic-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1 cursor-pointer ${
                          rule.action_on_failure === 'trigger_search_dispatch' || isCurfew
                            ? 'bg-[#FF3B30] hover:bg-red-600 text-white'
                            : 'bg-[#FFE600] hover:bg-[#FFD000] text-black'
                        }`}
                        title={`Trigger audit for ${rule.task_name}`}
                      >
                        {rule.action_on_failure === 'trigger_search_dispatch' || isCurfew ? (
                          <Flame className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 fill-current" />
                        )}
                        <span>AUDIT NOW</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
