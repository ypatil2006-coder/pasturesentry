# 🛠️ PastureSentry AI — Backend Specification

## 1. REQUIRED SKILLS (Skills Hub)
Please equip and follow the workflows of these skills during this build:
- `ponytail` — prioritize minimal, robust code that fully meets the spec without over-engineering.
- `coding-standards` — clean async FastAPI practices, type hints, and structured logging.
- `test-driven-development` — write smoke tests for endpoint responses and Ollama JSON extraction.
- `security-best-practices` — for Pydantic input validation and CORS configuration.
- `systematic-debugging` — for any Ollama port 11434 or model timeout issues.
- `verification-before-completion` — execute curl tests against `http://localhost:8000` to verify live endpoints before completion.

---

## 2. BACKEND OVERVIEW & MISSION
Build the local edge backend for **PastureSentry AI**—an offline livestock tracking, perimeter defense, and automated curfew sentinel for cattle ranches. Ranches have zero cloud connection, making an offline local architecture essential.

The backend performs two core roles:
1. **The Ranch State Machine:** Tracks 50 cattle across 4 pasture camera zones, handles real-time time-scrubbing, and detects missing cattle or perimeter breaches.
2. **The Ollama Gateway:** Interfaces with the local Ollama daemon (`http://localhost:11434`) using open-source models (`qwen2.5-coder` or `llama3.2`) to:
   - Convert natural language ranch instructions into structured operational schedules.
   - Synthesize emergency search-and-rescue vectors when cattle go missing at curfew.
   - Answer rancher situational queries via conversational dispatch.

---

## 3. TECH STACK & REQUIREMENTS
- **Language/Framework:** Python 3.10+ with **FastAPI** & **Uvicorn**.
- **Inference Client:** Direct HTTP connection to `http://localhost:11434/api/generate` or `/api/chat` (via `httpx`).
- **Data Persistence:** In-memory store with clean state dictionaries.
- **CORS:** Must allow all origins (`allow_origins=["*"]`) for the Vite frontend (`http://localhost:5173`).
- **Resilience / Fallback:** If local Ollama is warming up or unresponsive, return deterministic fallback payloads so the frontend demo never breaks during a live presentation.

---

## 4. CORE STATE ENGINE SPECIFICATION

### A. The 4 Camera Sectors
- `CAM-01`: **Central Water Trough** (Coordinates: Sector W-1, Normal Capacity: 15–30 cattle).
- `CAM-02`: **Main Shelter Barn** (Coordinates: Sector S-2, Curfew Location, Capacity: 50 cattle).
- `CAM-03`: **North Pasture Gate** (Coordinates: Sector N-3, Transit corridor).
- `CAM-04`: **East Boundary Fence** (Coordinates: Sector E-4, Perimeter breach risk zone).

### B. Cattle Entity Registry
- Total Herd: 50 Cattle (`COW-01` through `COW-50`).
- Each entity tracks: `cow_id`, `current_zone`, `last_camera_id`, `last_seen_timestamp`, `status` (`OK`, `TRANSIT`, `MISSING`, `BREACH`).

### C. Time-of-Day Simulation State
- Simulated clock starting at `08:00 AM` that can be scrubbed to any time (`00:00` to `23:59`).
- State logic by time:
  - `08:00–12:00`: Cattle dispersed across grazing pastures and North Gate (`CAM-03`).
  - `12:00–14:00`: Peak cluster at Water Trough (`CAM-01`).
  - `18:30–18:50`: Cattle migrate toward Shelter Barn (`CAM-02`); simulated breach occurs: `COW-12` and `COW-19` wander past East Fence (`CAM-04`), while `COW-04` and `COW-31` stall near Creek.
  - `19:00 (7:00 PM)`: Curfew muster. Expected: 50, Present in Shelter: 46, Missing: 4.

---

## 5. API ENDPOINTS & SCHEMAS

