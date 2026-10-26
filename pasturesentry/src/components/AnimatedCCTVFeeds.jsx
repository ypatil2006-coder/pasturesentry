import React, { useState, useEffect } from 'react';
import { soundManager } from '../utils/audio';
import { Crosshair, Send, ShieldAlert, Maximize2, X, ZoomIn } from 'lucide-react';

// Bounding boxes per camera location matching the 4 zones on the isometric map
const CAM_DETECTIONS = {
  'CAM-01': {
    name: 'WATER TROUGH',
    src: '/cam1_water_trough.jpg',
    tally: '12 HEAD DETECTED',
    sector: 'Central Pasture Sector Alpha',
    boxes: [
      { id: 'COW-01', conf: '99.7%', left: '12.8%', top: '58.5%', width: '15.5%', height: '21.0%' },
      { id: 'COW-02', conf: '99.1%', left: '23.8%', top: '63.5%', width: '4.8%', height: '20.0%' },
      { id: 'COW-03', conf: '99.5%', left: '28.5%', top: '63.5%', width: '14.0%', height: '15.0%' },
      { id: 'COW-04', conf: '99.6%', left: '34.5%', top: '56.0%', width: '15.0%', height: '12.5%' },
      { id: 'COW-05', conf: '98.7%', left: '20.2%', top: '49.0%', width: '8.8%', height: '11.5%' },
      { id: 'COW-06', conf: '98.8%', left: '24.8%', top: '51.5%', width: '9.2%', height: '11.8%' },
      { id: 'COW-07', conf: '99.4%', left: '59.8%', top: '47.0%', width: '10.0%', height: '11.5%' },
      { id: 'COW-08', conf: '98.2%', left: '72.2%', top: '48.0%', width: '4.8%', height: '12.0%' },
      { id: 'COW-09', conf: '98.0%', left: '51.5%', top: '43.0%', width: '4.8%', height: '10.5%' },
      { id: 'COW-10', conf: '98.5%', left: '45.8%', top: '47.5%', width: '6.8%', height: '9.5%' },
      { id: 'COW-11', conf: '98.2%', left: '41.8%', top: '43.0%', width: '8.0%', height: '9.0%' },
      { id: 'COW-12', conf: '97.9%', left: '28.8%', top: '44.0%', width: '6.4%', height: '8.0%' },
    ],
  },
  'CAM-02': {
    name: 'SHELTER BARN',
    src: '/cam2_shelter_barn.jpg',
    tally: '10 HEAD IN PENS',
    sector: 'Northwest Corral Barn Zone',
    boxes: [
      { id: 'COW-35', conf: '99.7%', left: '25.5%', top: '62.5%', width: '14.0%', height: '13.5%' },
      { id: 'COW-36', conf: '99.2%', left: '33.5%', top: '56.0%', width: '11.5%', height: '11.5%' },
      { id: 'COW-37', conf: '98.5%', left: '36.2%', top: '53.0%', width: '10.2%', height: '8.5%' },
      { id: 'COW-38', conf: '98.9%', left: '40.8%', top: '47.0%', width: '9.8%', height: '11.2%' },
      { id: 'COW-39', conf: '99.6%', left: '54.8%', top: '52.0%', width: '12.0%', height: '16.5%' },
      { id: 'COW-40', conf: '98.8%', left: '56.5%', top: '48.8%', width: '9.5%', height: '8.2%' },
      { id: 'COW-41', conf: '98.4%', left: '73.5%', top: '55.0%', width: '8.5%', height: '12.5%' },
      { id: 'COW-42', conf: '97.9%', left: '75.8%', top: '47.0%', width: '5.8%', height: '8.0%' },
      { id: 'COW-43', conf: '98.1%', left: '9.5%', top: '55.5%', width: '7.0%', height: '8.5%' },
      { id: 'COW-44', conf: '97.6%', left: '14.0%', top: '52.0%', width: '7.0%', height: '8.2%' },
    ],
  },
  'CAM-03': {
    name: 'NORTH GATE',
    src: '/cam3_north_gate.jpg',
    tally: '5 HEAD IN TRANSIT',
    sector: 'North Pasture Transit Corridor',
    boxes: [
      { id: 'COW-21', conf: '99.5%', left: '43.2%', top: '46.5%', width: '15.6%', height: '23.8%' },
      { id: 'COW-22', conf: '99.1%', left: '59.2%', top: '41.5%', width: '9.2%', height: '19.5%' },
      { id: 'COW-23', conf: '98.7%', left: '72.8%', top: '41.2%', width: '7.4%', height: '19.0%' },
      { id: 'COW-24', conf: '98.2%', left: '65.2%', top: '36.2%', width: '6.2%', height: '15.0%' },
      { id: 'COW-25', conf: '96.5%', left: '76.0%', top: '33.2%', width: '4.6%', height: '9.0%' },
    ],
  },
  'CAM-04': {
    name: 'EAST PERIMETER',
    src: '/cam4_east_breach.jpg',
    tally: '4 HEAD ESCAPING',
    sector: 'East Boundary Fence Gap #42',
    boxes: [
      { id: 'COW-19', conf: 'BREACH', left: '39.8%', top: '36.8%', width: '23.4%', height: '23.8%', breach: true },
      { id: 'COW-12', conf: 'BREACH', left: '58.2%', top: '42.5%', width: '24.2%', height: '27.5%', breach: true },
      { id: 'COW-04', conf: 'BREACH', left: '64.8%', top: '37.2%', width: '17.5%', height: '12.0%', breach: true },
      { id: 'COW-31', conf: 'BREACH', left: '81.0%', top: '42.0%', width: '15.5%', height: '24.2%', breach: true },
    ],
  },
};

