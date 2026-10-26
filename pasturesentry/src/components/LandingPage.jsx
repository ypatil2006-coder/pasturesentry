import React, { useState, useEffect, useRef } from 'react';
import { useRanch, CAMERAS } from '../context/RanchContext';
import { soundManager } from '../utils/audio';
import { parseScheduleFromNL } from '../utils/ollama';
import { IsometricRanchIllustration } from './IsometricRanchIllustration';
import { AnimatedCCTVFeeds } from './AnimatedCCTVFeeds';
import { OllamaDispatchTerminal } from './OllamaDispatchTerminal';
import {
  Shield,
  ShieldAlert,
  Radio,
  Camera,
  Cpu,
  Zap,
  Clock,
  MapPin,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Video,
  Send,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Flame,
  Layers,
  Terminal,
  Activity,
  Compass,
} from 'lucide-react';

export function LandingPage({ onLaunchWorkstation }) {
  const {
    cattle,
    selectedCamera,
    setSelectedCamera,
    ranchStatus,
    setRanchStatus,
    breachEvent,
    triggerBreachEvent,
    resetToSecure,
    timeMinutes,
    setTimeMinutes,
    isMuted,
    setIsMuted,
    ollamaStatus,
  } = useRanch();

  // Local state for interactive landing page widgets
  const [activeTab, setActiveTab] = useState('SIMULATOR');
  const [nlInput, setNlInput] = useState('All cattle must be inside the shelter by 7 PM every day');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedRule, setExtractedRule] = useState(null);
  const [extractionError, setExtractionError] = useState(null);
  const [cameraFocus, setCameraFocus] = useState('CAM-01');
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const webcamVideoRef = useRef(null);
  const [activeFaq, setActiveFaq] = useState(0);
  const [isBreached, setIsBreached] = useState(false);
  const [simCattleCount, setSimCattleCount] = useState(50);
  const [sarDispatchText, setSarDispatchText] = useState(null);

  // Play audio helper with soundManager
  const playSound = (type = 'click') => {
    if (isMuted) return;
    if (type === 'lock') soundManager.playLockBeep();
    else if (type === 'whoosh') soundManager.playFlyWhoosh();
    else if (type === 'radar') soundManager.playRadarBlip();
    else soundManager.playLockBeep();
  };

  // Toggle Webcam for CAM-02
  const toggleWebcam = async () => {
    playSound('lock');
    if (isWebcamActive) {
      if (webcamVideoRef.current && webcamVideoRef.current.srcObject) {
        const stream = webcamVideoRef.current.srcObject;
        stream.getTracks().forEach((track) => track.stop());
        webcamVideoRef.current.srcObject = null;
      }
      setIsWebcamActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = stream;
          webcamVideoRef.current.play();
        }
        setIsWebcamActive(true);
      } catch (err) {
        console.warn('Webcam access error:', err);
        alert('Could not access webcam. Using fallback animated feed.');
      }
    }
  };

  // Handle Emergency Curfew Breach Demo Trigger
  const handleTriggerBreach = () => {
    playSound('lock');
    if (!isBreached) {
      setIsBreached(true);
      setSimCattleCount(46);
      soundManager.startSiren();
      setSarDispatchText({
        timestamp: '19:00:03',
        missingCows: ['COW-12', 'COW-19', 'COW-04', 'COW-31'],
        lastSeenCamera: 'CAM-04 (East Perimeter Boundary)',
        heading: '082° East towards Highway 81 culvert',
        droneDispatch: 'DRONE SENTINEL ALPHA-01 AIRBORNE. SWEEPING SECTOR CHARLIE.',
        recommendation: 'Deploy thermal sweep within 650m radius before 19:30 dusk cutoff.',
      });
      // Also update shared RanchContext state if available
      if (triggerBreachEvent) {
        triggerBreachEvent();
      }
    } else {
      setIsBreached(false);
      setSimCattleCount(50);
      soundManager.stopSiren();
      setSarDispatchText(null);
      if (resetToSecure) {
        resetToSecure();
      }
    }
  };

  // Handle Natural Language Extraction Test
  const handleExtractNL = async (promptText) => {
    const textToParse = promptText || nlInput;
    if (!textToParse) return;
    playSound('lock');
    setIsExtracting(true);
    setExtractionError(null);

    try {
      const parsed = await parseScheduleFromNL(textToParse, ollamaStatus.activeModel);
      setExtractedRule({
        ...parsed.rule,
        source: parsed.source,
        status: 'ARMED',
      });
      playSound('radar');
    } catch (e) {
      console.warn('Extraction error:', e);
      setExtractionError(e.message || 'Local Ollama model failed to parse prompt');
    } finally {
      setIsExtracting(false);
    }
  };

  // FAQs list
  const faqs = [
    {
      q: 'How does PastureSentry AI operate with 100% offline edge compute?',
      a: 'All neural inferences (YOLO spatial re-identification and Ollama LLM dispatch) run on the local ranch host machine (e.g., an NVIDIA Jetson, Mac Mini, or rugged laptop). No telemetry, frames, or ranch data ever leaves the local subnet. It functions perfectly in Airplane Mode during total cellular, grid, or satellite failure.',
    },
    {
      q: 'Can ranchers speak or type natural language instructions to it?',
      a: 'Yes! Local Ollama models (such as Qwen 2.5 Coder or Llama 3.2) parse natural speech or text like "Gather all cows in the shelter by 7 PM daily" into strict machine-executable JSON schedules with breach thresholds and automated drone dispatch protocols.',
    },
    {
      q: 'How does it track individual cattle across cameras without expensive GPS collars?',
      a: 'It uses lightweight multi-camera computer vision. Cameras positioned at bottleneck choke points (Water Trough, Shelter Barn, Gates, and Perimeter gaps) cross-reference visual tags, silhouette aspect ratio, and transit timestamps to maintain spatial continuity across sectors without battery-draining GPS tags.',
    },
    {
      q: 'What happens when a perimeter breach or curfew violation occurs?',
      a: 'The system triggers a Web Audio klaxon alert, calculates walking velocity and terrain slope from the last-seen camera vector, illuminates the 3D escape trajectory trail, and synthesizes autonomous drone waypoint search vectors in under 250 milliseconds.',
    },
    {
      q: 'Can we connect our own RTSP cameras or laptop webcams?',
      a: 'Absolutely. PastureSentry accepts standard RTSP solar-powered IP cameras, drone RTMP streams, or local USB/laptop webcams (as demonstrated on CAM-02 in this live demo).',
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#F4EEDD] text-black select-none antialiased overflow-x-hidden font-display">
      {/* ============================================================ */}
      {/* 1. PERSISTENT FULL-WIDTH HOVER NAVBAR (100% WIDTH, CLEAN)     */}
      {/* ============================================================ */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#141414]/95 backdrop-blur-md border-b-4 border-black shadow-[0_4px_0_#000] px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between text-white transition-all">
        {/* Left: Punchy Brand Badge */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="bg-[#FFE600] text-black p-1.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 fill-black text-black" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-comic text-base sm:text-lg font-black tracking-wider text-white">
                PASTURE<span className="text-[#FFE600]">SENTRY</span>
              </span>
              <span className="hidden sm:inline-block text-[9px] font-mono px-2 py-0.5 bg-[#FF3B30] text-white rounded-md font-black uppercase border border-black/40">
                OFFLINE EDGE
              </span>
            </div>
          </a>
        </div>

        {/* Center: In-Page Section Anchors (Clean, No Clutter) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <a
            href="#interactive-simulator"
            onClick={() => playSound('lock')}
            className="text-neutral-300 hover:text-black hover:bg-[#FFE600] px-3 py-1.5 rounded-xl border-2 border-transparent hover:border-black font-comic text-xs font-black tracking-wide transition-all"
          >
            SIMULATOR
          </a>
          <a
            href="#rural-crisis-chronicle"
            onClick={() => playSound('lock')}
            className="text-neutral-300 hover:text-black hover:bg-[#FFE600] px-3 py-1.5 rounded-xl border-2 border-transparent hover:border-black font-comic text-xs font-black tracking-wide transition-all"
          >
            THE $16K CRISIS
          </a>
          <a
            href="#scheduler-demo"
            onClick={() => playSound('lock')}
            className="text-neutral-300 hover:text-black hover:bg-[#FFE600] px-3 py-1.5 rounded-xl border-2 border-transparent hover:border-black font-comic text-xs font-black tracking-wide transition-all"
          >
            AI SCHEDULER
          </a>
          <a
            href="#edge-architecture"
            onClick={() => playSound('lock')}
            className="text-neutral-300 hover:text-black hover:bg-[#FFE600] px-3 py-1.5 rounded-xl border-2 border-transparent hover:border-black font-comic text-xs font-black tracking-wide transition-all"
          >
            ARCHITECTURE
          </a>
        </nav>

        {/* Right: Offline Telemetry Status, Audio Toggle & Launch Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Offline Hardware Indicator */}
          <div className="hidden sm:flex items-center gap-2 bg-black px-3 py-1.5 rounded-xl border-2 border-neutral-700 font-mono text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#00D26A] animate-ping" />
            <span className="text-[#00D26A]">100% OFFLINE</span>
          </div>

          {/* Sound Synthesizer Toggle */}
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              soundManager.setMuted(!isMuted);
              playSound('lock');
            }}
            className={`px-2.5 py-1.5 rounded-xl border-2 border-black shadow-comic-sm btn-comic text-xs font-bold flex items-center gap-1.5 transition-all ${
              isMuted
                ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                : 'bg-[#FFE600] text-black hover:bg-[#FFD000]'
            }`}
            title={isMuted ? 'Unmute Web Audio FX' : 'Mute Audio FX'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[10px] font-mono font-bold">
              {isMuted ? 'MUTE' : 'AUDIO'}
            </span>
          </button>

          {/* Cockpit Jump to Climax Section */}
          <a
            href="#mission-control-climax"
            onClick={(e) => {
              e.preventDefault();
              playSound('lock');
              document.getElementById('mission-control-climax')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-[#00D26A] hover:bg-[#00b85c] text-black px-3 sm:px-4 py-1.5 rounded-xl border-2 border-black shadow-comic-sm font-comic text-xs font-black flex items-center gap-1.5 btn-comic cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-black" />
            <span>COCKPIT ACCESS ↓</span>
          </a>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. HERO SECTION: SPEECH BUBBLES, STARBURSTS & GIANT HEADLINE  */}
      {/* ============================================================ */}
      <section className="relative px-4 sm:px-8 pt-20 sm:pt-24 pb-12 sm:pb-16 max-w-7xl mx-auto overflow-hidden">
        {/* Floating Comic Starburst Badges */}
        <div className="absolute -top-4 right-8 lg:right-16 hidden md:flex flex-col items-end gap-3 pointer-events-none z-10">
          <div className="bg-[#FFE600] border-4 border-black px-4 py-2 rounded-2xl shadow-comic transform rotate-6 animate-bounce-slight pointer-events-auto">
            <span className="text-[10px] font-mono font-black text-black uppercase tracking-wider block">
              HERD TELEMETRY
            </span>
            <span className="text-xl font-black font-comic text-[#FF3B30] block">
              POW! 50 HEAD
            </span>
            <span className="text-[10px] font-bold text-neutral-900">
              AUTONOMOUSLY TRACKED
            </span>
          </div>

          <div className="bg-[#FF3B30] border-4 border-black px-4 py-2 rounded-2xl shadow-comic transform -rotate-3 text-white pointer-events-auto">
            <span className="text-[10px] font-mono font-black uppercase text-yellow-200 block">
              ZERO CLOUD DEPENDENCY
            </span>
            <span className="text-xl font-black font-comic text-white block">
              ZAP! 100% OFFLINE
            </span>
            <span className="text-[10px] font-bold text-yellow-100">
              AIRPLANE MODE NATIVE
            </span>
          </div>
        </div>

        {/* Hero Left Content */}
        <div className="max-w-3xl space-y-4 sm:space-y-6">
          {/* Comic Speech Bubble Eyebrow */}
          <div className="inline-block bg-white text-black font-black text-xs sm:text-sm px-4 py-2 rounded-2xl border-3 border-black shadow-comic-sm speech-bubble uppercase tracking-wider">
            💬 HOLY HERD! 50,000 ACRES WITH ZERO CELL SERVICE?!
          </div>

          {/* Giant Bold Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[1.08] text-black">
            THE EDGE-AI LIVESTOCK SENTINEL THAT{' '}
            <span className="bg-[#FFE600] px-2 py-0.5 border-3 border-black shadow-comic-sm inline-block transform -rotate-1">
              PUNCHES
            </span>{' '}
            ABOVE ITS FENCE.
          </h1>

          {/* Rich Description */}
          <p className="text-base sm:text-lg font-bold text-neutral-800 leading-relaxed max-w-2xl">
            100% offline edge ranch protection: autonomous drone spatial tracking, 4-channel
            CCTV perimeter watch, and local Ollama dispatch. Works when towers drop,
            generators stall, and the herd starts roaming.
          </p>

          {/* Hero CTAs: Focused interactive demo + narrative link */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
            <a
              href="#interactive-simulator"
              onClick={() => playSound('lock')}
              className="bg-[#FFE600] hover:bg-[#FFD000] text-black px-6 sm:px-8 py-3.5 rounded-2xl border-4 border-black shadow-comic-lg font-comic text-sm sm:text-base flex items-center gap-2 btn-comic-lg"
            >
              <Zap className="w-5 h-5 fill-black" />
              <span>TEST LIVE SENTINEL DEMO</span>
            </a>

            <a
              href="#rural-crisis-chronicle"
              onClick={() => playSound('lock')}
              className="bg-white hover:bg-neutral-100 text-black px-5 sm:px-7 py-3.5 rounded-2xl border-4 border-black shadow-comic font-comic text-sm sm:text-base flex items-center gap-2 btn-comic"
            >
              <span>THE $16,000 CRISIS ↓</span>
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-4 text-xs font-mono font-bold">
            <div className="flex items-center gap-1.5 bg-white border-2 border-black px-3 py-1.5 rounded-xl shadow-comic-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00D26A] border border-black" />
              <span>0ms CLOUD LATENCY</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white border-2 border-black px-3 py-1.5 rounded-xl shadow-comic-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFE600] border border-black" />
              <span>LOCAL OLLAMA INFERENCE</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white border-2 border-black px-3 py-1.5 rounded-xl shadow-comic-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] border border-black" />
              <span>FLIR THERMAL COMPATIBLE</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. INTERACTIVE HERO SIMULATOR: PASTURE RADAR & 4-CAM CCTV     */}
      {/* ============================================================ */}
      <section
        id="interactive-simulator"
        className="px-3 sm:px-6 py-8 max-w-7xl mx-auto"
      >
        <div className="bg-white border-5 border-black rounded-3xl p-4 sm:p-6 shadow-comic-xl space-y-6">
          {/* Simulator Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-4 border-black pb-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#FFE600] text-black font-comic text-xs rounded-xl border-2 border-black shadow-comic-sm">
                LIVE INTERACTIVE STAGE
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black uppercase text-black">
                  HERO SIMULATOR: 24-HOUR RANCH RADAR & BREACH TRIGGER
                </h2>
                <p className="text-xs font-mono text-neutral-600">
                  Click cameras to focus drone or hit the big red Curfew Trigger button!
                </p>
              </div>
            </div>

            {/* Quick Status Pill */}
            <div className="flex items-center gap-2">
              <div
                className={`px-3 py-1 rounded-xl border-2 border-black font-mono text-xs font-black flex items-center gap-2 shadow-comic-sm ${
                  isBreached
                    ? 'bg-[#FF3B30] text-white animate-pulse'
                    : 'bg-[#00D26A] text-black'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-black" />
                <span>
                  {isBreached ? '🚨 CURFEW BREACH ACTIVE!' : '✅ ALL 50 CATTLE SECURE'}
                </span>
              </div>
            </div>
          </div>

          {/* Main 2-Column Showcase Matrix matching Image 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Column Left: Isometric Axonometric Pasture Illustration (7 cols) */}
            <div className="lg:col-span-7">
              <IsometricRanchIllustration
                isBreached={isBreached}
                selectedCamera={cameraFocus}
                onSelectCamera={(camId) => {
                  setCameraFocus(camId);
                  playSound('whoosh');
                }}
              />
            </div>

            {/* Column Right: 4-Channel CCTV Grid & Ollama Dispatch (5 cols) */}
            <div className="lg:col-span-5">
              <AnimatedCCTVFeeds
                cameraFocus={cameraFocus}
                onSelectCamera={(camId) => {
                  setCameraFocus(camId);
                  playSound('whoosh');
                }}
                isBreached={isBreached}
                isWebcamActive={isWebcamActive}
                onToggleWebcam={toggleWebcam}
                webcamVideoRef={webcamVideoRef}
              />
            </div>
          </div>

          {/* Full-Width Bottom Controller Bar matching Image 2 EXACTLY */}
          <div className="bg-[#141414] border-4 border-black rounded-2xl p-3 shadow-comic flex flex-wrap items-center justify-between gap-3">
            {/* Left: Big Red Curfew Breach Button with Warning Siren */}
            <button
              onClick={handleTriggerBreach}
              className={`px-5 py-2.5 rounded-xl border-3 border-black shadow-comic-sm font-comic text-xs sm:text-sm flex items-center gap-2 btn-comic tracking-wide ${
                isBreached
                  ? 'bg-[#00D26A] hover:bg-[#00b85c] text-black'
                  : 'bg-[#FF3B30] hover:bg-[#d90429] text-white'
              }`}
            >
              <AlertTriangle className="w-5 h-5 fill-current" />
              <span>
                {isBreached
                  ? 'RESET TO NORMAL (MUSTER PASS)'
                  : '🚨 TEST 7:00 PM CURFEW BREACH'}
              </span>
            </button>

            {/* Center: Glowing Green Digital 7-Segment LED Clock */}
            <div className="bg-[#051C0F] text-[#00FF66] font-mono px-5 py-2 rounded-xl border-2 border-black font-black text-base sm:text-lg shadow-comic-sm flex items-center gap-2 tracking-[0.25em] drop-shadow-[0_0_8px_rgba(0,255,102,0.4)]">
              <Clock className="w-4 h-4 text-[#00FF66]" />
              <span>07:00 PM</span>
            </div>

            {/* Right: Yellow Headcount Pill matching Image 2 */}
            <div className="bg-[#FFE600] text-black px-4 py-2 rounded-xl border-3 border-black font-mono text-xs sm:text-sm font-black shadow-comic-sm flex items-center gap-2">
              <span className="text-sm">👥</span>
              <span>
                {simCattleCount}/50 {isBreached ? 'HEAD DETECTED' : 'HEAD SECURED'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. THE 3-ACT COMIC STRIP STORY: ISSUE #001                   */}
      {/* ============================================================ */}
      <section id="rural-crisis-chronicle" className="px-4 sm:px-8 py-12 max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-block bg-[#FFE600] text-black font-comic text-xs sm:text-sm px-4 py-1.5 rounded-2xl border-3 border-black shadow-comic-sm">
            COMIC ISSUE #001: THE 3-ACT CHRONICLE
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            HOW PASTURESENTRY SAVES THE HERD WHEN CLOUD DIES
          </h2>
          <p className="text-sm font-semibold text-neutral-700 max-w-2xl mx-auto">
            A ranch is not an air-conditioned data center. Here is why edge AI wins every time.
          </p>
        </div>

        {/* 3 Comic Book Story Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Panel 1 */}
          <div className="bg-white border-4 border-black rounded-3xl p-5 shadow-comic-lg flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-3 border-black pb-2">
                <span className="font-comic text-xs bg-[#FF3B30] text-white px-2 py-0.5 rounded border border-black">
                  ACT I
                </span>
                <span className="text-xs font-mono font-bold text-neutral-500">
                  18:30 DUSK
                </span>
              </div>
              <h3 className="font-comic text-lg uppercase text-black leading-tight">
                THE DUSK BLINDSPOT & BROKEN WIRE
              </h3>
              <div className="bg-[#FAF7F0] border-2 border-black rounded-2xl p-3 text-xs font-semibold text-neutral-800 speech-bubble">
                "A storm ripped down post #42 by the highway. Cell service is at zero bars.
                GPS collars went dead two months ago. If they hit Highway 81, that’s $16,000
                gone."
              </div>
              <p className="text-xs text-neutral-700 font-medium">
                Traditional cloud agriculture tech collapses when satellite links drop.
                Ranches lose millions each year to unmonitored fence breaks and twilight
                predator attacks.
              </p>
            </div>
            <div className="bg-[#FAF7F0] border-2 border-black p-2 rounded-xl text-center font-mono text-[11px] font-black text-[#FF3B30]">
              ❌ CLOUD SAAS STATUS: OFFLINE / UNREACHABLE
            </div>
          </div>

          {/* Panel 2 */}
          <div className="bg-white border-4 border-black rounded-3xl p-5 shadow-comic-lg flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-3 border-black pb-2">
                <span className="font-comic text-xs bg-[#FFE600] text-black px-2 py-0.5 rounded border border-black">
                  ACT II
                </span>
                <span className="text-xs font-mono font-bold text-neutral-500">
                  19:00 MUSTER
                </span>
              </div>
              <h3 className="font-comic text-lg uppercase text-black leading-tight">
                THE MULTI-CAM CHOKEPOINT MATRIX
              </h3>
              <div className="bg-[#FAF7F0] border-2 border-black rounded-2xl p-3 text-xs font-semibold text-neutral-800 speech-bubble">
                "Curfew rule fires! 46 cows accounted for in the barn. But CAM-04 logs
                COW-12 and COW-19 slipping through the East breach!"
              </div>
              <p className="text-xs text-neutral-700 font-medium">
                Solar-powered RTSP cameras running YOLO on local edge silicon cross-reference
                RFID tags and visual profiles. No collars required, 0ms lag, and zero internet
                needed.
              </p>
            </div>
            <div className="bg-[#FFE600] border-2 border-black p-2 rounded-xl text-center font-mono text-[11px] font-black text-black">
              ⚡ LOCAL EDGE DETECTION: 60 FPS SOLID
            </div>
          </div>

          {/* Panel 3 */}
          <div className="bg-white border-4 border-black rounded-3xl p-5 shadow-comic-lg flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-3 border-black pb-2">
                <span className="font-comic text-xs bg-[#00D26A] text-black px-2 py-0.5 rounded border border-black">
                  ACT III
                </span>
                <span className="text-xs font-mono font-bold text-neutral-500">
                  19:02 DISPATCH
                </span>
              </div>
              <h3 className="font-comic text-lg uppercase text-black leading-tight">
                OLLAMA SAR DRONE INTERCEPT
              </h3>
              <div className="bg-[#FAF7F0] border-2 border-black rounded-2xl p-3 text-xs font-semibold text-neutral-800 speech-bubble">
                "Ollama calculates cattle walking speed, predicts culvert coordinates, and
                launches Drone Sentinel Alpha directly to Sector Charlie bearing 082°!"
              </div>
              <p className="text-xs text-neutral-700 font-medium">
                Local Ollama functions as the autonomous 24/7 ranch dispatcher. In 12 minutes,
                the drone guides the wrangler right to the stray heifers before nightfall.
              </p>
            </div>
            <div className="bg-[#00D26A] border-2 border-black p-2 rounded-xl text-center font-mono text-[11px] font-black text-black">
              🏆 RESULT: 50/50 SECURED. ZERO LOSSES.
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. INTERACTIVE OLLAMA NATURAL LANGUAGE SCHEDULER WIDGET       */}
      {/* ============================================================ */}
      <section id="scheduler-demo" className="px-4 sm:px-8 py-12 max-w-7xl mx-auto">
        <div className="bg-[#FFE600] border-5 border-black rounded-3xl p-6 sm:p-8 shadow-comic-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-block bg-black text-[#FFE600] font-comic text-xs px-3 py-1 rounded-xl">
                OLLAMA NATURAL LANGUAGE ENGINE
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-black">
                TALK TO YOUR RANCH LIKE A HUMAN. WE DO THE REST.
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-neutral-900 max-w-xl">
                Type plain English ranch rules. Local Ollama extracts structured schedule
                parameters and arms the perimeter sentry instantly.
              </p>
            </div>

            <div className="bg-white border-3 border-black px-4 py-2 rounded-2xl shadow-comic-sm font-mono text-xs font-bold self-start sm:self-auto">
              <span>ACTIVE MODEL: </span>
              <span className="text-[#FF3B30] font-black">
                {ollamaStatus.activeModel || 'qwen2.5-coder:3b'}
              </span>
            </div>
          </div>

          {/* Interactive Input Form */}
          <div className="bg-white border-4 border-black rounded-2xl p-4 sm:p-6 shadow-comic space-y-4">
            <label className="block text-xs font-mono font-bold uppercase text-neutral-700">
              ENTER PLAIN ENGLISH RANCH RULE:
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={nlInput}
                onChange={(e) => setNlInput(e.target.value)}
                placeholder="e.g. Audit water trough headcount at 1 PM daily..."
                className="flex-1 bg-[#FAF7F0] border-3 border-black rounded-xl px-4 py-3 text-sm font-mono font-bold focus:outline-none focus:ring-3 focus:ring-[#FFE600]"
              />

              <button
                onClick={() => handleExtractNL()}
                disabled={isExtracting}
                className="bg-[#00D26A] hover:bg-[#00b85c] text-black px-6 py-3 rounded-xl border-3 border-black shadow-comic font-comic text-sm flex items-center justify-center gap-2 btn-comic shrink-0"
              >
                {isExtracting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>PARSING VIA OLLAMA...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>EXTRACT & ARM RULE</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Prompt Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
              <span className="font-bold text-neutral-600">TRY PRESET PROMPTS:</span>
              {[
                'All cattle must be inside the shelter by 7 PM every day',
                'Audit water trough headcount at 1 PM',
                'Alert me if more than 2 cows linger by East fence after dusk',
              ].map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setNlInput(pill);
                    handleExtractNL(pill);
                  }}
                  className="bg-neutral-100 hover:bg-neutral-200 border-2 border-black px-2.5 py-1 rounded-lg text-black font-semibold text-[11px] btn-comic"
                >
                  "{pill}"
                </button>
              ))}
            </div>

            {/* Extracted JSON Rule Preview Card */}
            {extractedRule && (
              <div className="mt-4 pt-4 border-t-3 border-black space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-[#00D26A] text-black border-2 border-black rounded-lg font-comic text-xs">
                      STATUS: {extractedRule.status}
                    </span>
                    <span className="font-mono text-xs font-black uppercase text-black">
                      {extractedRule.task_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 border border-black rounded">
                      SRC: {extractedRule.source || 'OLLAMA'}
                    </span>
                    <span className="text-xs font-mono font-bold bg-[#FFE600] px-2 py-0.5 border border-black rounded">
                      TIME: {extractedRule.target_time}
                    </span>
                  </div>
                </div>

                <pre className="bg-[#141414] text-[#FFE600] p-4 rounded-xl border-3 border-black font-mono text-xs overflow-x-auto shadow-inner">
                  {JSON.stringify(extractedRule, null, 2)}
                </pre>
              </div>
            )}

            {/* Error Banner when local Ollama inference fails */}
            {extractionError && (
              <div className="mt-4 p-4 bg-[#FF3B30] text-white border-3 border-black rounded-xl font-mono text-xs space-y-1 shadow-comic">
                <div className="flex items-center gap-1.5 font-comic font-black text-sm">
                  <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                  <span>LOCAL MODEL INFERENCE ERROR</span>
                </div>
                <p className="bg-black/30 p-2.5 rounded-lg border border-black/30 text-[11px] font-bold">
                  {extractionError}
                </p>
                <p className="text-[10px] opacity-80 pt-1">
                  100% Offline Edge Mode: No hardcoded fallback parsers are allowed. Ensure local Ollama is running on port 11434.
                </p>
              </div>
            )}

            {!extractedRule && !extractionError && (
              <div className="mt-4 pt-4 border-t-3 border-black/15 text-center text-xs font-mono font-bold text-neutral-500 py-3">
                Click "EXTRACT & ARM RULE" or select a preset prompt above to query local Ollama ({ollamaStatus.activeModel}).
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. NEUBRUTALIST BATTLE: CLOUD SAAS VS. PASTURESENTRY EDGE     */}
      {/* ============================================================ */}
      <section className="px-4 sm:px-8 py-12 max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-block bg-[#FF3B30] text-white font-comic text-xs px-3 py-1 rounded-xl border-2 border-black shadow-comic-sm">
            THE UNFAIR ADVANTAGE
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            CLOUD SAAS VS. PASTURESENTRY 100% OFFLINE EDGE
          </h2>
          <p className="text-sm font-semibold text-neutral-700 max-w-xl mx-auto">
            Why traditional IoT subscriptions fail ranchers, and why edge compute is king.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-white border-5 border-black rounded-3xl p-4 sm:p-6 shadow-comic-xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b-4 border-black">
                <th className="p-3 font-comic text-sm uppercase text-neutral-600">CAPABILITY</th>
                <th className="p-3 font-comic text-sm uppercase text-[#FF3B30] bg-[#FF3B30]/10 border-l-3 border-r-3 border-black">
                  TRADITIONAL CLOUD SAAS
                </th>
                <th className="p-3 font-comic text-sm uppercase text-black bg-[#FFE600] border-r-3 border-black">
                  PASTURESENTRY AI (EDGE)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-3 divide-black font-mono text-xs font-bold">
              <tr>
                <td className="p-3.5">Runtime Internet Requirement</td>
                <td className="p-3.5 text-[#FF3B30] bg-[#FF3B30]/5 border-l-3 border-r-3 border-black">
                  ❌ Fails immediately without high-speed fiber or Starlink
                </td>
                <td className="p-3.5 bg-[#FFE600]/30 border-r-3 border-black text-[#008f47]">
                  ✔ 100% Offline Airplane Mode. Zero cloud dependency.
                </td>
              </tr>
              <tr>
                <td className="p-3.5">Monthly Subscription Costs</td>
                <td className="p-3.5 text-[#FF3B30] bg-[#FF3B30]/5 border-l-3 border-r-3 border-black">
                  ❌ $800 - $2,500/month recurring cloud charges
                </td>
                <td className="p-3.5 bg-[#FFE600]/30 border-r-3 border-black text-[#008f47]">
                  ✔ $0.00 / month. 100% Open source, runs on your own hardware.
                </td>
              </tr>
              <tr>
                <td className="p-3.5">Cattle Hardware Overhead</td>
                <td className="p-3.5 text-[#FF3B30] bg-[#FF3B30]/5 border-l-3 border-r-3 border-black">
                  ❌ Proprietary $250 GPS ear-tags (dead batteries in winter)
                </td>
                <td className="p-3.5 bg-[#FFE600]/30 border-r-3 border-black text-[#008f47]">
                  ✔ Computer vision on cheap solar RTSP cameras. No collars.
                </td>
              </tr>
              <tr>
                <td className="p-3.5">Data Privacy & Sovereignty</td>
                <td className="p-3.5 text-[#FF3B30] bg-[#FF3B30]/5 border-l-3 border-r-3 border-black">
                  ❌ Herd locations sold to commodity ag traders
                </td>
                <td className="p-3.5 bg-[#FFE600]/30 border-r-3 border-black text-[#008f47]">
                  ✔ Ranch telemetry stays inside your ranch gates forever.
                </td>
              </tr>
              <tr>
                <td className="p-3.5">Natural Language Scheduling</td>
                <td className="p-3.5 text-[#FF3B30] bg-[#FF3B30]/5 border-l-3 border-r-3 border-black">
                  ❌ Cumbersome dropdown forms and manual cron jobs
                </td>
                <td className="p-3.5 bg-[#FFE600]/30 border-r-3 border-black text-[#008f47]">
                  ✔ Local Ollama extracts executable rules from plain English.
                </td>
              </tr>
              <tr>
                <td className="p-3.5">Autonomous SAR Drone Dispatch</td>
                <td className="p-3.5 text-[#FF3B30] bg-[#FF3B30]/5 border-l-3 border-r-3 border-black">
                  ❌ Manual notification SMS sent to phone (no drone vector)
                </td>
                <td className="p-3.5 bg-[#FFE600]/30 border-r-3 border-black text-[#008f47]">
                  ✔ Synthesizes bearing, speed, and GPS flight coordinates.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. TACTICAL ARCHITECTURE BLUEPRINT                           */}
      {/* ============================================================ */}
      <section id="edge-architecture" className="px-4 sm:px-8 py-12 max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block bg-[#00D26A] text-black font-comic text-xs px-3 py-1 rounded-xl border-2 border-black shadow-comic-sm">
            HARDWARE & STACK SPEC
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase text-black">
            HOW THE LOCAL OFFLINE PIPELINE COMMUNICATES
          </h2>
          <p className="text-sm font-semibold text-neutral-700 max-w-xl mx-auto">
            Zero external CDNs, zero cloud endpoints. High-throughput edge telemetry.
          </p>
        </div>

        {/* Pipeline Diagram Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border-4 border-black rounded-2xl p-4 shadow-comic flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] font-mono font-bold bg-[#FFE600] px-2 py-0.5 rounded border border-black">
                NODE 01
              </span>
              <h4 className="font-comic text-sm uppercase mt-2">SOLAR RTSP CAMERAS</h4>
              <p className="text-xs text-neutral-600 mt-1 font-medium">
                4 Chokepoints stream H.264 video over local 5GHz Wi-Fi or LoRa ranch bridge.
              </p>
            </div>
            <div className="text-[10px] font-mono font-bold text-neutral-500 border-t-2 border-black pt-2">
              OUTPUT: RTSP / RTMP STREAM
            </div>
          </div>

          <div className="bg-white border-4 border-black rounded-2xl p-4 shadow-comic flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] font-mono font-bold bg-[#FFE600] px-2 py-0.5 rounded border border-black">
                NODE 02
              </span>
              <h4 className="font-comic text-sm uppercase mt-2">LOCAL YOLO CV ENGINE</h4>
              <p className="text-xs text-neutral-600 mt-1 font-medium">
                Performs headcount census, ear-tag optical re-identification, and bounding box telemetry.
              </p>
            </div>
            <div className="text-[10px] font-mono font-bold text-neutral-500 border-t-2 border-black pt-2">
              OUTPUT: JSON TELEMETRY @ 60 FPS
            </div>
          </div>

          <div className="bg-white border-4 border-black rounded-2xl p-4 shadow-comic flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] font-mono font-bold bg-[#FFE600] px-2 py-0.5 rounded border border-black">
                NODE 03
              </span>
              <h4 className="font-comic text-sm uppercase mt-2">OLLAMA EDGE DAEMON</h4>
              <p className="text-xs text-neutral-600 mt-1 font-medium">
                Runs Qwen2.5-Coder / Llama3.2 locally on host hardware for NL parsing & SAR dispatch.
              </p>
            </div>
            <div className="text-[10px] font-mono font-bold text-neutral-500 border-t-2 border-black pt-2">
              OUTPUT: LLM REASONING & WAYPOINTS
            </div>
          </div>

          <div className="bg-white border-4 border-black rounded-2xl p-4 shadow-comic flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] font-mono font-bold bg-[#FFE600] px-2 py-0.5 rounded border border-black">
                NODE 04
              </span>
              <h4 className="font-comic text-sm uppercase mt-2">MAVLINK DRONE SENTINEL</h4>
              <p className="text-xs text-neutral-600 mt-1 font-medium">
                Receives autonomous waypoint coordinates, conducts FLIR thermal sweeps, and sounds siren.
              </p>
            </div>
            <div className="text-[10px] font-mono font-bold text-neutral-500 border-t-2 border-black pt-2">
              OUTPUT: AUTONOMOUS INTERCEPT
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. HUMOROUS TESTIMONIALS: RANCHERS & CATTLE                  */}
      {/* ============================================================ */}
      <section className="px-4 sm:px-8 py-12 max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block bg-[#FFE600] text-black font-comic text-xs px-3 py-1 rounded-xl border-2 border-black shadow-comic-sm">
            PRAISE FROM THE PASTURE
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase text-black">
            HEAR IT DIRECTLY FROM THE HERD
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-4 border-black rounded-3xl p-5 shadow-comic-lg space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🐮</span>
                <div>
                  <h4 className="font-comic text-sm text-black">BESSIE #42</h4>
                  <span className="text-[10px] font-mono font-bold text-neutral-500">
                    Lead Angus Heifer, Sector Alpha
                  </span>
                </div>
              </div>
              <p className="text-xs font-semibold text-neutral-800 speech-bubble bg-[#FAF7F0] p-3 rounded-xl border-2 border-black">
                "Mooo! Finally an AI that doesn't judge how long I spend drinking at CAM-01.
                Plus when the coyote showed up near the East gap, that drone scared him off
                before I even had to get up."
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#00D26A]">
              VERIFIED CATTLE RFID-8842
            </span>
          </div>

          <div className="bg-white border-4 border-black rounded-3xl p-5 shadow-comic-lg space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🤠</span>
                <div>
                  <h4 className="font-comic text-sm text-black">RANCHER JEB HOLLOWAY</h4>
                  <span className="text-[10px] font-mono font-bold text-neutral-500">
                    Broken Spur Ranch (38,000 Acres)
                  </span>
                </div>
              </div>
              <p className="text-xs font-semibold text-neutral-800 speech-bubble bg-[#FAF7F0] p-3 rounded-xl border-2 border-black">
                "I don’t know what a 'Docker container' is, but I typed 'Cows in barn by 7 PM'
                into this thing and it caught 4 heifers slipping toward Highway 81. Saved me
                $10,000 on night one."
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#00D26A]">
              VERIFIED RANCH OPERATOR
            </span>
          </div>

          <div className="bg-white border-4 border-black rounded-3xl p-5 shadow-comic-lg space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🤖</span>
                <div>
                  <h4 className="font-comic text-sm text-black">HACKATHON AI JUDGE</h4>
                  <span className="text-[10px] font-mono font-bold text-neutral-500">
                    Autonomous Robotics Track
                  </span>
                </div>
              </div>
              <p className="text-xs font-semibold text-neutral-800 speech-bubble bg-[#FAF7F0] p-3 rounded-xl border-2 border-black">
                "Zero cloud egress, 100% offline Ollama inference, live webcam CV fallbacks,
                and a comic neubrutalist UI that actually makes edge telemetry fun to look at?
                This is a winning project."
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#FF3B30]">
              1ST PLACE CONTENDER
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. COMIC FAQ ACCORDION                                       */}
      {/* ============================================================ */}
      <section className="px-4 sm:px-8 py-12 max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block bg-white text-black font-comic text-xs px-3 py-1 rounded-xl border-2 border-black shadow-comic-sm">
            GOT QUESTIONS?
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase text-black">
            FREQUENTLY ASKED RANCH QUESTIONS
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-comic"
              >
                <button
                  onClick={() => {
                    playSound('lock');
                    setActiveFaq(isOpen ? null : index);
                  }}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-comic text-sm sm:text-base uppercase hover:bg-neutral-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <div
                    className={`w-7 h-7 rounded-xl border-2 border-black flex items-center justify-center transition-transform ${
                      isOpen ? 'bg-[#FFE600] rotate-180' : 'bg-neutral-100'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm font-semibold text-neutral-700 border-t-2 border-black bg-[#FAF7F0] leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 10. GRAND FINALE CTA BANNER & FOOTER                         */}
      {/* ============================================================ */}
      <section id="mission-control-climax" className="px-4 sm:px-8 py-12 max-w-7xl mx-auto">
        <div className="bg-[#141414] text-white border-5 border-black rounded-3xl p-8 sm:p-12 shadow-comic-xl relative overflow-hidden flex flex-col items-center text-center space-y-6">
          {/* Halftone Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_15%,transparent_16%)] bg-[size:16px_16px] pointer-events-none" />

          {/* Floating Starburst */}
          <div className="bg-[#FFE600] text-black border-4 border-black px-4 py-2 rounded-2xl shadow-comic transform -rotate-3 font-comic text-xs sm:text-sm animate-bounce-slight">
            ⚡ ISSUE #001 OFFICIAL DEPLOYMENT
          </div>

          <h2 className="text-3xl sm:text-5xl font-black font-comic uppercase text-white max-w-3xl leading-tight">
            READY TO DEFEND YOUR PERIMETER WITH 100% LOCAL EDGE AI?
          </h2>

          <p className="text-sm sm:text-base font-semibold text-neutral-300 max-w-xl">
            Test the live 3D drone aerial orbit, 4-channel CCTV bounding box matrix, and
            Ollama search-and-rescue dispatch right now.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => {
                playSound('lock');
                onLaunchWorkstation();
              }}
              className="bg-[#FFE600] hover:bg-[#FFD000] text-black px-8 py-4 rounded-2xl border-4 border-black shadow-comic-lg font-comic text-base flex items-center gap-2 btn-comic-lg"
            >
              <Zap className="w-5 h-5 fill-black" />
              <span>LAUNCH FULL MISSION CONTROL WORKSTATION</span>
            </button>
          </div>

          <div className="pt-6 border-t-2 border-neutral-700 w-full flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-neutral-400 gap-3">
            <div>
              PASTURESENTRY AI &bull; BUILT FOR MLH HACKATHONS 2026
            </div>
            <div className="flex items-center gap-4">
              <span>ZERO EXTERNAL CDNS</span>
              <span>100% AIRPLANE MODE GUARANTEE</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
