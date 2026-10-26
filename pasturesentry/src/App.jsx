import React, { useState } from 'react';
import { useRanch } from './context/RanchContext';
import { LandingPage } from './components/LandingPage';
import { DroneView3D } from './components/DroneView3D';
import { CameraFeeds } from './components/CameraFeeds';
import { SchedulerPanel } from './components/SchedulerPanel';
import { TimeScrubber } from './components/TimeScrubber';
import { EmergencyDispatcher } from './components/EmergencyDispatcher';
import { soundManager } from './utils/audio';
import {
  Activity,
  Calendar,
  Camera,
  Cpu,
  Flame,
  Grid,
  Layers,
  MapPin,
  Radio,
  Shield,
  ShieldAlert,
  Sliders,
  Volume2,
  VolumeX,
  Wifi,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

export function App() {
  const {
    ranchStatus,
    selectedCamera,
    setSelectedCamera,
    ollamaStatus,
    isMuted,
    setIsMuted,
    isDrawerOpen,
    setIsDrawerOpen,
    isDispatcherOpen,
    setIsDispatcherOpen,
    breachEvent,
    schedules,
  } = useRanch();

  // Parse subdomain, query param, or hash route for autonomous agents & direct access
  const parseRoute = (overrideHash) => {
    const host = window.location.hostname.toLowerCase();
    const hash = (overrideHash || window.location.hash || '').toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('subdomain') || params.get('agent') || params.get('view');

    // On Vercel / Cloud deployments, strictly lock to Landing Page only (no offline dashboard)
    const isCloudDeploy = host.includes('vercel.app') || host.includes('now.sh') || import.meta.env.VITE_LANDING_ONLY === 'true';
    if (isCloudDeploy) {
      return { view: 'LANDING', mode: 'SPLIT', drawer: false, dispatch: false };
    }

    // 1. Hostname Subdomains (e.g. cockpit.localhost, scheduler.localhost, dispatch.localhost)
    if (host.startsWith('cockpit.') || host.startsWith('app.')) return { view: 'WORKSTATION', mode: 'SPLIT', drawer: false, dispatch: false };
    if (host.startsWith('scheduler.')) return { view: 'WORKSTATION', mode: 'SPLIT', drawer: true, dispatch: false };
    if (host.startsWith('dispatch.') || host.startsWith('sar.')) return { view: 'WORKSTATION', mode: 'SPLIT', drawer: false, dispatch: true };
    if (host.startsWith('cctv.') || host.startsWith('camera.')) return { view: 'WORKSTATION', mode: 'CAMERAS_ONLY', drawer: false, dispatch: false };
    if (host.startsWith('drone.')) return { view: 'WORKSTATION', mode: 'DRONE_ONLY', drawer: false, dispatch: false };

    // 2. Query Parameters (e.g. ?subdomain=scheduler or ?agent=dispatch)
    if (sub === 'cockpit' || sub === 'workstation' || sub === 'app') return { view: 'WORKSTATION', mode: 'SPLIT', drawer: false, dispatch: false };
    if (sub === 'scheduler') return { view: 'WORKSTATION', mode: 'SPLIT', drawer: true, dispatch: false };
    if (sub === 'dispatch' || sub === 'sar') return { view: 'WORKSTATION', mode: 'SPLIT', drawer: false, dispatch: true };
    if (sub === 'cctv') return { view: 'WORKSTATION', mode: 'CAMERAS_ONLY', drawer: false, dispatch: false };
    if (sub === 'drone') return { view: 'WORKSTATION', mode: 'DRONE_ONLY', drawer: false, dispatch: false };

    // 3. Hash Routes (e.g. #cockpit, #scheduler, #dispatch, #cctv, #drone)
    if (hash === '#cockpit' || hash === '#/cockpit' || hash === '#workstation') return { view: 'WORKSTATION', mode: 'SPLIT', drawer: false, dispatch: false };
    if (hash === '#scheduler' || hash === '#/scheduler') return { view: 'WORKSTATION', mode: 'SPLIT', drawer: true, dispatch: false };
    if (hash === '#dispatch' || hash === '#/dispatch') return { view: 'WORKSTATION', mode: 'SPLIT', drawer: false, dispatch: true };
    if (hash === '#cctv' || hash === '#/cctv') return { view: 'WORKSTATION', mode: 'CAMERAS_ONLY', drawer: false, dispatch: false };
    if (hash === '#drone' || hash === '#/drone') return { view: 'WORKSTATION', mode: 'DRONE_ONLY', drawer: false, dispatch: false };

    return { view: 'LANDING', mode: 'SPLIT', drawer: false, dispatch: false };
  };

  const initialRoute = parseRoute();
  const [currentView, setCurrentView] = useState(initialRoute.view);
  const [viewMode, setViewMode] = useState(initialRoute.mode);

  const applyRoute = (targetHash) => {
    const r = parseRoute(targetHash);
    setCurrentView(r.view);
    if (r.mode) setViewMode(r.mode);
    setIsDrawerOpen(Boolean(r.drawer));
    setIsDispatcherOpen(Boolean(r.dispatch));
  };

  // Sync routes dynamically when agents or browser trigger hashchange or popstate
  React.useEffect(() => {
    applyRoute();

    const handleRouteChange = () => {
      applyRoute();
    };

    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const handleCameraSelect = (cam) => {
    setSelectedCamera(cam);
  };

  const launchWorkstation = (targetHash = '#cockpit') => {
    soundManager.playLockBeep();
    const host = window.location.hostname.toLowerCase();
    const isCloudDeploy = host.includes('vercel.app') || host.includes('now.sh') || import.meta.env.VITE_LANDING_ONLY === 'true';
    if (isCloudDeploy) {
      alert("⚡ PastureSentry Mission Control runs 100% locally on ranch edge hardware (NVIDIA Jetson / local edge laptop) with offline Ollama and RTSP chokepoint cameras.\n\nSee our GitHub repository for the complete local offline setup!");
      window.open('https://github.com/ypatil2006-coder/pasturesentry', '_blank');
      return;
    }
    window.location.hash = targetHash;
    applyRoute(targetHash);
  };

  const returnLanding = () => {
    soundManager.playLockBeep();
    window.location.hash = '#landing';
    setCurrentView('LANDING');
    setIsDrawerOpen(false);
    setIsDispatcherOpen(false);
  };

  // If in Landing Page view (or deployed on Vercel), render the Comic Neubrutalism landing page!
  const isCloudHost = window.location.hostname.toLowerCase().includes('vercel.app') || window.location.hostname.toLowerCase().includes('now.sh') || import.meta.env.VITE_LANDING_ONLY === 'true';
  if (currentView === 'LANDING' || isCloudHost) {
    return <LandingPage onLaunchWorkstation={launchWorkstation} />;
  }

  // Otherwise render full Mission Control Workstation in Comic Neubrutalism style!
  return (
    <div className="flex flex-col w-screen h-screen bg-[#F4EEDD] halftone-bg text-black select-none overflow-hidden font-display">
      {/* 1. Mission Control Comic Chrome Header Bar */}
      <header className="h-14 bg-[#141414] border-b-4 border-black px-3 sm:px-5 flex items-center justify-between z-30 font-mono shadow-comic shrink-0 text-white">
        {/* Left: Back Button & Branding */}
        <div className="flex items-center gap-2 sm:gap-3">

          <button
            onClick={returnLanding}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#FFE600] text-black border-2 border-black font-comic text-xs flex items-center gap-1.5 hover:bg-[#FFD000] btn-comic shadow-comic-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="font-black">LANDING</span>
          </button>

          <div className="h-5 w-px bg-neutral-700 mx-1 hidden sm:block" />

          {/* Logo Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-1 rounded-lg bg-[#FFE600] text-black border-2 border-black shadow-comic-sm">
              <Shield className="w-4 h-4 fill-black text-black" />
            </div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-black tracking-wider text-white font-comic">
                PASTURE<span className="text-[#FFE600]">SENTRY</span>
              </h1>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FF3B30] text-white border border-black font-black uppercase font-mono hidden md:inline">
                MISSION CONTROL
              </span>
            </div>
          </div>

          <div className="hidden lg:block h-5 w-px bg-neutral-700 mx-1" />

          {/* Herd Census Badge */}
          <div className="hidden lg:flex items-center gap-2 text-xs bg-white text-black px-3 py-1 rounded-xl border-2 border-black font-mono font-bold shadow-comic-sm">
            <Activity className="w-3.5 h-3.5 text-[#00D26A]" />
            <span className="text-neutral-600">HERD:</span>
            {ranchStatus === 'BREACH' ? (
              <span className="text-[#FF3B30] font-black animate-pulse">
                46/50 (4 MISSING)
              </span>
            ) : (
              <span className="text-[#008f47] font-black">50/50 SECURED</span>
            )}
          </div>
        </div>

        {/* Center: Ollama Edge Daemon Status */}
        <div className="hidden md:flex items-center gap-2.5 text-xs bg-black text-white px-3.5 py-1 rounded-full border-2 border-[#FFE600]/80 shadow-comic-sm font-mono">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#FFE600]" />
            <span className="text-neutral-400 text-[10px]">OLLAMA:</span>
            <span className="text-[#FFE600] font-bold text-[11px]">{ollamaStatus.activeModel}</span>
          </div>
          <span className="text-neutral-600">|</span>
          <span className="flex items-center gap-1 text-[10px] text-[#00D26A] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D26A] animate-ping" />
            100% OFFLINE
          </span>
        </div>

        {/* Right: View Controls, Sound, SAR Alert & Scheduler Drawer */}
        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="bg-white border-2 border-black rounded-xl p-0.5 flex items-center gap-0.5 text-xs shadow-comic-sm font-mono">
            <button
              onClick={() => setViewMode('SPLIT')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 font-bold ${
                viewMode === 'SPLIT'
                  ? 'bg-[#FFE600] text-black border-2 border-black shadow-comic-sm btn-comic'
                  : 'text-neutral-700 hover:text-black border-2 border-transparent'
              }`}
              title="Split Matrix View (3D Drone + CCTV Grid)"
            >
              <Layers className="w-3 h-3" />
              <span className="hidden sm:inline text-[11px]">SPLIT</span>
            </button>

            <button
              onClick={() => setViewMode('DRONE_ONLY')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 font-bold ${
                viewMode === 'DRONE_ONLY'
                  ? 'bg-[#FFE600] text-black border-2 border-black shadow-comic-sm btn-comic'
                  : 'text-neutral-700 hover:text-black border-2 border-transparent'
              }`}
              title="Full Screen 3D Drone Perspective"
            >
              <Radio className="w-3 h-3" />
              <span className="hidden sm:inline text-[11px]">DRONE</span>
            </button>

            <button
              onClick={() => setViewMode('CAMERAS_ONLY')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 font-bold ${
                viewMode === 'CAMERAS_ONLY'
                  ? 'bg-[#FFE600] text-black border-2 border-black shadow-comic-sm btn-comic'
                  : 'text-neutral-700 hover:text-black border-2 border-transparent'
              }`}
              title="4-Channel CCTV Matrix"
            >
              <Grid className="w-3 h-3" />
              <span className="hidden sm:inline text-[11px]">CCTV</span>
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              soundManager.setMuted(!isMuted);
            }}
            className={`p-1.5 rounded-xl border-2 border-black shadow-comic-sm btn-comic transition-all ${
              isMuted ? 'bg-neutral-800 text-neutral-400' : 'bg-[#FFE600] text-black'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Critical SAR Incident Alert Button (if breach active) */}
          {breachEvent && (
            <button
              onClick={() => setIsDispatcherOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 bg-[#FF3B30] hover:bg-[#d90429] text-white rounded-xl border-2 border-black shadow-comic-sm font-comic text-xs flex items-center gap-1.5 btn-comic animate-pulse font-black"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SAR ACTIVE</span>
            </button>
          )}

          {/* Autonomous Scheduler Drawer Button */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl border-2 border-black text-xs font-comic flex items-center gap-1.5 btn-comic shadow-comic-sm font-black transition-all ${
              isDrawerOpen
                ? 'bg-[#00D26A] text-black'
                : 'bg-[#FFE600] text-black hover:bg-[#FFD000]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden md:inline">SCHEDULER</span>
            <span className="bg-black text-[#FFE600] px-1.5 py-0.2 rounded text-[10px] font-mono">
              {schedules.length}
            </span>
          </button>
        </div>
      </header>

      {/* 2. Main Central Workspace */}
      <main className="flex-1 w-full h-[calc(100vh-56px-70px)] flex relative overflow-hidden">
        {/* Left: 3D Drone / Aerial Pasture View */}
        <div
          className={`h-full transition-all duration-300 relative ${
            viewMode === 'DRONE_ONLY'
              ? 'w-full'
              : viewMode === 'CAMERAS_ONLY'
              ? 'hidden'
              : 'w-full lg:w-3/5 border-r-4 border-black'
          }`}
        >
          <DroneView3D onCameraSelect={handleCameraSelect} />
        </div>

        {/* Right: Multi-Camera Feed Subsystem (4 Channels) */}
        <div
          className={`h-full transition-all duration-300 relative ${
            viewMode === 'CAMERAS_ONLY'
              ? 'w-full'
              : viewMode === 'DRONE_ONLY'
              ? 'hidden'
              : 'hidden lg:block lg:w-2/5'
          }`}
        >
          <CameraFeeds onFocusCamera={handleCameraSelect} />
        </div>
      </main>

      {/* 3. Bottom Time-Scrubber & Ranch Schedule State Machine */}
      <footer className="h-[70px] w-full shrink-0 z-30">
        <TimeScrubber />
      </footer>

      {/* 4. Collapsible Natural Language AI Scheduler Drawer */}
      <SchedulerPanel isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* 5. Emergency Search & Rescue Tactical Dispatch Modal */}
      <EmergencyDispatcher
        isOpen={isDispatcherOpen}
        onClose={() => setIsDispatcherOpen(false)}
      />
    </div>
  );
}
