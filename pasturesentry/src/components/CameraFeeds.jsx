import React, { useEffect, useRef, useState } from 'react';
import { useRanch } from '../context/RanchContext';
import { soundManager } from '../utils/audio';
import { Camera, Eye, Maximize2, RefreshCw, ShieldAlert, Video, VideoOff, Wifi, ZoomIn, Crosshair, Grid, ArrowLeft } from 'lucide-react';

// Detection data and real photo feeds matching the landing page
const CAM_DETECTIONS = {
  'CAM-01': {
    name: 'WATER TROUGH',
    src: '/cam1_water_trough.jpg',
    tally: '12 HEAD DETECTED',
    sector: 'Sector Alpha',
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
    ],
  },
  'CAM-02': {
    name: 'SHELTER BARN',
    src: '/cam2_shelter_barn.jpg',
    tally: '10 HEAD IN PENS',
    sector: 'Sector Bravo',
    boxes: [
      { id: 'COW-35', conf: '99.7%', left: '25.5%', top: '62.5%', width: '14.0%', height: '13.5%' },
      { id: 'COW-36', conf: '99.2%', left: '33.5%', top: '56.0%', width: '11.5%', height: '11.5%' },
      { id: 'COW-37', conf: '98.5%', left: '36.2%', top: '53.0%', width: '10.2%', height: '8.5%' },
      { id: 'COW-38', conf: '98.9%', left: '40.8%', top: '47.0%', width: '9.8%', height: '11.2%' },
      { id: 'COW-39', conf: '99.6%', left: '54.8%', top: '52.0%', width: '12.0%', height: '16.5%' },
      { id: 'COW-40', conf: '98.8%', left: '56.5%', top: '48.8%', width: '9.5%', height: '8.2%' },
      { id: 'COW-41', conf: '98.4%', left: '73.5%', top: '55.0%', width: '8.5%', height: '12.5%' },
    ],
  },
  'CAM-03': {
    name: 'NORTH GATE',
    src: '/cam3_north_gate.jpg',
    tally: '5 HEAD IN TRANSIT',
    sector: 'Sector Alpha',
    boxes: [
      { id: 'COW-21', conf: '99.5%', left: '43.2%', top: '46.5%', width: '15.6%', height: '23.8%' },
      { id: 'COW-22', conf: '99.1%', left: '59.2%', top: '41.5%', width: '9.2%', height: '19.5%' },
      { id: 'COW-23', conf: '98.7%', left: '72.8%', top: '41.2%', width: '7.4%', height: '19.0%' },
      { id: 'COW-24', conf: '98.2%', left: '65.2%', top: '36.2%', width: '6.2%', height: '15.0%' },
    ],
  },
  'CAM-04': {
    name: 'EAST PERIMETER',
    src: '/cam4_east_breach.jpg',
    tally: '4 HEAD ESCAPING',
    sector: 'Sector Charlie',
    boxes: [
      { id: 'COW-19', conf: 'BREACH', left: '39.8%', top: '36.8%', width: '23.4%', height: '23.8%', breach: true },
      { id: 'COW-12', conf: 'BREACH', left: '58.2%', top: '42.5%', width: '24.2%', height: '27.5%', breach: true },
      { id: 'COW-04', conf: 'BREACH', left: '16.5%', top: '38.0%', width: '18.0%', height: '22.0%', breach: true },
      { id: 'COW-31', conf: 'BREACH', left: '76.0%', top: '48.0%', width: '18.5%', height: '24.0%', breach: true },
    ],
  },
};