### 1. Ranch Telemetry & Status
- **`GET /api/ranch/status`**
  - Returns overall ranch metrics:
    ```json
    {
      "simulated_time": "19:00",
      "total_herd_size": 50,
      "headcount_detected": 46,
      "missing_count": 4,
      "alert_status": "CRITICAL_BREACH",
      "active_alert_message": "4 cattle missing during 19:00 Shelter Curfew muster.",
      "cameras": [
        {"id": "CAM-01", "name": "Central Water Trough", "count": 0, "status": "SECURE"},
        {"id": "CAM-02", "name": "Main Shelter Barn", "count": 46, "status": "AUDITING"},
        {"id": "CAM-03", "name": "North Pasture Gate", "count": 0, "status": "SECURE"},
        {"id": "CAM-04", "name": "East Perimeter Fence", "count": 0, "status": "BREACH_DETECTED"}
      ]
    }
    ```

### 2. Time Scrubbing & Simulation Engine
- **`POST /api/ranch/simulate-time`**
  - **Body:** `{"time": "19:00"}`
  - Updates simulated time, evaluates active schedules, updates cattle locations, and triggers breach evaluation.

### 3. Natural Language AI Schedule Creator (Ollama)
- **`POST /api/schedule/create-from-nl`**
  - **Body:** `{"prompt": "All cattle must be inside the shelter by 7 PM every day"}`
  - **Ollama Prompt Logic:** Instructs model to output strict JSON:
    ```json
    {
      "task_name": "Evening Shelter Curfew",
      "target_time": "19:00",
      "frequency": "daily",
      "target_zone": "Shelter Barn (CAM-02)",
      "expected_headcount": 50,
      "action_on_failure": "dispatch_search_alert"
    }
    ```
  - Appends the rule to the active schedules list and returns the created schedule.

### 4. Active Schedules Management
- **`GET /api/schedule/list`**
  - Returns list of active operational rules (default pre-loaded + user-created).

### 5. Anomaly Search & Rescue Dispatcher (Ollama)
- **`POST /api/dispatch/generate`**
  - **Body:** (Optional parameters or auto-triggered on breach)
  - Queries Ollama with the missing cattle transit history:
    - `COW-12`, `COW-19` last seen at East Fence (`CAM-04`) at 18:35 heading Southeast.
    - `COW-04`, `COW-31` last seen at Water Trough (`CAM-01`) at 17:15 heading North Creek.
  - **Ollama System Prompt:** Act as an elite Rural Search & Rescue Livestock Dispatcher.
  - **Response Schema:**
    ```json
    {
      "incident_id": "INC-7091",
      "curfew_time": "19:00",
      "missing_count": 4,
      "severity": "CRITICAL",
      "primary_search_sector": "Sector E-4 (East Fence Breach)",
      "secondary_search_sector": "Sector N-1 (North Creek Brush)",
      "recommended_action": "Deploy autonomous drone to coordinates (34.821, -101.442) on bearing 120°. Dispatch ATV team to North Creek culvert.",
      "tactical_briefing": "Ollama generated tactical dispatch report text...",
      "timestamp": "2026-10-26T19:00:05Z"
    }
    ```

### 6. Conversational Rancher QA
- **`POST /api/chat`**
  - **Body:** `{"message": "Where was Cow 12 last seen?"}`
  - Uses Ollama with current ranch context to answer rancher operational questions in conversational text.

---

## 6. OLLAMA INTEGRATION DETAILS
- **Host:** `http://localhost:11434`
- **Model:** `qwen2.5-coder` (fallback to `llama3.2` or any available model returned by `GET http://localhost:11434/api/tags`).
- **Payload Format:**
  ```python
  payload = {
      "model": "qwen2.5-coder",
      "prompt": formatted_prompt,
      "stream": False,
      "format": "json"  # when structured schema is needed
  }
  ```

---

## 7. VERIFICATION & DELIVERABLE CHECKLIST
1. Target directory: `/home/yash/Projects/MLH Hackathons/backend/`
2. Recommended files:
   - `backend/main.py`
   - `backend/schemas.py`
   - `backend/ollama_client.py`
   - `backend/state.py`
   - `backend/requirements.txt` (`fastapi`, `uvicorn`, `httpx`, `pydantic`)
3. Startup: `uvicorn backend.main:app --reload --port 8000`
4. Verification:
   - `curl http://localhost:8000/api/ranch/status`
   - `curl -X POST http://localhost:8000/api/schedule/create-from-nl -H "Content-Type: application/json" -d '{"prompt": "All cattle must be in shelter by 7pm"}'`
   - `curl -X POST http://localhost:8000/api/ranch/simulate-time -H "Content-Type: application/json" -d '{"time": "19:00"}'`
