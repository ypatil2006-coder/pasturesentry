import React from 'react';
import { useRanch } from '../context/RanchContext';
import { soundManager } from '../utils/audio';
import {
  Clock,
  DoorOpen,
  Droplets,
  FastForward,
  Flame,
  Home,
  Pause,
  Play,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Volume2,
  VolumeX,
} from 'lucide-react';

// Format 24-hour time string "HH:MM" into readable 12-hour format "07:00 PM"
const formatTime12h = (time24) => {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
};

// Compute visual metadata (colors, icons, short labels) for any schedule rule created by Local LLM
const getRuleMeta = (rule) => {
  const nameStr = (rule.task_name || '').toLowerCase();
  const zoneStr = (rule.target_zone || '').toLowerCase();

  const isDispatch =
    rule.action_on_failure === 'trigger_search_dispatch' ||
    nameStr.includes('curfew') ||
    nameStr.includes('breach');

  const isWater =
    zoneStr.includes('cam-01') ||
    zoneStr.includes('water') ||
    zoneStr.includes('trough') ||
    nameStr.includes('water') ||
    nameStr.includes('trough');

  const isGate =
    zoneStr.includes('cam-03') ||
    zoneStr.includes('gate') ||
    nameStr.includes('gate');

  if (isDispatch) {
    return {
      color: '#FF3B30',
      bgColor: 'bg-[#FF3B30]',
      textColor: 'text-white',
      icon: Flame,
      label: 'CURFEW BREACH',
      badgeClass: 'bg-[#FF3B30] text-white',
    };
  }
  if (isWater) {
    return {
      color: '#FFE600',
      bgColor: 'bg-[#FFE600]',
      textColor: 'text-black',
      icon: Droplets,
      label: 'WATER AUDIT',
      badgeClass: 'bg-[#FFE600] text-black',
    };
  }
  if (isGate) {
    return {
      color: '#00D26A',
      bgColor: 'bg-[#00D26A]',
      textColor: 'text-black',
      icon: DoorOpen,
      label: 'GATE CHECK',
      badgeClass: 'bg-[#00D26A] text-black',
    };
  }
  return {
    color: '#FFE600',
    bgColor: 'bg-[#FFE600]',
    textColor: 'text-black',
    icon: Home,
    label: rule.task_name.slice(0, 14),
    badgeClass: 'bg-white text-black',
  };
};

