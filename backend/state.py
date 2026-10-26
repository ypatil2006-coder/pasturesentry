"""
Ranch State Machine and Simulation Engine for PastureSentry AI.
Tracks 50 cattle across 4 edge camera zones with dynamic time-scrubbing.
"""
from typing import Dict, List, Optional
from datetime import datetime, timezone
try:
    from backend.schemas import (
        CameraStatus,
        CattleEntity,
        RanchStatusResponse,
        ScheduleItem,
    )
except ImportError:
    from schemas import (
        CameraStatus,
        CattleEntity,
        RanchStatusResponse,
        ScheduleItem,
    )


class RanchStateManager:
    """Manages ranch state, cattle locations, cameras, and schedules."""

    CAMERA_DEFS = {
        "CAM-01": {"name": "Central Water Trough", "sector": "Sector W-1", "capacity": 30},
        "CAM-02": {"name": "Main Shelter Barn", "sector": "Sector S-2", "capacity": 50},
        "CAM-03": {"name": "North Pasture Gate", "sector": "Sector N-3", "capacity": 40},
        "CAM-04": {"name": "East Perimeter Fence", "sector": "Sector E-4", "capacity": 10},
    }

    def __init__(self) -> None:
        self.simulated_time: str = "08:00"
        self.schedules: List[ScheduleItem] = [
            ScheduleItem(
                task_name="Evening Shelter Curfew",
                target_time="19:00",
                frequency="daily",
                target_zone="Shelter Barn (CAM-02)",
                expected_headcount=50,
                action_on_failure="dispatch_search_alert",
            ),
            ScheduleItem(
                task_name="Midday Water Station Audit",
                target_time="12:30",
                frequency="daily",
                target_zone="Central Water Trough (CAM-01)",
                expected_headcount=25,
                action_on_failure="log_advisory",
            ),
        ]
        self.cattle_registry: Dict[str, CattleEntity] = {}
        self._init_herd()
        self.evaluate_state(self.simulated_time)

    def _init_herd(self) -> None:
        """Initialize 50 cattle registry (COW-01 to COW-50)."""
        self.cattle_registry.clear()
        for i in range(1, 51):
            cow_id = f"COW-{i:02d}"
            self.cattle_registry[cow_id] = CattleEntity(
                cow_id=cow_id,
                current_zone="North Pasture Gate",
                last_camera_id="CAM-03",
                last_seen_timestamp=f"{self.simulated_time}:00",
                status="OK",
            )

    @staticmethod
    def _time_to_minutes(time_str: str) -> int:
        """Convert HH:MM to total minutes from midnight."""
        parts = time_str.split(":")
        return int(parts[0]) * 60 + int(parts[1])

    def evaluate_state(self, target_time: str) -> None:
        """Recalculate herd positions, camera counts, and alert conditions for given time."""
        self.simulated_time = target_time
        mins = self._time_to_minutes(target_time)

        # Time block: 19:00 - 23:59 or 00:00 - 05:00 -> Curfew Muster (Breach active)
        if mins >= 19 * 60 or mins < 5 * 60:
            for i in range(1, 51):
                cid = f"COW-{i:02d}"
                if cid in ("COW-12", "COW-19"):
                    self.cattle_registry[cid] = CattleEntity(
                        cow_id=cid,
                        current_zone="East Boundary Fence Breach (Sector E-4)",
                        last_camera_id="CAM-04",
                        last_seen_timestamp="18:35",
                        status="BREACH",
                    )
                elif cid in ("COW-04", "COW-31"):
                    self.cattle_registry[cid] = CattleEntity(
                        cow_id=cid,
                        current_zone="North Creek Brush (Sector N-1)",
                        last_camera_id="CAM-01",
                        last_seen_timestamp="17:15",
                        status="MISSING",
                    )
                else:
                    self.cattle_registry[cid] = CattleEntity(
                        cow_id=cid,
                        current_zone="Main Shelter Barn",
                        last_camera_id="CAM-02",
                        last_seen_timestamp="18:55",
                        status="OK",
                    )

        # Time block: 18:30 - 18:59 -> Evening Migration & Active Breach Event
        elif mins >= 18 * 60 + 30:
            for i in range(1, 51):
                cid = f"COW-{i:02d}"
                if cid in ("COW-12", "COW-19"):
                    self.cattle_registry[cid] = CattleEntity(
                        cow_id=cid,
                        current_zone="East Perimeter Fence",
                        last_camera_id="CAM-04",
                        last_seen_timestamp="18:35",
                        status="BREACH",
                    )
                elif cid in ("COW-04", "COW-31"):
                    self.cattle_registry[cid] = CattleEntity(
                        cow_id=cid,
                        current_zone="North Creek Corridor",
                        last_camera_id="CAM-01",
                        last_seen_timestamp="17:15",
                        status="TRANSIT",
                    )
                else:
                    self.cattle_registry[cid] = CattleEntity(
                        cow_id=cid,
                        current_zone="Main Shelter Barn",
                        last_camera_id="CAM-02",
                        last_seen_timestamp=target_time,
                        status="OK",
                    )

        # Time block: 12:00 - 14:00 -> Midday Water Cluster
        elif 12 * 60 <= mins < 14 * 60:
            for i in range(1, 51):
                cid = f"COW-{i:02d}"
                if i <= 28:
                    zone, cam = "Central Water Trough", "CAM-01"
                elif i <= 38:
                    zone, cam = "Main Shelter Barn", "CAM-02"
                else:
                    zone, cam = "North Pasture Gate", "CAM-03"
                self.cattle_registry[cid] = CattleEntity(
                    cow_id=cid,
                    current_zone=zone,
                    last_camera_id=cam,
                    last_seen_timestamp=target_time,
                    status="OK",
                )

        # Time block: 14:00 - 18:30 -> Afternoon Grazing
        elif 14 * 60 <= mins < 18 * 60 + 30:
            for i in range(1, 51):
                cid = f"COW-{i:02d}"
                if i <= 15:
                    zone, cam = "Central Water Trough", "CAM-01"
                elif i <= 30:
                    zone, cam = "Main Shelter Barn", "CAM-02"
                else:
                    zone, cam = "North Pasture Gate", "CAM-03"
                self.cattle_registry[cid] = CattleEntity(
                    cow_id=cid,
                    current_zone=zone,
                    last_camera_id=cam,
                    last_seen_timestamp=target_time,
                    status="OK",
                )

        # Default morning: 05:00 - 12:00 -> North Pasture Dispersion
        else:
            for i in range(1, 51):
                cid = f"COW-{i:02d}"
                if i <= 12:
                    zone, cam = "Central Water Trough", "CAM-01"
                elif i <= 20:
                    zone, cam = "Main Shelter Barn", "CAM-02"
                else:
                    zone, cam = "North Pasture Gate", "CAM-03"
                self.cattle_registry[cid] = CattleEntity(
                    cow_id=cid,
                    current_zone=zone,
                    last_camera_id=cam,
                    last_seen_timestamp=target_time,
                    status="OK",
                )

    def get_status(self) -> RanchStatusResponse:
        """Compile live telemetry status response."""
        mins = self._time_to_minutes(self.simulated_time)

        # Curfew mode (19:00+ or early night before 05:00)
        if mins >= 19 * 60 or mins < 5 * 60:
            cameras = [
                CameraStatus(id="CAM-01", name="Central Water Trough", count=0, status="SECURE"),
                CameraStatus(id="CAM-02", name="Main Shelter Barn", count=46, status="AUDITING"),
                CameraStatus(id="CAM-03", name="North Pasture Gate", count=0, status="SECURE"),
                CameraStatus(id="CAM-04", name="East Perimeter Fence", count=0, status="BREACH_DETECTED"),
            ]
            return RanchStatusResponse(
                simulated_time=self.simulated_time,
                total_herd_size=50,
                headcount_detected=46,
                missing_count=4,
                alert_status="CRITICAL_BREACH",
                active_alert_message="4 cattle missing during 19:00 Shelter Curfew muster.",
                cameras=cameras,
            )

        # Migration and breach transition (18:30 - 18:59)
        elif mins >= 18 * 60 + 30:
            cameras = [
                CameraStatus(id="CAM-01", name="Central Water Trough", count=0, status="SECURE"),
                CameraStatus(id="CAM-02", name="Main Shelter Barn", count=46, status="AUDITING"),
                CameraStatus(id="CAM-03", name="North Pasture Gate", count=0, status="SECURE"),
                CameraStatus(id="CAM-04", name="East Perimeter Fence", count=2, status="BREACH_DETECTED"),
            ]
            return RanchStatusResponse(
                simulated_time=self.simulated_time,
                total_herd_size=50,
                headcount_detected=48,
                missing_count=2,
                alert_status="ADVISORY",
                active_alert_message="Cattle migrating to Shelter Barn. Perimeter breach detected at East Fence (CAM-04).",
                cameras=cameras,
            )

        # Midday Hydration (12:00 - 14:00)
        elif 12 * 60 <= mins < 14 * 60:
            cameras = [
                CameraStatus(id="CAM-01", name="Central Water Trough", count=28, status="SECURE"),
                CameraStatus(id="CAM-02", name="Main Shelter Barn", count=6, status="SECURE"),
                CameraStatus(id="CAM-03", name="North Pasture Gate", count=16, status="SECURE"),
                CameraStatus(id="CAM-04", name="East Perimeter Fence", count=0, status="SECURE"),
            ]
            return RanchStatusResponse(
                simulated_time=self.simulated_time,
                total_herd_size=50,
                headcount_detected=50,
                missing_count=0,
                alert_status="NOMINAL",
                active_alert_message="Midday hydration cycle active. Normal distribution.",
                cameras=cameras,
            )

        # General grazing (08:00 - 12:00, 14:00 - 18:30)
        else:
            cam1_cnt = sum(1 for c in self.cattle_registry.values() if c.last_camera_id == "CAM-01")
            cam2_cnt = sum(1 for c in self.cattle_registry.values() if c.last_camera_id == "CAM-02")
            cam3_cnt = sum(1 for c in self.cattle_registry.values() if c.last_camera_id == "CAM-03")
            cam4_cnt = sum(1 for c in self.cattle_registry.values() if c.last_camera_id == "CAM-04")
            cameras = [
                CameraStatus(id="CAM-01", name="Central Water Trough", count=cam1_cnt, status="SECURE"),
                CameraStatus(id="CAM-02", name="Main Shelter Barn", count=cam2_cnt, status="SECURE"),
                CameraStatus(id="CAM-03", name="North Pasture Gate", count=cam3_cnt, status="SECURE"),
                CameraStatus(id="CAM-04", name="East Perimeter Fence", count=cam4_cnt, status="SECURE"),
            ]
            return RanchStatusResponse(
                simulated_time=self.simulated_time,
                total_herd_size=50,
                headcount_detected=50,
                missing_count=0,
                alert_status="NOMINAL",
                active_alert_message="All perimeter sectors secure. Normal grazing activity.",
                cameras=cameras,
            )

    def add_schedule(self, item: ScheduleItem) -> None:
        """Add a new scheduled operational rule."""
        self.schedules.append(item)

    def list_schedules(self) -> List[ScheduleItem]:
        """Return list of active operational rules."""
        return list(self.schedules)

    def get_missing_cattle(self) -> List[CattleEntity]:
        """Return entities that are MISSING or in BREACH."""
        return [c for c in self.cattle_registry.values() if c.status in ("MISSING", "BREACH")]

    def get_cattle_details(self, cow_id_query: str) -> Optional[CattleEntity]:
        """Look up entity by case-insensitive or numeric query (e.g. '12', 'cow 12', 'COW-12')."""
        normalized = cow_id_query.strip().upper().replace(" ", "-")
        if not normalized.startswith("COW-"):
            # If purely digits e.g. "12"
            digits = "".join(filter(str.isdigit, normalized))
            if digits:
                normalized = f"COW-{int(digits):02d}"
        return self.cattle_registry.get(normalized)


# Global singleton instance for application runtime
state_manager = RanchStateManager()
