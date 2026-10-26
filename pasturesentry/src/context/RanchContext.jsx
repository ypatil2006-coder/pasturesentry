import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { soundManager } from '../utils/audio';
import { checkOllamaHealth, synthesizeSARDispatch } from '../utils/ollama';

const RanchContext = createContext(null);

// Strategic coordinates for the 4 cameras
export const CAMERAS = [
  {
    id: 'CAM-01',
    name: 'Central Water Trough',
    sector: 'Sector Alpha',
    pos: [12, 3.5, -14],
    focusPos: [20, 0, -20],
    description: 'High-density communal water & mineral block corridor (Adjacent Corner)',
    expectedCapacity: 35,
    icon: 'Droplets',
  },
  {
    id: 'CAM-02',
    name: 'Main Shelter Barn',
    sector: 'Sector Bravo',
    pos: [-12, 3.5, -12],
    focusPos: [-20, 0, -20],
    description: 'Indoor timber loafing shed, resting pens & curfew muster corral (North-West Corner)',
    expectedCapacity: 50,
    icon: 'Home',
  },
  {
    id: 'CAM-03',
    name: 'North Pasture Gate',
    sector: 'Sector Alpha',
    pos: [-12, 3.5, 14],
    focusPos: [-18, 0, 18],
    description: 'Main transit corridor & cattle guard checkpoint along the pathway',
    expectedCapacity: 20,
    icon: 'DoorOpen',
  },
  {
    id: 'CAM-04',
    name: 'East Perimeter Boundary',
    sector: 'Sector Charlie',
    pos: [22, 3.5, 14],
    focusPos: [30, 0, 20],
    description: 'Opposite corner perimeter fence door & Highway 81 easement',
    expectedCapacity: 5,
    icon: 'ShieldAlert',
  },
];

// Pre-generated 50 cattle instances with realistic behavioral attributes
const INITIAL_CATTLE = Array.from({ length: 50 }, (_, i) => {
  const idNum = i + 1;
  const idStr = `COW-${String(idNum).padStart(2, '0')}`;
  const isMissingCow = ['COW-12', 'COW-19', 'COW-04', 'COW-31'].includes(idStr);

  return {
    id: idStr,
    tag: `RFID-${8800 + idNum}`,
    name: `Angus #${idNum}`,
    // Start scattered in morning pasture
    x: (Math.random() - 0.5) * 40,
    z: (Math.random() - 0.5) * 40,
    targetX: (Math.random() - 0.5) * 35,
    targetZ: (Math.random() - 0.5) * 35,
    rotation: Math.random() * Math.PI * 2,
    speed: 0.02 + Math.random() * 0.03,
    status: 'GRAZING',
    weightLbs: 1100 + Math.floor(Math.random() * 300),
    tempC: 38.3 + (Math.random() * 0.4),
    isMissingCandidate: isMissingCow,
    currentSector: 'Alpha',
  };
});

export const DEFAULT_SCHEDULES = [
  {
    id: 'sched-1',
    task_name: 'Evening Shelter Curfew',
    target_time: '19:00',
    frequency: 'daily',
    target_zone: 'Shelter Barn (CAM-02)',
    expected_headcount: 50,
    breach_threshold: 1,
    action_on_failure: 'trigger_search_dispatch',
    status: 'ARMED',
    createdAt: 'System Bootstrap',
  },
  {
    id: 'sched-2',
    task_name: 'Noon Trough Headcount Audit',
    target_time: '13:00',
    frequency: 'daily',
    target_zone: 'Central Water Trough (CAM-01)',
    expected_headcount: 35,
    breach_threshold: 5,
    action_on_failure: 'log_anomaly',
    status: 'ARMED',
    createdAt: 'System Bootstrap',
  },
];