export const CameraFeeds = ({ onFocusCamera }) => {
  const {
    cameras,
    selectedCamera,
    setSelectedCamera,
    ranchStatus,
    isWebcamActive,
    setIsWebcamActive,
  } = useRanch();

  const webcamVideoRef = useRef(null);

  // Setup webcam stream for CAM-02 when enabled
  useEffect(() => {
    let stream = null;
    if (isWebcamActive) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 640, height: 480 }, audio: false })
        .then((s) => {
          stream = s;
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = s;
            webcamVideoRef.current.play();
          }
        })
        .catch(() => {
          setIsWebcamActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isWebcamActive]);

  const toggleWebcam = (e) => {
    e.stopPropagation();
    soundManager.playLockBeep();
    setIsWebcamActive(!isWebcamActive);
  };

  const handleSelectCam = (cam) => {
    soundManager.playLockBeep();
    setSelectedCamera(cam);
    if (onFocusCamera) onFocusCamera(cam);
  };

  const handleShowAll = () => {
    soundManager.playLockBeep();
    setSelectedCamera(null);
  };

  // Dedicated single camera mode if a camera is selected
  const dedicatedCam = selectedCamera
    ? cameras.find((c) => c.id === (selectedCamera.id || selectedCamera)) || selectedCamera
    : null;

  return (
    <div className="w-full h-full flex flex-col bg-[#F4EEDD] halftone-bg p-3 overflow-y-auto space-y-3 font-mono text-black">
      {/* Comic Header bar */}
      <div className="bg-white border-3 border-black p-2.5 sm:p-3 rounded-2xl shadow-comic flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#FFE600] border-2 border-black text-black shadow-comic-sm">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black font-comic tracking-wider text-black">
              {dedicatedCam
                ? `DEDICATED FEED: ${dedicatedCam.id} • ${(CAM_DETECTIONS[dedicatedCam.id]?.name || dedicatedCam.name).toUpperCase()}`
                : 'MULTI-SPECTRAL CCTV MATRIX (4 CHANNELS)'}
            </h2>
            <p className="text-[10px] text-neutral-600 font-bold">
              {dedicatedCam
                ? `ZONE: ${dedicatedCam.sector} • AI SENTINEL ACTIVE`
                : '100% OFFLINE EDGE INFERENCE'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-bold">
          {dedicatedCam ? (
            <button
              onClick={handleShowAll}
              className="bg-[#FFE600] hover:bg-yellow-400 text-black border-2 border-black px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-comic font-black shadow-comic-sm btn-comic cursor-pointer transition-all"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>SHOW ALL 4 CAMS</span>
            </button>
          ) : (
            <>
              <span className="bg-[#00D26A] text-black border-2 border-black px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono shadow-comic-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                4/4 SYNCED
              </span>
              <span className="bg-[#FFE600] text-black border-2 border-black px-2 py-0.5 rounded-lg font-bold shadow-comic-sm hidden sm:inline">
                H.265 EDGE
              </span>
            </>
          )}
        </div>
      </div>

      {/* Quick Camera Selector Bar when in dedicated mode */}
      {dedicatedCam && (
        <div className="bg-white border-3 border-black p-1.5 rounded-2xl shadow-comic flex items-center justify-between gap-1 text-[11px] font-bold">
          <span className="text-[10px] text-neutral-600 px-2 font-black font-comic hidden sm:inline">
            SELECT CHANNEL:
          </span>
          <div className="flex items-center gap-1 flex-1 sm:flex-initial overflow-x-auto">
            {cameras.map((c) => {
              const isCur = dedicatedCam.id === c.id;
              const isBreach = c.id === 'CAM-04' && ranchStatus === 'BREACH';
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectCam(c)}
                  className={`px-2.5 py-1 rounded-xl border-2 font-mono text-[10px] font-black transition-all btn-comic shadow-comic-sm cursor-pointer ${
                    isCur
                      ? 'bg-[#FFE600] border-black text-black'
                      : isBreach
                      ? 'bg-[#FF3B30] border-black text-white animate-pulse'
                      : 'bg-[#FAF7F0] border-black text-neutral-800 hover:bg-neutral-200'
                  }`}
                >
                  {c.id}
                </button>
              );
            })}
            <button
              onClick={handleShowAll}
              className="px-2.5 py-1 rounded-xl border-2 border-black bg-white text-black font-comic font-black text-[10px] flex items-center gap-1 shadow-comic-sm hover:bg-neutral-100 cursor-pointer"
            >
              <Grid className="w-3 h-3" />
              <span>ALL 4</span>
            </button>
          </div>
        </div>
      )}

      {/* DEDICATED SINGLE CAMERA VIEW (When a camera is clicked) */}
      {dedicatedCam ? (
        (() => {
          const cam = dedicatedCam;
          const isCam02 = cam.id === 'CAM-02';
          const isBreachZone = cam.id === 'CAM-04' && ranchStatus === 'BREACH';
          const detection = CAM_DETECTIONS[cam.id] || {};

          return (
            <div
              className={`relative bg-white border-3 border-black rounded-2xl overflow-hidden shadow-comic flex flex-col flex-1 ${
                isBreachZone ? 'ring-4 ring-[#FF3B30] border-[#FF3B30] shadow-comic-red' : ''
              }`}
            >
              {/* Header Pill */}
              <div
                className={`px-4 py-2 border-b-3 border-black flex items-center justify-between font-comic text-xs font-black tracking-wider ${
                  isBreachZone ? 'bg-[#FF3B30] text-white' : 'bg-[#FFE600] text-black'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full border border-black ${
                      isBreachZone ? 'bg-white animate-ping' : 'bg-[#00D26A]'
                    }`}
                  />
                  <span>YOLO-V8 • {detection.name || cam.name} (LIVE DEDICATED CHANNEL)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-black text-[#00FF66] px-2 py-0.5 rounded font-mono font-bold">
                    30.1 FPS • 1080P
                  </span>
                  <span className="text-[11px] bg-black text-white px-2 py-0.5 rounded font-mono font-black">
                    {cam.id}
                  </span>
                </div>
              </div>

              {/* Large Feed Image / Video Container */}
              <div className="relative w-full aspect-video md:aspect-[16/10] bg-black overflow-hidden select-none flex-1">
                {isCam02 && isWebcamActive ? (
                  <div className="relative w-full h-full">
                    <video
                      ref={webcamVideoRef}
                      className="w-full h-full object-cover transform scale-x-[-1]"
                      autoPlay
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="bg-[#FF3B30] text-white font-mono text-[10px] px-2 py-0.5 rounded font-black border border-black animate-pulse shadow-comic-sm">
                          ● LIVE WEBCAM FEED
                        </span>
                        <span className="bg-[#00D26A] text-black font-mono text-[10px] px-2 py-0.5 rounded font-bold border border-black shadow-comic-sm">
                          YOLO-V8 ACTIVE
                        </span>
                      </div>
                      <div className="self-center w-48 h-48 border-3 border-[#00D26A] rounded-xl relative animate-pulse flex items-start p-1.5 bg-[#00D26A]/10">
                        <span className="bg-[#00D26A] text-black font-mono text-[10px] font-black px-1 rounded border border-black">
                          RANCH OPERATOR 99.4%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={detection.src}
                      alt={cam.name}
                      className="w-full h-full object-cover"
                      loading="eager"
                    />

                    {/* Scanline CRT overlay */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-25" />

                    {/* Bounding Boxes */}
                    {(detection.boxes || []).map((box, idx) => {
                      const isBreachBox = box.breach || isBreachZone;
                      return (
                        <div
                          key={idx}
                          style={{
                            left: box.left,
                            top: box.top,
                            width: box.width,
                            height: box.height,
                          }}
                          className={`absolute border-2 pointer-events-none transition-all ${
                            isBreachBox
                              ? 'border-[#FF3B30] bg-[#FF3B30]/25 shadow-[0_0_8px_#FF3B30] animate-pulse'
                              : 'border-[#00D26A] bg-[#00D26A]/15'
                          }`}
                        >
                          <span
                            className={`absolute -top-3.5 left-0 text-[8px] font-mono font-black px-1 rounded border border-black whitespace-nowrap shadow-comic-sm ${
                              isBreachBox ? 'bg-[#FF3B30] text-white' : 'bg-[#00D26A] text-black'
                            }`}
                          >
                            {box.id} [{box.conf}]
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Webcam toggle on CAM-02 */}
                {isCam02 && (
                  <button
                    onClick={toggleWebcam}
                    className="absolute top-3 right-3 pointer-events-auto bg-[#FFE600] text-black border-2 border-black px-2.5 py-1 rounded-xl text-xs font-bold font-comic flex items-center gap-1.5 shadow-comic-sm btn-comic transition-all"
                  >
                    {isWebcamActive ? (
                      <>
                        <VideoOff className="w-3.5 h-3.5 text-[#FF3B30]" />
                        <span>DISCONNECT</span>
                      </>
                    ) : (
                      <>
                        <Video className="w-3.5 h-3.5 text-black" />
                        <span>LAPTOP WEBCAM</span>
                      </>
                    )}
                  </button>
                )}

                {/* Live Headcount Pill at Bottom-Left */}
                <div className="absolute bottom-3 left-3 pointer-events-none">
                  <span className="bg-black/90 text-[#00FF66] font-mono text-xs font-black px-2.5 py-1 rounded-lg border border-neutral-700 shadow-comic flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
                    {detection.tally || 'SCANNING...'}
                  </span>
                </div>
              </div>

              {/* Feed Card Footer Description & Telemetry */}
              <div className="p-3 border-t-3 border-black bg-[#FAF7F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-black text-white px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                      ZONE: {cam.sector}
                    </span>
                    <span className="text-xs font-bold text-neutral-800">
                      {cam.description || cam.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    EXPECTED CAPACITY: {cam.expectedCapacity || 30} HEAD • AI CONFIDENCE: 98.9%
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleShowAll}
                    className="bg-white hover:bg-neutral-100 text-black border-2 border-black px-3 py-1.5 rounded-xl text-xs font-comic font-black flex items-center gap-1.5 shadow-comic-sm btn-comic"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>ALL 4 CAMERAS</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        /* 2x2 Camera Grid in Comic Neubrutalism Cards (When no camera is selected) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
          {cameras.map((cam) => {
            const isSelected = selectedCamera?.id === cam.id;
            const isCam02 = cam.id === 'CAM-02';
            const isBreachZone = cam.id === 'CAM-04' && ranchStatus === 'BREACH';
            const detection = CAM_DETECTIONS[cam.id] || {};

            return (
              <div
                key={cam.id}
                onClick={() => handleSelectCam(cam)}
                className={`relative bg-white border-3 border-black rounded-2xl overflow-hidden shadow-comic cursor-pointer transition-all flex flex-col group ${
                  isBreachZone
                    ? 'ring-4 ring-[#FF3B30] border-[#FF3B30] shadow-comic-red animate-pulse-fast'
                    : isSelected
                    ? 'ring-4 ring-[#FFE600] shadow-comic-lg'
                    : 'hover:translate-x-0.5 hover:translate-y-0.5'
                }`}
              >
                {/* Comic Header Pill on Camera Feed */}
                <div
                  className={`px-3 py-1.5 border-b-3 border-black flex items-center justify-between font-comic text-xs font-black tracking-wider ${
                    isBreachZone
                      ? 'bg-[#FF3B30] text-white'
                      : isSelected
                      ? 'bg-[#FFE600] text-black'
                      : 'bg-[#FFE600] text-black'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full border border-black ${
                        isBreachZone ? 'bg-white animate-ping' : 'bg-[#00D26A]'
                      }`}
                    />
                    <span>YOLO-V8 • {detection.name || cam.name}</span>
                  </div>
                  <span className="text-[10px] bg-black text-white px-2 py-0.2 rounded font-mono">
                    {cam.id}
                  </span>
                </div>

                {/* Feed Image Container with Bounding Boxes */}
                <div className="relative w-full aspect-video bg-black overflow-hidden select-none">
                  {isCam02 && isWebcamActive ? (
                    <div className="relative w-full h-full">
                      <video
                        ref={webcamVideoRef}
                        className="w-full h-full object-cover transform scale-x-[-1]"
                        autoPlay
                        playsInline
                        muted
                      />
                      <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="bg-[#FF3B30] text-white font-mono text-[10px] px-2 py-0.5 rounded font-black border border-black animate-pulse shadow-comic-sm">
                            ● LIVE WEBCAM FEED
                          </span>
                          <span className="bg-[#00D26A] text-black font-mono text-[10px] px-2 py-0.5 rounded font-bold border border-black shadow-comic-sm">
                            YOLO-V8 ACTIVE
                          </span>
                        </div>
                        <div className="self-center w-36 h-36 border-3 border-[#00D26A] rounded-xl relative animate-pulse flex items-start p-1 bg-[#00D26A]/10">
                          <span className="bg-[#00D26A] text-black font-mono text-[9px] font-black px-1 rounded border border-black">
                            RANCH OPERATOR 99.4%
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full">
                      <img
                        src={detection.src}
                        alt={cam.name}
                        className="w-full h-full object-cover"
                        loading="eager"
                      />

                      {/* Scanline CRT overlay */}
                      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-25" />

                      {/* Bounding Boxes */}
                      {(detection.boxes || []).map((box, idx) => {
                        const isBreachBox = box.breach || isBreachZone;
                        return (
                          <div
                            key={idx}
                            style={{
                              left: box.left,
                              top: box.top,
                              width: box.width,
                              height: box.height,
                            }}
                            className={`absolute border-2 pointer-events-none transition-all ${
                              isBreachBox
                                ? 'border-[#FF3B30] bg-[#FF3B30]/25 shadow-[0_0_8px_#FF3B30] animate-pulse'
                                : 'border-[#00D26A] bg-[#00D26A]/15'
                            }`}
                          >
                            <span
                              className={`absolute -top-3.5 left-0 text-[8px] font-mono font-black px-1 rounded border border-black whitespace-nowrap shadow-comic-sm ${
                                isBreachBox
                                  ? 'bg-[#FF3B30] text-white'
                                  : 'bg-[#00D26A] text-black'
                              }`}
                            >
                              {box.id} [{box.conf}]
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Webcam toggle on CAM-02 */}
                  {isCam02 && (
                    <button
                      onClick={toggleWebcam}
                      className="absolute top-2 right-2 pointer-events-auto bg-[#FFE600] text-black border-2 border-black px-2 py-0.5 rounded-lg text-[10px] font-bold font-comic flex items-center gap-1 shadow-comic-sm btn-comic transition-all"
                    >
                      {isWebcamActive ? (
                        <>
                          <VideoOff className="w-3 h-3 text-[#FF3B30]" />
                          <span>DISCONNECT</span>
                        </>
                      ) : (
                        <>
                          <Video className="w-3 h-3 text-black" />
                          <span>LAPTOP WEBCAM</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Live Headcount Pill at Bottom-Left */}
                  <div className="absolute bottom-2 left-2 pointer-events-none">
                    <span className="bg-black/85 text-[#00FF66] font-mono text-[10px] font-black px-2 py-0.5 rounded border border-neutral-700 shadow-comic-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-ping" />
                      {detection.tally || 'SCANNING...'}
                    </span>
                  </div>
                </div>

                {/* Feed Card Footer Description in Comic style */}
                <div className="p-2.5 flex items-center justify-between text-xs border-t-2 border-black bg-[#FAF7F0]">
                  <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                    <span className="bg-black text-white px-1.5 py-0.2 rounded text-[9px] font-mono font-bold">
                      ZONE
                    </span>
                    <span className="text-[11px] font-bold text-neutral-800 truncate">
                      {cam.sector}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectCam(cam);
                    }}
                    className="bg-[#FFE600] hover:bg-[#FFD000] text-black border-2 border-black px-2 py-0.5 rounded-lg text-[10px] font-comic font-black flex items-center gap-1 shadow-comic-sm btn-comic"
                  >
                    <span>DEDICATE</span>
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
