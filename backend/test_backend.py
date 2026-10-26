"""
Comprehensive unit and integration test suite for PastureSentry AI Backend.
"""
import pytest
from httpx import ASGITransport, AsyncClient

from backend.main import app
from backend.state import state_manager
from backend.ollama_client import OllamaGateway


@pytest.fixture(autouse=True)
def reset_state():
    """Reset state before each test."""
    state_manager.evaluate_state("08:00")


@pytest.mark.asyncio
async def test_health_check():
    """Verify health check endpoint returns online status."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "online"
        assert "active_model" in data


@pytest.mark.asyncio
async def test_ranch_status_initial():
    """Verify initial 08:00 morning status."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/ranch/status")
        assert response.status_code == 200
        data = response.json()
        assert data["total_herd_size"] == 50
        assert data["headcount_detected"] == 50
        assert data["missing_count"] == 0
        assert data["simulated_time"] == "08:00"
        assert len(data["cameras"]) == 4


@pytest.mark.asyncio
async def test_ranch_simulate_midday():
    """Verify midday hydration cluster at Water Trough."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/ranch/simulate-time", json={"time": "12:30"})
        assert res.status_code == 200
        data = res.json()
        assert data["simulated_time"] == "12:30"
        assert data["missing_count"] == 0
        cams = {c["id"]: c for c in data["cameras"]}
        assert cams["CAM-01"]["count"] == 28


@pytest.mark.asyncio
async def test_ranch_simulate_curfew_breach():
    """Verify time scrubbing to 19:00 triggers breach detection and 4 missing cattle."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        sim_res = await client.post("/api/ranch/simulate-time", json={"time": "19:00"})
        assert sim_res.status_code == 200
        sim_data = sim_res.json()

        assert sim_data["simulated_time"] == "19:00"
        assert sim_data["total_herd_size"] == 50
        assert sim_data["headcount_detected"] == 46
        assert sim_data["missing_count"] == 4
        assert sim_data["alert_status"] == "CRITICAL_BREACH"
        assert "4 cattle missing" in sim_data["active_alert_message"]

        # Check cameras
        cams = {c["id"]: c for c in sim_data["cameras"]}
        assert cams["CAM-01"]["status"] == "SECURE"
        assert cams["CAM-02"]["count"] == 46
        assert cams["CAM-02"]["status"] == "AUDITING"
        assert cams["CAM-03"]["status"] == "SECURE"
        assert cams["CAM-04"]["status"] == "BREACH_DETECTED"


@pytest.mark.asyncio
async def test_cattle_registry():
    """Verify the 50 cattle telemetry registry."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Scrub to curfew to check breach status
        await client.post("/api/ranch/simulate-time", json={"time": "19:00"})
        res = await client.get("/api/cattle")
        assert res.status_code == 200
        cattle = res.json()
        assert len(cattle) == 50
        c_map = {c["cow_id"]: c for c in cattle}
        assert c_map["COW-12"]["status"] == "BREACH"
        assert c_map["COW-19"]["status"] == "BREACH"
        assert c_map["COW-04"]["status"] == "MISSING"
        assert c_map["COW-31"]["status"] == "MISSING"
        assert c_map["COW-01"]["status"] == "OK"


@pytest.mark.asyncio
async def test_invalid_time_simulation():
    """Verify input validation rejects invalid time strings."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/ranch/simulate-time", json={"time": "25:99"})
        assert res.status_code == 422


@pytest.mark.asyncio
async def test_schedule_list_and_creation():
    """Verify listing active schedules and creating one from NL."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Initial list
        list_res = await client.get("/api/schedule/list")
        assert list_res.status_code == 200
        schedules = list_res.json()
        assert len(schedules) >= 2

        # Create from NL
        nl_prompt = "All cattle must be inside the shelter by 7 PM every day"
        create_res = await client.post("/api/schedule/create-from-nl", json={"prompt": nl_prompt})
        assert create_res.status_code == 200
        created = create_res.json()
        assert created["target_time"] == "19:00"
        assert created["expected_headcount"] == 50
        assert "Shelter" in created["target_zone"]

        # Verify it appears in list
        updated_list_res = await client.get("/api/schedule/list")
        updated_schedules = updated_list_res.json()
        assert any(s["task_name"] == created["task_name"] for s in updated_schedules)


@pytest.mark.asyncio
async def test_dispatch_generate():
    """Verify emergency SAR dispatch synthesis returns required schema."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Ensure time is 19:00
        await client.post("/api/ranch/simulate-time", json={"time": "19:00"})

        dispatch_res = await client.post("/api/dispatch/generate", json={})
        assert dispatch_res.status_code == 200
        dispatch = dispatch_res.json()

        assert "incident_id" in dispatch
        assert dispatch["curfew_time"] == "19:00"
        assert dispatch["missing_count"] == 4
        assert dispatch["severity"] == "CRITICAL"
        assert "Sector E-4" in dispatch["primary_search_sector"]
        assert "drone" in dispatch["recommended_action"].lower()
        assert "tactical_briefing" in dispatch


@pytest.mark.asyncio
async def test_chat_endpoint_queries():
    """Verify conversational rancher QA endpoint answers cattle and status questions."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/api/ranch/simulate-time", json={"time": "19:00"})

        # Query Cow 12
        res1 = await client.post("/api/chat", json={"message": "Where was Cow 12 last seen?"})
        assert res1.status_code == 200
        assert "12" in res1.json()["response"]
        assert "CAM-04" in res1.json()["response"] or "East" in res1.json()["response"]

        # Query Missing Status
        res2 = await client.post("/api/chat", json={"message": "What is the curfew status and missing cattle?"})
        assert res2.status_code == 200
        assert "4" in res2.json()["response"] or "missing" in res2.json()["response"].lower()