export const RanchProvider = ({ children }) => {
  // Time in minutes from midnight (0 to 1439). Default 08:00 AM (480 mins)
  const [timeMinutes, setTimeMinutes] = useState(480);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(5); // 1x, 5x, 20x

  // Ranch state
  const [ranchStatus, setRanchStatus] = useState('NORMAL'); // 'NORMAL', 'AUDITING', 'BREACH', 'DISPATCHING'
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState({ online: false, activeModel: 'Checking...' });

  // 50 Cattle positions & simulation
  const [cattle, setCattle] = useState(INITIAL_CATTLE);

  // Active Schedules - bootstrap with default schedules; updates dynamically with Ollama
  const [schedules, setSchedules] = useState(DEFAULT_SCHEDULES);

  // Breach event details
  const [breachEvent, setBreachEvent] = useState(null);
  const [sarReport, setSarReport] = useState(null);
  const [isSynthesizingSAR, setIsSynthesizingSAR] = useState(false);
  const [dispatcherChat, setDispatcherChat] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDispatcherOpen, setIsDispatcherOpen] = useState(false);

  // Check Ollama on mount
  useEffect(() => {
    checkOllamaHealth().then(setOllamaStatus);
    const interval = setInterval(() => {
      checkOllamaHealth().then(setOllamaStatus);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Sync mute state
  useEffect(() => {
    soundManager.setMuted(isMuted);
  }, [isMuted]);

  // Simulation Clock Tick
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTimeMinutes((prev) => {
        const next = prev + playbackSpeed * 0.1;
        if (next >= 1440) return 0;
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // Procedural Cattle Movement & Time-of-Day State Machine
  useEffect(() => {
    const hours = timeMinutes / 60;
    const isCurfewTriggerTime = hours >= 19.0 && hours <= 21.0;

    setCattle((prevCattle) =>
      prevCattle.map((cow) => {
        let tx = cow.targetX;
        let tz = cow.targetZ;
        let sector = 'Alpha';

        if (hours >= 6 && hours < 11.5) {
          // Morning grazing dispersion (Alpha & Bravo)
          sector = cow.x > 0 ? 'Alpha' : 'Bravo';
          if (Math.abs(cow.x - cow.targetX) < 1 && Math.abs(cow.z - cow.targetZ) < 1) {
            tx = (Math.random() - 0.5) * 45;
            tz = (Math.random() - 0.5) * 35;
          }
        } else if (hours >= 11.5 && hours < 15.5) {
          // Noon water trough congregation (North-East Corner)
          sector = 'Water Trough';
          if (Math.abs(cow.x - cow.targetX) < 1.5) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 2 + Math.random() * 5;
            tx = 20 + Math.cos(angle) * radius;
            tz = -20 + Math.sin(angle) * radius;
          }
        } else if (hours >= 15.5 && hours < 18.5) {
          // Afternoon drift towards Shelter Barn corridor
          sector = 'Bravo';
          if (Math.abs(cow.x - cow.targetX) < 1.5) {
            tx = -15 + (Math.random() - 0.5) * 10;
            tz = -15 + (Math.random() - 0.5) * 10;
          }
        } else if (isCurfewTriggerTime) {
          // Curfew Time (19:00 - 21:00)
          if (cow.id === 'COW-12') {
            // Stray 1: East fence door breach gap
            sector = 'Breached';
            tx = 33.0;
            tz = 18.0;
          } else if (cow.id === 'COW-19') {
            // Stray 2: Following COW-12 onto Highway 81
            sector = 'Breached';
            tx = 37.0;
            tz = 20.0;
          } else if (cow.id === 'COW-04') {
            // Stray 3: East fence door approach
            sector = 'North Creek';
            tx = 29.0;
            tz = 16.0;
          } else if (cow.id === 'COW-31') {
            // Stray 4: Escape trail
            sector = 'North Creek';
            tx = 26.0;
            tz = 14.0;
          } else {
            // 46 compliant cattle assembled inside Shelter Barn in NW Corner
            sector = 'Shelter Barn';
            const barnOffsetX = (Math.random() - 0.5) * 8;
            const barnOffsetZ = (Math.random() - 0.5) * 8;
            tx = -20 + barnOffsetX;
            tz = -20 + barnOffsetZ;
          }
        } else {
          // Night resting inside Shelter Barn
          if (!cow.isMissingCandidate) {
            sector = 'Shelter Barn';
            tx = -20 + (Math.random() - 0.5) * 8;
            tz = -20 + (Math.random() - 0.5) * 8;
          }
        }

        // Smooth step towards target
        const dx = tx - cow.x;
        const dz = tz - cow.z;
        const dist = Math.hypot(dx, dz);
        let newX = cow.x;
        let newZ = cow.z;
        let rot = cow.rotation;

        if (dist > 0.1) {
          const step = Math.min(dist, cow.speed * (isPlaying ? playbackSpeed : 1));
          newX += (dx / dist) * step;
          newZ += (dz / dist) * step;
          rot = Math.atan2(dx, dz);
        }

        return {
          ...cow,
          x: newX,
          z: newZ,
          targetX: tx,
          targetZ: tz,
          rotation: rot,
          currentSector: sector,
        };
      })
    );
  }, [timeMinutes, isPlaying, playbackSpeed]);

  // Automated State Machine Watcher for any scheduled rules created by Local LLM
  const lastAuditedTimeRef = useRef(null);

  useEffect(() => {
    const currentHours = Math.floor(timeMinutes / 60);
    const currentMins = Math.floor(timeMinutes % 60);
    const timeKey = `${String(currentHours).padStart(2, '0')}:${String(currentMins).padStart(2, '0')}`;

    // Check if matching any active scheduled rule created by Local LLM
    const activeScheduledRule = schedules.find(
      (s) => s.status === 'ARMED' && s.target_time === timeKey
    );

    if (activeScheduledRule && lastAuditedTimeRef.current !== timeKey) {
      lastAuditedTimeRef.current = timeKey;
      executeCurfewAudit(activeScheduledRule);
    }
  }, [timeMinutes, schedules]);

  // Execute Headcount Audit on any scheduled rule
  const executeCurfewAudit = async (rule) => {
    setRanchStatus('AUDITING');
    soundManager.playRadarBlip();

    // Dynamically target the camera matching the scheduled zone
    let targetCamId = 'CAM-02';
    const zoneStr = (rule.target_zone || '').toLowerCase();
    const nameStr = (rule.task_name || '').toLowerCase();
    if (rule.target_zone?.includes('CAM-01') || zoneStr.includes('water') || zoneStr.includes('trough') || nameStr.includes('water') || nameStr.includes('trough')) {
      targetCamId = 'CAM-01';
    } else if (rule.target_zone?.includes('CAM-03') || zoneStr.includes('gate') || nameStr.includes('gate')) {
      targetCamId = 'CAM-03';
    } else if (rule.target_zone?.includes('CAM-04') || zoneStr.includes('perimeter') || zoneStr.includes('boundary') || zoneStr.includes('east') || nameStr.includes('perimeter')) {
      targetCamId = 'CAM-04';
    } else {
      targetCamId = 'CAM-02';
    }

    const matchedCam = CAMERAS.find((c) => c.id === targetCamId);
    if (matchedCam) {
      setSelectedCamera(matchedCam);
    }

    setTimeout(async () => {
      const isBreachRule =
        rule.action_on_failure === 'trigger_search_dispatch' ||
        nameStr.includes('curfew') ||
        nameStr.includes('breach');

      const missingCount = isBreachRule ? 4 : 0;
      const expected = rule.expected_headcount || 50;
      const inShelter = expected - missingCount;

      if (isBreachRule && missingCount >= (rule.breach_threshold || 1)) {
        setRanchStatus('BREACH');
        soundManager.startSiren();

        const transitLog = [
          { cow_id: 'COW-12', last_cam: 'East Fence (CAM-04)', last_time: '18:35', heading: 'East towards Highway 81' },
          { cow_id: 'COW-19', last_cam: 'East Fence (CAM-04)', last_time: '18:38', heading: 'East towards Highway 81' },
          { cow_id: 'COW-04', last_cam: 'Water Trough (CAM-01)', last_time: '17:10', heading: 'North Creek Riparian Brush' },
          { cow_id: 'COW-31', last_cam: 'Water Trough (CAM-01)', last_time: '17:10', heading: 'North Creek Riparian Brush' },
        ];

        const event = {
          ruleId: rule.id,
          taskName: rule.task_name,
          curfew: rule.target_time,
          expectedCount: expected,
          inShelterCount: inShelter,
          missingCount,
          missingIds: ['COW-12', 'COW-19', 'COW-04', 'COW-31'],
          transit_log: transitLog,
          timestamp: new Date().toLocaleTimeString(),
        };

        setBreachEvent(event);
        setIsDispatcherOpen(true);
        setIsSynthesizingSAR(true);

        // Auto fly drone to East Perimeter breach
        const breachCam = CAMERAS.find((c) => c.id === 'CAM-04');
        if (breachCam) {
          setSelectedCamera(breachCam);
        }

        // Trigger Ollama SAR synthesis
        try {
          const sarRes = await synthesizeSARDispatch(event, null, ollamaStatus.activeModel);
          setSarReport(sarRes);
          soundManager.playRadioChirp();
        } catch (err) {
          console.error('Ollama SAR synthesis error:', err);
          setSarReport({
            source: 'LOCAL MODEL ERROR',
            error: err.message,
            text: `⚠️ LOCAL MODEL ERROR: ${err.message}\n\nNo simulated or hardcoded fallback directives are permitted. Please verify your local Ollama daemon is active at http://localhost:11434 with model: ${ollamaStatus.activeModel}.`,
          });
        } finally {
          setIsSynthesizingSAR(false);
        }
      } else {
        setRanchStatus('NORMAL');
        soundManager.playRadarBlip();
      }
    }, 1200);
  };

  // Jump simulation to specific time & trigger any armed rule
  const setTimePreset = (hour, minute = 0) => {
    soundManager.playLockBeep();
    const targetMin = hour * 60 + minute;
    setTimeMinutes(targetMin);

    const timeKey = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const matchedRule = schedules.find((s) => s.status === 'ARMED' && s.target_time === timeKey);
    if (matchedRule) {
      setTimeout(() => executeCurfewAudit(matchedRule), 400);
    }
  };

  // Add a newly extracted schedule rule from Ollama
  const addScheduleRule = (newRule) => {
    soundManager.playLockBeep();
    const ruleObj = {
      id: `sched-${Date.now()}`,
      ...newRule,
      status: 'ARMED',
      createdAt: 'AI Schedule Agent',
    };
    setSchedules((prev) => [ruleObj, ...prev]);
  };

  // Remove a single schedule rule by ID
  const removeScheduleRule = (id) => {
    soundManager.playLockBeep();
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  // Clear all schedules for a fresh testing slate
  const clearSchedules = () => {
    soundManager.playLockBeep();
    setSchedules([]);
  };

  // Restore the 2 default bootstrap schedule rules
  const resetDefaultSchedules = () => {
    soundManager.playLockBeep();
    setSchedules(DEFAULT_SCHEDULES);
  };

  // Reset/Clear Breach Alert
  const resolveBreach = () => {
    soundManager.stopSiren();
    soundManager.playLockBeep();
    setRanchStatus('NORMAL');
    setBreachEvent(null);
    setSarReport(null);
    setIsDispatcherOpen(false);
  };

  return (
    <RanchContext.Provider
      value={{
        timeMinutes,
        setTimeMinutes,
        isPlaying,
        setIsPlaying,
        playbackSpeed,
        setPlaybackSpeed,
        ranchStatus,
        setRanchStatus,
        cameras: CAMERAS,
        selectedCamera,
        setSelectedCamera,
        isWebcamActive,
        setIsWebcamActive,
        isMuted,
        setIsMuted,
        ollamaStatus,
        cattle,
        schedules,
        addScheduleRule,
        removeScheduleRule,
        clearSchedules,
        resetDefaultSchedules,
        breachEvent,
        executeCurfewAudit,
        resolveBreach,
        sarReport,
        isSynthesizingSAR,
        dispatcherChat,
        setDispatcherChat,
        isDrawerOpen,
        setIsDrawerOpen,
        isDispatcherOpen,
        setIsDispatcherOpen,
        setTimePreset,
      }}
    >
      {children}
    </RanchContext.Provider>
  );
};

export const useRanch = () => {
  const context = useContext(RanchContext);
  if (!context) {
    throw new Error('useRanch must be used within a RanchProvider');
  }
  return context;
};