export const AnimatedCCTVFeeds = ({
  cameraFocus,
  onSelectCamera,
  isBreached,
  isWebcamActive,
  onToggleWebcam,
  webcamVideoRef,
}) => {
  const [userQuery, setUserQuery] = useState('');
  const [queryResponse, setQueryResponse] = useState(null);
  const [enlargedCam, setEnlargedCam] = useState(null);

  // Close enlarged view on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setEnlargedCam(null);
    };
    if (enlargedCam) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [enlargedCam]);

  const handleQuery = (e) => {
    e.preventDefault();
    if (!userQuery.trim()) return;
    soundManager.playLockBeep();
    setUserQuery('');
    setTimeout(() => {
      soundManager.playRadarBlip();
      setQueryResponse(
        'Ollama SAR Dispatch: Confirmed 4 Angus cattle exited via East Gap #42. Drone Alpha-01 intercept bearing 082° toward Highway 81.'
      );
    }, 400);
  };

  const handleCardClick = (camId) => {
    soundManager.playLockBeep();
    onSelectCamera(camId);
    setEnlargedCam(camId);
  };

  const renderFeed = (camId, headerColor, isAlert = false) => {
    const cam = CAM_DETECTIONS[camId];
    const isCam2Webcam = camId === 'CAM-02' && isWebcamActive;
    const isSelected = cameraFocus === camId;

    return (
      <div
        key={camId}
        onClick={() => handleCardClick(camId)}
        className={`group bg-white border-3 border-black rounded-xl overflow-hidden shadow-comic-sm cursor-zoom-in transition-all ${
          isSelected ? 'ring-3 ring-[#FFE600]' : 'hover:scale-[1.01]'
        }`}
      >
        {/* Header Pill */}
        <div className={`${headerColor} px-3 py-1 border-b-2 border-black flex items-center justify-between`}>
          <span className="font-comic text-[11px] font-black uppercase tracking-wide flex items-center gap-1">
            <Crosshair className="w-3 h-3" />
            YOLO-V8 • {cam.name}
          </span>
          <div className="flex items-center gap-1">
            {camId === 'CAM-02' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWebcam();
                }}
                className="text-[8px] bg-[#FFE600] text-black px-1.5 py-0.2 rounded font-bold hover:bg-[#FFD000] border border-black/40"
                title="Toggle Live Webcam"
              >
                {isWebcamActive ? 'WEBCAM ON' : 'CAM'}
              </button>
            )}
            <span className="font-mono text-[8px] font-bold bg-black text-white px-1.5 rounded">
              {camId}
            </span>
          </div>
        </div>

        {/* Video / Photo Feed */}
        <div className="relative aspect-video bg-[#1F3325] overflow-hidden">
          {camId === 'CAM-02' && (
            <video
              ref={webcamVideoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover z-10 ${
                isCam2Webcam ? 'block' : 'hidden'
              }`}
            />
          )}

          <img
            src={cam.src}
            alt={cam.name}
            className="w-full h-full object-cover block"
          />

          {/* Bounding Boxes on Every Visible Cow */}
          {isCam2Webcam ? (
            <div className="absolute top-[20%] left-[30%] w-[40%] h-[60%] border-2 border-[#FFE600] bg-[#FFE600]/10 flex flex-col justify-between p-0.5 pointer-events-none z-20">
              <span className="bg-[#FFE600] text-black font-mono text-[7px] font-black px-1 leading-none self-start">
                OPERATOR #01 [99.5%]
              </span>
              <span className="text-[#FFE600] font-mono text-[6px] self-end bg-black/60 px-1">
                BARN GATE MONITOR
              </span>
            </div>
          ) : (
            cam.boxes.map((cow) => {
              const alert = isAlert || cow.breach || (isBreached && camId === 'CAM-04');
              const borderColor = alert ? 'border-[#FF3B30]' : 'border-[#00D26A]';
              const bgColor = alert ? 'bg-[#FF3B30]/20' : 'bg-[#00D26A]/10';
              const badgeBg = alert ? 'bg-[#FF3B30] text-white' : 'bg-[#00D26A] text-black';
              const label = alert ? `${cow.id} [BREACH]` : `${cow.id} [${cow.conf}]`;

              return (
                <div
                  key={cow.id}
                  style={{
                    left: cow.left,
                    top: cow.top,
                    width: cow.width,
                    height: cow.height,
                  }}
                  className={`absolute pointer-events-none transition-all flex flex-col justify-start border-[1.5px] ${borderColor} ${bgColor}`}
                >
                  <span
                    className={`${badgeBg} font-mono text-[5.5px] sm:text-[6.5px] md:text-[7px] font-black px-0.5 leading-none self-start border border-black/50 shadow-sm whitespace-nowrap`}
                  >
                    {label}
                  </span>
                </div>
              );
            })
          )}

          {/* Click to Enlarge Hover Badge */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="bg-black/85 text-[#FFE600] font-comic text-[10px] font-bold px-2 py-1 rounded-lg border border-[#FFE600] shadow-comic-sm flex items-center gap-1">
              <ZoomIn className="w-3 h-3" />
              CLICK TO ENLARGE
            </span>
          </div>

          {/* HUD Status Overlay */}
          <div className="absolute bottom-1.5 left-2 bg-black/80 font-mono text-[7px] font-bold px-1.5 py-0.5 rounded border border-black/50 flex items-center gap-1 pointer-events-none z-20">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAlert ? 'bg-[#FF3B30] animate-ping' : 'bg-[#00D26A]'
              }`}
            />
            <span className={isAlert ? 'text-[#FF3B30]' : 'text-[#00D26A]'}>
              {cam.tally} • 30.1 FPS
            </span>
          </div>
        </div>
      </div>
    );
  };

  const activeEnlarged = enlargedCam ? CAM_DETECTIONS[enlargedCam] : null;

  return (
    <div className="relative flex flex-col space-y-3 select-none">
      {/* Top-Right Starburst */}
      <div className="absolute -top-6 -right-3 z-30 transform rotate-12 pointer-events-none">
        <div className="relative flex items-center justify-center">
          <svg className="w-24 h-24 drop-shadow-[3px_3px_0px_#000]" viewBox="0 0 100 100">
            <polygon
              points="50,0 63,22 88,10 82,35 100,50 82,65 88,90 63,78 50,100 37,78 12,90 18,65 0,50 18,35 12,10 37,22"
              fill="#00D26A"
              stroke="#000000"
              strokeWidth="3.5"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
            <span className="font-comic text-white text-base font-black tracking-tight drop-shadow-[1px_1px_0px_#000]">
              ZAP!
            </span>
            <span className="font-comic text-yellow-200 text-[8px] font-black uppercase">
              100% OFFLINE
            </span>
          </div>
        </div>
      </div>

      {/* 2x2 CCTV Matrix Grid matching the 4 Zones */}
      <div className="grid grid-cols-2 gap-3">
        {renderFeed('CAM-01', 'bg-[#FFE600] text-black', false)}
        {renderFeed('CAM-02', 'bg-[#FF3B30] text-white', isBreached)}
        {renderFeed('CAM-03', 'bg-[#FFE600] text-black', false)}
        {renderFeed('CAM-04', 'bg-[#FF3B30] text-white', true)}
      </div>

      {/* Ollama Dispatch Card */}
      <div className="bg-white border-3 border-black rounded-2xl p-3 shadow-comic-sm space-y-1.5">
        <div className="flex items-center justify-between">
          <h4 className="font-comic text-xs font-black uppercase text-black tracking-wide flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-[#FF3B30]" />
            OLLAMA DISPATCH: EAST FENCE ESCAPE ALERT
          </h4>
          <span className="text-[9px] font-mono font-bold bg-[#FFE600] px-1.5 py-0.2 rounded border border-black">
            QWEN2.5-CODER
          </span>
        </div>

        <p className="text-[11px] font-mono font-semibold text-neutral-700">
          DETAILS DISPATCH: EAST FENCE ESCAPE ALERT • BEARING 082° EAST TOWARD HIGHWAY 81 • DRONE SENTINEL DISPATCHED.
        </p>

        {queryResponse && (
          <div className="text-[10px] font-mono bg-[#141414] text-[#00D26A] p-2 rounded-xl border border-black leading-relaxed">
            {queryResponse}
          </div>
        )}

        <form onSubmit={handleQuery} className="flex gap-2 pt-1">
          <input
            type="text"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Ask Ollama: 'Where is COW-12 heading?'..."
            className="flex-1 bg-[#FAF7F0] border-2 border-black rounded-xl px-2.5 py-1 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFE600]"
          />
          <button
            type="submit"
            className="bg-[#FFE600] hover:bg-[#FFD000] text-black px-3 py-1 rounded-xl border-2 border-black font-bold text-xs btn-comic shadow-comic-sm flex items-center gap-1"
          >
            <Send className="w-3 h-3" />
            <span>ASK</span>
          </button>
        </form>
      </div>

      {/* ======================================================= */}
      {/* ENLARGED MODAL VIEW FOR CLICKED CAMERA                  */}
      {/* ======================================================= */}
      {enlargedCam && activeEnlarged && (
        <div
          onClick={() => setEnlargedCam(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_#000] overflow-hidden max-w-4xl w-full flex flex-col"
          >
            {/* Modal Title Bar */}
            <div
              className={`${
                enlargedCam === 'CAM-04' || (enlargedCam === 'CAM-02' && isBreached)
                  ? 'bg-[#FF3B30] text-white'
                  : 'bg-[#FFE600] text-black'
              } px-4 py-2 border-b-3 border-black flex items-center justify-between`}
            >
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4" />
                <span className="font-comic text-sm sm:text-base font-black uppercase tracking-wide">
                  YOLO-V8 HIGH-RES CCTV • {activeEnlarged.name} [{enlargedCam}]
                </span>
                <span className="hidden sm:inline font-mono text-[10px] bg-black text-white px-2 py-0.5 rounded-md font-bold">
                  {activeEnlarged.sector}
                </span>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setEnlargedCam(null)}
                className="bg-black hover:bg-[#FF3B30] text-white px-2.5 py-1 rounded-lg border-2 border-black font-mono text-xs font-black flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>CLOSE [ESC]</span>
              </button>
            </div>

            {/* Modal Image Body with High-Res Bounding Boxes */}
            <div className="relative aspect-video bg-[#1F3325] overflow-hidden">
              {enlargedCam === 'CAM-02' && isWebcamActive ? (
                <video
                  ref={webcamVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={activeEnlarged.src}
                  alt={activeEnlarged.name}
                  className="w-full h-full object-cover block"
                />
              )}

              {/* High-Res Bounding Boxes */}
              {enlargedCam === 'CAM-02' && isWebcamActive ? (
                <div className="absolute top-[20%] left-[30%] w-[40%] h-[60%] border-3 border-[#FFE600] bg-[#FFE600]/15 flex flex-col justify-between p-1 pointer-events-none">
                  <span className="bg-[#FFE600] text-black font-mono text-xs font-black px-1.5 py-0.5 leading-none self-start border border-black shadow">
                    OPERATOR #01 [99.5%]
                  </span>
                  <span className="text-[#FFE600] font-mono text-[10px] self-end bg-black/75 px-1.5 py-0.5 rounded">
                    BARN GATE MONITOR
                  </span>
                </div>
              ) : (
                activeEnlarged.boxes.map((cow) => {
                  const alert =
                    cow.breach ||
                    enlargedCam === 'CAM-04' ||
                    (isBreached && enlargedCam === 'CAM-02');
                  const borderColor = alert ? 'border-[#FF3B30]' : 'border-[#00D26A]';
                  const bgColor = alert ? 'bg-[#FF3B30]/20' : 'bg-[#00D26A]/15';
                  const badgeBg = alert
                    ? 'bg-[#FF3B30] text-white'
                    : 'bg-[#00D26A] text-black';
                  const label = alert
                    ? `${cow.id} [BREACH ALERT]`
                    : `${cow.id} [${cow.conf}]`;

                  return (
                    <div
                      key={cow.id}
                      style={{
                        left: cow.left,
                        top: cow.top,
                        width: cow.width,
                        height: cow.height,
                      }}
                      className={`absolute pointer-events-none flex flex-col justify-start border-2 ${borderColor} ${bgColor}`}
                    >
                      <span
                        className={`${badgeBg} font-mono text-[8px] sm:text-[10px] font-black px-1 py-0.5 leading-none self-start border border-black/60 shadow-sm whitespace-nowrap`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })
              )}

              {/* Telemetry Status Bar */}
              <div className="absolute bottom-3 left-3 bg-black/85 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-lg border-2 border-black flex items-center gap-2 pointer-events-none">
                <span
                  className={`w-2 h-2 rounded-full ${
                    enlargedCam === 'CAM-04' ? 'bg-[#FF3B30] animate-ping' : 'bg-[#00D26A]'
                  }`}
                />
                <span className={enlargedCam === 'CAM-04' ? 'text-[#FF3B30]' : 'text-[#00D26A]'}>
                  {activeEnlarged.tally}
                </span>
                <span className="text-neutral-400">|</span>
                <span>YOLO-V8x 1080p • 60 FPS</span>
              </div>
            </div>

            {/* Modal Footer with Camera Switcher Buttons */}
            <div className="bg-[#FAF7F0] p-3 border-t-3 border-black flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-comic text-xs font-black uppercase text-neutral-600">
                  SWITCH CAMERA:
                </span>
                {['CAM-01', 'CAM-02', 'CAM-03', 'CAM-04'].map((cid) => (
                  <button
                    key={cid}
                    onClick={() => {
                      soundManager.playLockBeep();
                      setEnlargedCam(cid);
                      onSelectCamera(cid);
                    }}
                    className={`px-2.5 py-1 rounded-lg border-2 border-black font-mono text-xs font-black transition-all ${
                      enlargedCam === cid
                        ? 'bg-[#FFE600] text-black shadow-comic-sm'
                        : 'bg-white text-neutral-800 hover:bg-neutral-100'
                    }`}
                  >
                    {cid}
                  </button>
                ))}
              </div>

              <div className="text-xs font-mono text-neutral-600">
                Click anywhere outside or press <kbd className="px-1.5 py-0.5 bg-black text-white rounded text-[10px]">ESC</kbd> to exit
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