export const TimeScrubber = () => {
  const {
    timeMinutes,
    setTimeMinutes,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    setTimePreset,
    ranchStatus,
    isMuted,
    setIsMuted,
    schedules,
    setIsDrawerOpen,
  } = useRanch();

  const hours = Math.floor(timeMinutes / 60);
  const minutes = Math.floor(timeMinutes % 60);
  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    setTimeMinutes(val);

    // If scrubbing close to ANY active schedule created by LLM, snap and trigger
    const matched = schedules.find((s) => {
      const [h, m] = (s.target_time || '12:00').split(':').map(Number);
      const schedMin = (h || 0) * 60 + (m || 0);
      return Math.abs(val - schedMin) < 3;
    });

    if (matched && matched.status === 'ARMED') {
      const [h, m] = (matched.target_time || '12:00').split(':').map(Number);
      setTimePreset(h, m);
    }
  };

  const togglePlay = () => {
    soundManager.playLockBeep();
    setIsPlaying(!isPlaying);
  };

  const cycleSpeed = () => {
    soundManager.playLockBeep();
    if (playbackSpeed === 1) setPlaybackSpeed(5);
    else if (playbackSpeed === 5) setPlaybackSpeed(20);
    else setPlaybackSpeed(1);
  };

  return (
    <div className="w-full bg-white border-t-4 border-black p-2.5 sm:p-3 flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-xs shadow-comic text-black z-30">
      {/* Left: Current Time Digital Display & Play Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className={`p-2 rounded-xl border-2 border-black flex items-center justify-center btn-comic shadow-comic-sm transition-all cursor-pointer ${
            isPlaying
              ? 'bg-[#00D26A] text-black'
              : 'bg-[#FFE600] text-black hover:bg-[#FFD000]'
          }`}
          title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
        </button>

        {/* Speed Multiplier Button */}
        <button
          onClick={cycleSpeed}
          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-neutral-100 border-2 border-black text-black flex items-center gap-1 font-black btn-comic shadow-comic-sm cursor-pointer"
          title="Cycle Speed (1x, 5x, 20x)"
        >
          <FastForward className="w-3.5 h-3.5 text-black" />
          <span>{playbackSpeed}x</span>
        </button>

        {/* Big Glowing Digital Clock */}
        <div className="flex items-center gap-2 bg-[#051C0F] text-[#00FF66] px-3.5 py-1.5 rounded-xl border-2 border-black shadow-comic-sm drop-shadow-[0_0_8px_rgba(0,255,102,0.4)]">
          <Clock className="w-4 h-4 text-[#00FF66]" />
          <span className="text-sm font-black tracking-widest">
            {formattedTime} <span className="text-[10px] text-[#00FF66]/80 font-normal">MST</span>
          </span>
          <span
            className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase tracking-wider border ${
              ranchStatus === 'BREACH'
                ? 'bg-[#FF3B30] text-white border-black animate-pulse'
                : ranchStatus === 'AUDITING'
                ? 'bg-[#FFE600] text-black border-black'
                : 'bg-[#00D26A] text-black border-black'
            }`}
          >
            {ranchStatus}
          </span>
        </div>
      </div>

      {/* Middle: 24-Hour Timeline Slider & Dynamic LLM Schedule Markers */}
      <div className="flex-1 w-full max-w-xl flex flex-col space-y-1">
        {/* Dynamic Timeline Header Labels */}
        <div className="flex items-center justify-between text-[10px] text-neutral-800 font-bold px-1 overflow-x-auto gap-2">
          <span className="flex items-center gap-1 shrink-0">
            <Sunrise className="w-3 h-3 text-[#FFBD2E]" /> 06:00 DAWN
          </span>

          {/* Dynamic Badges for Armed Schedules created by Local LLM */}
          {schedules.length > 0 ? (
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {schedules.map((rule) => {
                const [h, m] = (rule.target_time || '12:00').split(':').map(Number);
                const meta = getRuleMeta(rule);
                const isCurrent = Math.abs(timeMinutes - ((h || 0) * 60 + (m || 0))) < 15;
                const IconComponent = meta.icon;

                return (
                  <button
                    key={rule.id}
                    onClick={() => setTimePreset(h, m)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap shadow-comic-sm ${
                      isCurrent
                        ? `${meta.bgColor} ${meta.textColor} border-black`
                        : 'bg-[#FAF7F0] border-black text-black hover:bg-neutral-200'
                    }`}
                    title={`Click to jump to ${rule.target_time}: ${rule.task_name}`}
                  >
                    <IconComponent className="w-2.5 h-2.5" />
                    <span>{rule.target_time}</span>
                    <span className="font-comic uppercase hidden sm:inline">{rule.task_name.slice(0, 12)}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-neutral-600">
              <span className="flex items-center gap-1">
                <Sun className="w-3 h-3 text-[#FFE600] fill-[#FFE600]" /> 13:00 WATER
              </span>
              <span className="flex items-center gap-1 text-[#FF3B30] font-black">
                <Sunset className="w-3 h-3 text-[#FF3B30]" /> 19:00 CURFEW
              </span>
            </div>
          )}

          <span className="shrink-0">23:59 NIGHT</span>
        </div>

        {/* Timeline Slider Track with Interactive LLM Pins */}
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={1439}
            step={1}
            value={timeMinutes}
            onChange={handleSliderChange}
            className="w-full h-3 bg-[#FAF7F0] rounded-lg appearance-none cursor-pointer accent-[#FFE600] border-2 border-black"
          />

          {/* Render Dynamic Marker Pins for ALL Schedules created by the Local LLM */}
          {schedules.map((rule) => {
            const [h, m] = (rule.target_time || '12:00').split(':').map(Number);
            const ruleMin = (h || 0) * 60 + (m || 0);
            const leftPct = (ruleMin / 1440) * 100;
            const meta = getRuleMeta(rule);
            const isNear = Math.abs(timeMinutes - ruleMin) < 8;

            return (
              <div
                key={rule.id}
                onClick={() => setTimePreset(h, m)}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer group z-10"
                style={{ left: `${leftPct}%` }}
              >
                {/* Pin Head */}
                <div
                  className={`w-3.5 h-5 rounded border border-black shadow-comic-sm transition-transform group-hover:scale-125 flex items-center justify-center ${meta.bgColor} ${
                    isNear ? 'ring-2 ring-black scale-110' : ''
                  }`}
                  title={`${rule.target_time} - ${rule.task_name}`}
                >
                  <span className="w-1 h-2 bg-black/40 rounded-full" />
                </div>

                {/* Floating Comic Tooltip on Hover */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none whitespace-nowrap z-30">
                  <div className="bg-black text-white px-2 py-0.5 rounded-lg border border-black text-[9px] font-mono font-bold shadow-comic flex items-center gap-1">
                    <span style={{ color: meta.color }}>●</span>
                    <span>{rule.target_time}</span>
                    <span className="text-neutral-400">|</span>
                    <span className="font-comic font-black uppercase">{rule.task_name}</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-black rotate-45 -mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Dynamic Schedule Preset Buttons According to Local LLM */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto shrink-0">
        {schedules.length > 0 ? (
          schedules.map((rule) => {
            const [h, m] = (rule.target_time || '12:00').split(':').map(Number);
            const ruleMin = (h || 0) * 60 + (m || 0);
            const isNear = Math.abs(timeMinutes - ruleMin) < 20;
            const meta = getRuleMeta(rule);
            const IconComponent = meta.icon;
            const time12h = formatTime12h(rule.target_time);

            return (
              <button
                key={rule.id}
                onClick={() => setTimePreset(h, m)}
                className={`px-2.5 py-1.5 rounded-xl border-2 border-black text-[11px] font-bold btn-comic shadow-comic-sm transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isNear
                    ? `${meta.bgColor} ${meta.textColor} animate-pulse`
                    : meta.bgColor === 'bg-[#FF3B30]'
                    ? 'bg-[#FF3B30] text-white hover:bg-red-600'
                    : 'bg-white hover:bg-neutral-100 text-black'
                }`}
                title={`Jump to ${rule.target_time} (${rule.task_name})`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span className="font-comic font-black">{time12h}</span>
                <span className="hidden lg:inline text-[10px] opacity-90 uppercase">
                  {rule.task_name.replace(/(Headcount|Audit|Check)/gi, '').trim().slice(0, 12)}
                </span>
              </button>
            );
          })
        ) : (
          <>
            <button
              onClick={() => setTimePreset(8, 0)}
              className="px-2.5 py-1.5 rounded-xl border-2 border-black text-[11px] font-bold bg-white hover:bg-neutral-100 text-black btn-comic shadow-comic-sm cursor-pointer"
            >
              08:00 AM Grazing
            </button>
            <button
              onClick={() => setTimePreset(13, 0)}
              className="px-2.5 py-1.5 rounded-xl border-2 border-black text-[11px] font-bold bg-white hover:bg-neutral-100 text-black btn-comic shadow-comic-sm cursor-pointer"
            >
              01:00 PM Water
            </button>
            <button
              onClick={() => setTimePreset(19, 0)}
              className="px-2.5 py-1.5 rounded-xl border-2 border-black text-[11px] font-comic font-black bg-[#FF3B30] text-white hover:bg-red-600 btn-comic shadow-comic-sm flex items-center gap-1 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>07:00 PM CURFEW</span>
            </button>
          </>
        )}

        {/* Add/Open AI Scheduler Shortcut */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border-2 border-black bg-[#FFE600] text-black font-comic font-black text-[11px] btn-comic shadow-comic-sm flex items-center gap-1 hover:bg-[#FFD000] cursor-pointer"
          title="Open Autonomous AI Scheduler to add rules via Ollama"
        >
          <Sparkles className="w-3.5 h-3.5 fill-black" />
          <span className="hidden sm:inline">+ AI RULE</span>
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-1.5 rounded-xl border-2 border-black btn-comic shadow-comic-sm transition-all ml-0.5 sm:ml-1 cursor-pointer ${
            isMuted ? 'bg-neutral-800 text-neutral-400' : 'bg-[#FFE600] text-black'
          }`}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-[#FF3B30]" /> : <Volume2 className="w-4 h-4 text-black" />}
        </button>
      </div>
    </div>
  );
};
