# 🌾 PastureSentry AI
> **100% Offline Edge Livestock Telemetry & Autonomous Curfew Sentinel**  
> *Built for rural ranches operating in cellular dead zones with zero cloud dependencies.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stack: React + Vite](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?logo=react)](https://vitejs.dev/)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Local LLM: Ollama](https://img.shields.io/badge/Edge_LLM-Ollama_(Qwen_2.5)-white?logo=ollama)](https://ollama.ai/)
[![Vision: Local YOLO](https://img.shields.io/badge/Edge_Vision-YOLO_Re--ID-00FFFF)](https://github.com/)

---

## 🤠 The Problem
In rural cattle ranching (100+ acres, 50–200 head of cattle), cellular and broadband connectivity are nonexistent in rugged canyons and back pastures. 
- Ranchers lose thousands of dollars each year when livestock linger near compromised perimeter fences, fall into creek ditches, or miss evening curfew.
- Existing "smart ag" systems rely on cloud APIs (AWS/GCP/Azure) that completely fail the second the satellite or LTE link drops.
- Cellular GPS ear tags require costly monthly SIM subscriptions ($15–$30/head/month) and frequent battery replacement.

---

## ⚡ The PastureSentry Solution
**PastureSentry AI** runs entirely on local edge hardware placed directly in the ranch house or barn:
1. **Solar RTSP Chokepoint Cameras**: Passive solar cameras cover key pasture chokepoints (`Water Trough CAM-01`, `Shelter Barn CAM-02`, `North Pasture CAM-03`, `East Fence CAM-04`).
2. **Local Vision Re-ID**: Automated visual headcount and identification run offline.
3. **Local Ollama NLP Engine (`qwen2.5-coder:3b`)**: Ranchers speak or type plain natural language rules (*"All cattle must be inside the shelter by 7 PM"*). The local LLM compiles rules into rigid cron-based telemetry sentinels.
4. **Autonomous Emergency Search & Rescue (SAR)**: When an evening curfew breach occurs, the local edge LLM analyzes recent transit logs and immediately synthesizes prioritized search vectors, GPS coordinates, and tactical dispatch instructions for the ranch crew (ATV ground intercept & horn strobe alert).
5. **Live Telemetry Sniffer (`ranch_terminal.py`)**: Real-time terminal watcher proving 100% offline edge execution, streaming GPU token generation live during operations.

---

## 🏗️ Architecture & Stack

```
   ┌────────────────────────────────────────────────────────┐
   │             Solar RTSP Chokepoint Cameras              │
   │  [CAM-01 Water]  [CAM-02 Barn]  [CAM-03 Gate]  [CAM-04 East]
   └───────────────────────────┬────────────────────────────┘
                               │ Local RTSP Stream
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │          PastureSentry Local Edge Gateway              │
   │                                                        │
   │  • FastAPI Telemetry Engine (Port 8000)                │
   │  • Local YOLO Headcount & Entity Tracker               │
   │  • Ollama Edge LLM Daemon (qwen2.5-coder:3b)           │
   │  • Live Neural Terminal Sniffer (ranch_terminal.py)    │
   └───────────────────────────┬────────────────────────────┘
                               │ Local Subnet / Offline HTTP
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │          PastureSentry Ranch Cockpit (UI)              │
   │  • Comic-Tech High-Contrast HUD (React + Tailwind)     │
   │  • 2.5D Isometric Ranch Map & Chokepoint Overlays      │
   │  • Time-Scrubber Simulation Engine (Day/Dusk/Night)    │
   │  • Natural Language Rule Compiler                      │
   │  • Emergency Tactical Dispatcher                       │
   └────────────────────────────────────────────────────────┘
```

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Howler audio manager.
- **Backend Gateway**: FastAPI, Pydantic v2, Uvicorn, Python 3.11+.
- **Edge LLM**: Local Ollama runtime with `qwen2.5-coder:3b` executing on local GPU/VRAM.
- **Offline Proof**: Zero external HTTP requests; 100% operational in Airplane Mode.

---

## 🚀 Quickstart Guide

### 1. Clone & Set Up
```bash
git clone https://github.com/ypatil2006-coder/pasturesentry.git
cd pasturesentry
```

### 2. Start Local Ollama
Make sure Ollama is installed and pull the edge model:
```bash
ollama pull qwen2.5-coder:3b
```

### 3. Launch the Backend Gateway
```bash
# In project root
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Launch the Web Cockpit
```bash
cd pasturesentry
npm install
npm run dev
# Cockpit active at http://localhost:5173
```

### 5. Launch the Live Edge Terminal Inspector (Optional for Demos)
Run the passive terminal watcher side-by-side with your browser:
```bash
python3 ranch_terminal.py
```
*Any preset clicked or prompt typed in the UI will automatically stream tokens through the terminal live!*

---

## 🎯 5-Minute Hackathon Demo Flow
1. **The Context**: Introduce the 100-acre ranch, 50 head of Black Angus cattle, and the reality of cellular dead zones.
2. **The Cockpit**: Walk through the 2.5D isometric pasture map and 4 solar chokepoint cameras.
3. **Natural Language Rule Scheduling**: Open the Scheduler Drawer and click *"All cattle must be inside shelter by 7 PM"*. Point to the adjacent terminal window to prove the local Ollama model is generating the structured rule in real time.
4. **Time Scrubbing to Curfew (19:00)**: Scrub the timeline past 7 PM. Watch the headcount drop from 50 to 46 in the barn, triggering a **CODE RED CURFEW BREACH**.
5. **Autonomous Tactical SAR Dispatch**: Click "Synthesize Tactical Dispatch". The local LLM parses transit history and instantly calculates prioritized search vectors (East Perimeter Highway fence vs. North Creek brush) and dispatches the ATV ground crew.

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.
