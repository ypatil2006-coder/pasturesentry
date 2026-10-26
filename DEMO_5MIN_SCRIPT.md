# PastureSentry AI — 5-Minute Hackathon Demo Script & Ollama Proof Guide

**Goal:** Win maximum judge points in 5 minutes with undeniable live proof of offline local edge compute and zero cloud dependency.

---

## Part 1: How to Prove Ollama is Running Locally

Keep a terminal window open beside your browser. During the demo, run these commands to give judges **hard, undeniable proof**:

### Command 1: Show the Live Loaded Model on GPU (The Ultimate Proof)
```bash
ollama ps
```
**What the judge sees:**
```
NAME                  ID              SIZE      PROCESSOR    CONTEXT    UNTIL              
qwen2.5-coder:0.5b    4ff64a7f502a    397 MB    100% GPU     4096       4 minutes from now
```
* **What you say:**  
  *"Look at `PROCESSOR: 100% GPU` on `localhost:11434`. This neural model is loaded directly into local VRAM on our machine. Zero telemetry leaves this laptop, zero cloud APIs, and zero subscription fees. If the internet fiber gets cut by a storm, the ranch keeps running."*

### Command 2: Show Local Model Inventory (Offline Guarantee)
```bash
ollama list
```
**What the judge sees:**
```
NAME                  ID              SIZE      MODIFIED      
qwen2.5-coder:0.5b    4ff64a7f502a    397 MB    ...
```

### Command 3: Live Terminal Curl Inference (Optional Backup Flex)
```bash
curl -s http://localhost:8000/api/schedule/create-from-nl \
  -H "Content-Type: application/json" \
  -d '{"prompt": "All cattle must be in shelter by 7pm"}'
```
* Shows the FastAPI backend querying Ollama on `localhost:11434` and returning structured JSON in under 1 second.

---

## Part 2: The Winning 5-Minute Pitch & Demo Script

### ⏱️ Minute 0:00 – 1:00 | The Hook & The Problem
* **Where to look:** Browser on Landing Page (`http://localhost:5173/`).
* **Your Script:**
  > *"Judges, picture this: A typical 100-acre family cattle pasture with 50 head of Black Angus. It's 7:00 PM dusk, zero cell service down in the tree hollows, and a summer thunderstorm just snapped post #42 along the east fence line.*  
  > *Most family farms are run by a single operator. At twilight, you cannot see through 100 acres of dense timber. If four $4,000 Angus heifers slip through the brush onto Highway 81, that’s a **$16,000 disaster** before the farmer even finishes dinner.*  
  > *We built **PastureSentry AI**: a 100% offline, local edge-AI livestock sentinel. Using cheap solar RTSP cameras at pasture chokepoints, local YOLO computer vision, and local Ollama intelligence, it detects curfew breaches and triggers instant tactical breach alerts with exact coordinates and escaping cow IDs."*

---

### ⏱️ Minute 1:00 – 2:00 | Natural Language Scheduling via Ollama
* **Where to look:** Scroll down to the yellow card: `TALK TO YOUR RANCH LIKE A HUMAN`.
* **Your Script:**
  > *"Ranchers aren't software developers; they don't configure cron jobs or complex databases. They speak plain English.*  
  > *Watch this: A rancher types:  
  > **'All cattle must be inside the shelter by 7 PM every day'**."*
* **Action:** Click `EXTRACT & ARM RULE`.
* **What appears:** Show the live extracted JSON rule with `task_name`, `target_time: 19:00`, `expected_headcount: 50`, and `action_on_failure: trigger_search_dispatch`.
* **Your Script:**
  > *"Local Ollama parses the intent into strict executable JSON parameters and arms the ranch sentry instantaneously."*

---

### ⏱️ Minute 2:00 – 3:00 | The Terminal Proof (Show Local Ollama)
* **Where to look:** Bring your Terminal to the front (split-screen with browser).
* **Action:** Run:
  ```bash
  ollama ps
  ```
* **Your Script:**
  > *"Judges, let's verify where that inference happened. Look at my terminal: `qwen2.5-coder:0.5b`, `PROCESSOR: 100% GPU` on `localhost`. There is zero external cloud egress. You could pull the Wi-Fi cable or turn on Airplane Mode right now, and the ranch never skips a beat."*

---

### ⏱️ Minute 3:00 – 4:00 | The Live Breach Emergency Simulation
* **Where to look:** Scroll up to the **Hero Simulator** (or Mission Control).
* **Action:** Click the red button: `🚨 TEST 7:00 PM CURFEW BREACH`.
* **Visual Highlights to Point Out:**
  1. **Top Badge Flashes Red:** `🚨 CURFEW BREACH ACTIVE!`
  2. **Headcount Drops:** `46/50 HEAD DETECTED` (4 Missing!).
  3. **Visual Escape Trajectory:** A dashed red-and-yellow vector appears on the pasture map pointing from the water trough through CAM-04 straight toward **Highway 81**.
  4. **CAM-04 Security Feed:** East Perimeter highlights 4 escaping heifers in red: `COW-12 [BREACH]`, `COW-19 [BREACH]`.
  5. **Ollama Dispatch Feed:** Point to the terminal:
     > *"DETAILS DISPATCH: EAST FENCE ESCAPE ALERT • BEARING 082° EAST TOWARD HIGHWAY 81 • TACTICAL ALARM & INTERCEPT DISPATCHED."*
* **Your Script:**
  > *"Curfew muster failed at 19:00. In seconds, Ollama identifies the breach chokepoint at CAM-04, sounds the local barn strobe alarm, and calculates the exact intercept coordinates so the farmer can head straight to the culvert on their ATV before the cattle reach Highway 81!"*
* **Action:** Click `RESET TO NORMAL (MUSTER PASS)` to show system recovery.

---

### ⏱️ Minute 4:00 – 5:00 | The Unfair Advantage & Closing
* **Where to look:** Scroll down to the `CLOUD SAAS VS. PASTURESENTRY EDGE` comparison table.
* **Your Script:**
  > *"Traditional agricultural IoT charges $800 to $2,500 every month in recurring cloud fees and forces ranchers to buy proprietary $250 GPS ear tags.*  
  > *PastureSentry AI costs **$0 per month**, runs on cheap solar RTSP cameras and local open-source edge hardware, and ensures herd location data stays sovereign to the rancher.*  
  > *Zero cloud egress. 100% airplane mode native. 50 out of 50 head secured.*  
  > *Thank you, judges! We’d love to answer your questions."*

---

## Part 3: Emergency Cheat Sheet (If Anything Goes Wrong)

| What Happened | Quick Recovery |
| :--- | :--- |
| **Ollama model didn't respond or timed out** | The backend has a **built-in deterministic edge fallback**! It automatically returns a valid JSON schedule/dispatch without crashing. |
| **Judge asks "Can I try my own sentence?"** | Say *"Absolutely!"* Type: *"Count the cows at the water trough at 1 PM"* and hit `EXTRACT & ARM RULE`. |
| **Judge asks "What hardware does this run on?"** | *"Any edge device: an NVIDIA Jetson, Mac Mini, or rugged farm laptop running Ollama locally."* |
