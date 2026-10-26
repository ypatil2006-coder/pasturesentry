"""
Pydantic Schemas for PastureSentry AI.
Enforces strict type validation, clean defaults, and OpenAPI documentation.
"""
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
import re


class CameraStatus(BaseModel):
    """Telemetry status of an individual edge pasture camera."""
    id: str = Field(..., description="Camera identifier, e.g. CAM-01")
    name: str = Field(..., description="Descriptive camera zone name")
    count: int = Field(default=0, ge=0, description="Detected cattle headcount in sector")
    status: str = Field(default="SECURE", description="Operational status: SECURE, AUDITING, BREACH_DETECTED")


class CattleEntity(BaseModel):
    """Livestock telemetry entity."""
    cow_id: str = Field(..., description="Identifier e.g. COW-01")
    current_zone: str = Field(..., description="Current pasture sector or facility")
    last_camera_id: str = Field(..., description="Last verifying camera node")
    last_seen_timestamp: str = Field(..., description="Timestamp or time of last detection")
    status: str = Field(default="OK", description="Status: OK, TRANSIT, MISSING, BREACH")


class RanchStatusResponse(BaseModel):
    """Ranch global telemetry and curfew alert status."""
    simulated_time: str = Field(..., description="Current simulated 24h clock, e.g. 19:00")
    total_herd_size: int = Field(default=50, ge=0, description="Total registered cattle")
    headcount_detected: int = Field(default=50, ge=0, description="Total cattle confirmed in zones")
    missing_count: int = Field(default=0, ge=0, description="Cattle unaccounted for")
    alert_status: str = Field(default="NOMINAL", description="Overall alert status")
    active_alert_message: str = Field(default="All perimeter sectors secure.", description="Human-readable alert message")
    cameras: List[CameraStatus] = Field(default_factory=list, description="4 pasture camera telemetry records")


class SimulateTimeRequest(BaseModel):
    """Request payload to scrub simulated ranch clock."""
    time: str = Field(..., description="Target time in HH:MM 24h format, e.g. '19:00' or '08:00'")

    @field_validator("time")
    @classmethod
    def validate_time_format(cls, v: str) -> str:
        cleaned = v.strip()
        # Accept HH:MM
        if not re.match(r"^(?:[01]\d|2[0-3]):[0-5]\d$", cleaned):
            # Also attempt to parse single-digit hour like "8:00" -> "08:00"
            m = re.match(r"^(\d):([0-5]\d)$", cleaned)
            if m:
                cleaned = f"0{m.group(1)}:{m.group(2)}"
            else:
                raise ValueError("Time must be in 24-hour HH:MM format (00:00 to 23:59)")
        return cleaned


class ScheduleItem(BaseModel):
    """Operational ranch schedule rule."""
    task_name: str = Field(..., description="Label for scheduled task")
    target_time: str = Field(..., description="24h time HH:MM")
    frequency: str = Field(default="daily", description="Schedule frequency (e.g. daily)")
    target_zone: str = Field(..., description="Destination sector / camera")
    expected_headcount: int = Field(default=50, ge=0, description="Expected headcount at target")
    action_on_failure: str = Field(default="dispatch_search_alert", description="System action if threshold not met")


class CreateScheduleNLRequest(BaseModel):
    """Natural language prompt to be parsed by Ollama into a ScheduleItem."""
    prompt: str = Field(..., min_length=3, description="Rancher natural language instruction")


class DispatchRequest(BaseModel):
    """Parameters for emergency SAR vector synthesis."""
    incident_id: Optional[str] = Field(None, description="Optional incident code override")
    override_time: Optional[str] = Field(None, description="Optional curfew time override")


class DispatchResponse(BaseModel):
    """Search and rescue tactical dispatch vector generated for missing cattle."""
    incident_id: str = Field(..., description="Incident tracking code e.g. INC-7091")
    curfew_time: str = Field(..., description="Curfew target time")
    missing_count: int = Field(..., description="Number of missing cattle")
    severity: str = Field(..., description="Severity level: CRITICAL, ELEVATED, LOW")
    primary_search_sector: str = Field(..., description="Primary search coordinates / sector")
    secondary_search_sector: str = Field(..., description="Secondary search sector")
    recommended_action: str = Field(..., description="Drone and ATV dispatch recommendations")
    tactical_briefing: str = Field(..., description="Detailed SAR tactical dispatch report")
    timestamp: str = Field(..., description="ISO 8601 timestamp")


class ChatRequest(BaseModel):
    """Rancher conversational query."""
    message: str = Field(..., min_length=1, description="Question or command for ranch assistant")


class ChatResponse(BaseModel):
    """Conversational assistant response."""
    response: str = Field(..., description="Ground response from LLM / state machine")
    model: Optional[str] = Field(None, description="Inference model used")
    timestamp: Optional[str] = Field(None, description="Timestamp of reply")
