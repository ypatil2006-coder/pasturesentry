"""
PastureSentry AI - Edge Telemetry Gateway, Ollama Orchestrator & Ranch State Engine.
Built with FastAPI, strict Pydantic schemas, permissive local CORS, and offline resilience.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:
    from backend.schemas import (
        RanchStatusResponse,
        SimulateTimeRequest,
        ScheduleItem,
        CreateScheduleNLRequest,
        DispatchRequest,
        DispatchResponse,
        ChatRequest,
        ChatResponse,
        CattleEntity,
    )
    from backend.state import state_manager
    from backend.ollama_client import ollama_gateway
except ImportError:
    from schemas import (
        RanchStatusResponse,
        SimulateTimeRequest,
        ScheduleItem,
        CreateScheduleNLRequest,
        DispatchRequest,
        DispatchResponse,
        ChatRequest,
        ChatResponse,
        CattleEntity,
    )
    from state import state_manager
    from ollama_client import ollama_gateway

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("pasturesentry.api")

app = FastAPI(
    title="PastureSentry AI Gateway",
    description="Offline Edge AI livestock telemetry, automated curfew sentinel, and search & rescue orchestrator.",
    version="1.0.0",
)

# Permissive local CORS for frontend (Vite at localhost:5173 and all origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
@app.get("/health", tags=["Health"])
async def health_check() -> Dict[str, Any]:
    """Health check and model connectivity status."""
    available_model = await ollama_gateway.get_available_model()
    return {
        "status": "online",
        "service": "PastureSentry AI Edge Gateway",
        "simulated_time": state_manager.simulated_time,
        "ollama_connected": available_model is not None,
        "active_model": available_model or "deterministic-edge-fallback",
    }


# ==========================================
# 1. Ranch Telemetry & Status
# ==========================================
@app.get("/api/ranch/status", response_model=RanchStatusResponse, tags=["Ranch Telemetry"])
async def get_ranch_status() -> RanchStatusResponse:
    """Returns current overall ranch metrics, headcount, and camera statuses."""
    try:
        return state_manager.get_status()
    except Exception as e:
        logger.error(f"Error computing ranch status: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve ranch telemetry")


# ==========================================
# 2. Time Scrubbing & Simulation Engine
# ==========================================
@app.post("/api/ranch/simulate-time", response_model=RanchStatusResponse, tags=["Simulation"])
async def simulate_time(payload: SimulateTimeRequest) -> RanchStatusResponse:
    """Updates simulated time, updates cattle locations, evaluates breach condition."""
    try:
        state_manager.evaluate_state(payload.time)
        return state_manager.get_status()
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as e:
        logger.error(f"Error during time simulation: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Simulation evaluation error")


# ==========================================
# 3. Cattle Entity Registry
# ==========================================
@app.get("/api/cattle", response_model=List[CattleEntity], tags=["Livestock Telemetry"])
async def list_cattle() -> List[CattleEntity]:
    """Returns full registry of 50 cattle with their current zone, camera, and status."""
    return list(state_manager.cattle_registry.values())


# ==========================================
# 4. Active Schedules Management
# ==========================================
@app.get("/api/schedule/list", response_model=List[ScheduleItem], tags=["Schedules"])
async def list_schedules() -> List[ScheduleItem]:
    """Returns list of active operational rules (default pre-loaded + user-created)."""
    return state_manager.list_schedules()


@app.post("/api/schedule/create-from-nl", response_model=ScheduleItem, tags=["Schedules"])
async def create_schedule_from_nl(payload: CreateScheduleNLRequest) -> ScheduleItem:
    """Converts natural language ranch instructions into structured operational schedule using Ollama."""
    try:
        schedule = await ollama_gateway.create_schedule_from_nl(payload.prompt)
        state_manager.add_schedule(schedule)
        return schedule
    except Exception as e:
        logger.error(f"Error creating schedule from NL: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to synthesize schedule rule")


# ==========================================
# 5. Anomaly Search & Rescue Dispatcher
# ==========================================
@app.post("/api/dispatch/generate", response_model=DispatchResponse, tags=["Search & Rescue"])
async def generate_dispatch(payload: Optional[DispatchRequest] = None) -> DispatchResponse:
    """Synthesizes emergency search-and-rescue tactical dispatch vectors using Ollama and cattle transit history."""
    try:
        status_data = state_manager.get_status()
        missing_count = status_data.missing_count or 4
        curfew_time = (payload.override_time if payload and payload.override_time else status_data.simulated_time)

        # Build transit history for missing cattle
        missing_list = state_manager.get_missing_cattle()
        if missing_list:
            history_lines = [
                f"{c.cow_id}: last seen at {c.current_zone} (Camera: {c.last_camera_id}) at {c.last_seen_timestamp} - Status: {c.status}"
                for c in missing_list
            ]
            transit_history = "\n".join(history_lines)
        else:
            transit_history = (
                "COW-12, COW-19 last seen at East Fence (CAM-04) at 18:35 heading Southeast.\n"
                "COW-04, COW-31 last seen at Water Trough (CAM-01) at 17:15 heading North Creek."
            )

        dispatch = await ollama_gateway.generate_sar_dispatch(
            missing_count=missing_count,
            curfew_time=curfew_time,
            transit_history=transit_history,
        )
        if payload and payload.incident_id:
            dispatch.incident_id = payload.incident_id

        return dispatch
    except Exception as e:
        logger.error(f"Error generating SAR dispatch: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Dispatch vector synthesis failed")


# ==========================================
# 6. Conversational Rancher QA
# ==========================================
@app.post("/api/chat", response_model=ChatResponse, tags=["Rancher Assistant"])
async def chat_with_assistant(payload: ChatRequest) -> ChatResponse:
    """Answers rancher operational queries grounded in live ranch telemetry."""
    try:
        status_data = state_manager.get_status()
        ranch_context = {
            "simulated_time": status_data.simulated_time,
            "total_herd_size": status_data.total_herd_size,
            "headcount_detected": status_data.headcount_detected,
            "missing_count": status_data.missing_count,
            "alert_status": status_data.alert_status,
            "active_alert_message": status_data.active_alert_message,
            "cameras": [c.model_dump() for c in status_data.cameras],
        }

        active_model = await ollama_gateway.get_available_model() or "offline-sentinel"
        answer = await ollama_gateway.answer_rancher_query(payload.message, ranch_context)

        return ChatResponse(
            response=answer,
            model=active_model,
            timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        )
    except Exception as e:
        logger.error(f"Error handling rancher chat: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Chat processing failed")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
