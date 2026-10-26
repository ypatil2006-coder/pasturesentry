import React, { useEffect, useRef, useState } from 'react';
import { soundManager } from '../utils/audio';

export const IsometricPastureCanvas = ({
  isBreached,
  selectedCamera,
  onSelectCamera,
  onBreachHover,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredEntity, setHoveredEntity] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Persistent simulation state
  const stateRef = useRef({
    animFrame: null,
    tick: 0,
    dronePos: { x: 300, y: 150, targetX: 300, targetY: 150 },
    cows: Array.from({ length: 50 }, (_, i) => {
      const isBreachCow = [11, 18, 3, 30].includes(i); // 4 missing cows
      return {
        id: `COW-${String(i + 1).padStart(2, '0')}`,
        tag: `RFID-${8800 + i + 1}`,
        x: 180 + Math.random() * 320,
        y: 120 + Math.random() * 220,
        targetX: 180 + Math.random() * 320,
        targetY: 120 + Math.random() * 220,
        speed: 0.3 + Math.random() * 0.4,
        angle: Math.random() * Math.PI * 2,
        isBreachCow,
        chewingTick: Math.random() * 100,
        weight: 1100 + Math.floor(Math.random() * 300),
      };
    }),
  });

  // Camera node positions in canvas coordinates
  const CAM_NODES = [
    {
      id: 'CAM-01',
      name: 'Water Trough',
      x: 320,
      y: 220,
      w: 80,
      h: 50,
      color: '#2B4C7E',
      type: 'trough',
      label: 'CAM-01 TROUGH',
    },
    {
      id: 'CAM-02',
      name: 'Shelter Barn',
      x: 130,
      y: 110,
      w: 120,
      h: 90,
      color: '#C84B31',
      type: 'barn',
      label: 'CAM-02 BARN',
    },
    {
      id: 'CAM-03',
      name: 'North Gate',
      x: 440,
      y: 80,
      w: 70,
      h: 40,
      color: '#FFBD2E',
      type: 'gate',
      label: 'CAM-03 GATE',
    },
    {
      id: 'CAM-04',
      name: 'East Perimeter Breach',
      x: 520,
      y: 270,
      w: 90,
      h: 55,
      color: '#FF3B30',
      type: 'breach',
      label: 'CAM-04 BREACH',
    },
  ];

  // Mouse move handler
  const handleMouseMove = (e) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

      // Check hover over camera nodes
      let found = null;
      for (const cam of CAM_NODES) {
        if (
          x >= cam.x - cam.w / 2 &&
          x <= cam.x + cam.w / 2 &&
          y >= cam.y - cam.h / 2 &&
          y <= cam.y + cam.h / 2
        ) {
          found = { type: 'camera', data: cam };
          break;
        }
      }

      // Check hover over cows if no camera hovered
      if (!found && stateRef.current?.cows) {
        for (const cow of stateRef.current.cows) {
          const dx = cow.x - x;
          const dy = cow.y - y;
          if (dx * dx + dy * dy < 120) {
            found = { type: 'cow', data: cow };
            break;
          }
        }
      }

      setHoveredEntity(found);
    } catch {
      // Safe fallback
    }
  };

  // Click handler
  const handleCanvasClick = (e) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      for (const cam of CAM_NODES) {
        if (
          x >= cam.x - cam.w / 2 &&
          x <= cam.x + cam.w / 2 &&
          y >= cam.y - cam.h / 2 &&
          y <= cam.y + cam.h / 2
        ) {
          soundManager.playLockBeep();
          if (onSelectCamera) onSelectCamera(cam.id);
          break;
        }
      }
    } catch {
      // Safe fallback
    }
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas native resolution
    canvas.width = 680;
    canvas.height = 380;

    const render = () => {
      try {
        const state = stateRef.current;
        if (!state) return;
        state.tick = (state.tick || 0) + 1;
        const t = state.tick;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. BASE PASTURE GROUND WITH SOFT GRADIENT & HALFTONE
      const bgGrad = ctx.createLinearGradient(0, 0, 680, 380);
      bgGrad.addColorStop(0, '#7EB37E');
      bgGrad.addColorStop(1, '#659D65');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Halftone dot texture on grass
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      for (let px = 10; px < canvas.width; px += 20) {
        for (let py = 10; py < canvas.height; py += 20) {
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. DIRT ROADS & CROSSROADS (Connecting Barn to Trough and Highway)
      ctx.strokeStyle = '#D4B282';
      ctx.lineWidth = 28;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Barn to Trough
      ctx.beginPath();
      ctx.moveTo(130, 140);
      ctx.lineTo(320, 220);
      ctx.stroke();

      // Trough to North Gate
      ctx.beginPath();
      ctx.moveTo(320, 220);
      ctx.lineTo(440, 80);
      ctx.stroke();

      // Trough to East Breach
      ctx.beginPath();
      ctx.moveTo(320, 220);
      ctx.lineTo(520, 270);
      ctx.stroke();

      // Dirt Road Edges (dashed texture)
      ctx.strokeStyle = '#B89768';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(130, 140);
      ctx.lineTo(320, 220);
      ctx.lineTo(440, 80);
      ctx.moveTo(320, 220);
      ctx.lineTo(520, 270);
      ctx.stroke();

      // 3. HIGHWAY 81 ALONG EAST PERIMETER
      ctx.fillStyle = '#2A2E35';
      ctx.beginPath();
      ctx.moveTo(590, 0);
      ctx.lineTo(680, 0);
      ctx.lineTo(680, 380);
      ctx.lineTo(590, 380);
      ctx.closePath();
      ctx.fill();

      // Highway dashed yellow center divider
      ctx.strokeStyle = '#FFE600';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(635, 0);
      ctx.lineTo(635, 380);
      ctx.stroke();
      ctx.setLineDash([]);

      // Highway guard rails
      ctx.strokeStyle = '#718096';
      ctx.lineWidth = 3;
      ctx.strokeRect(588, 0, 2, 380);

      // Highway 81 Comic Signpost
      ctx.fillStyle = '#007A3D';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.fillRect(600, 30, 70, 30);
      ctx.strokeRect(600, 30, 70, 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px "Space Mono", monospace';
      ctx.fillText('HIGHWAY 81', 605, 48);
      ctx.fillText('▲ NORTH', 612, 57);

      // 4. PERIMETER WOODEN FENCE WITH POSTS & WIRE
      ctx.strokeStyle = '#5C4033';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, 565, 340);

      // Fence Posts along the wire
      for (let fx = 20; fx <= 585; fx += 35) {
        // Skip breach gap near CAM-04 (x: 500 - 550, y: bottom)
        const isNearBreach = fx >= 490 && fx <= 550;
        if (!isNearBreach) {
          ctx.fillStyle = '#8B5A2B';
          ctx.fillRect(fx - 2, 16, 4, 10);
          ctx.fillRect(fx - 2, 356, 4, 10);
        }
      }
      for (let fy = 20; fy <= 360; fy += 35) {
        ctx.fillStyle = '#8B5A2B';
        ctx.fillRect(16, fy - 2, 10, 4);
        // East fence posts (except gap)
        if (fy < 240 || fy > 300) {
          ctx.fillRect(581, fy - 2, 10, 4);
        }
      }

      // 5. DRAWING 3D ISOMETRIC STRUCTURES

      // A) CAM-02: 3D TIMBER SHELTER BARN
      const bx = 130;
      const by = 110;
      // Barn Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(bx, by + 40, 60, 25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Barn Walls (Warm Red Timber)
      ctx.fillStyle = '#B23A22';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.fillRect(bx - 55, by - 25, 110, 65);
      ctx.strokeRect(bx - 55, by - 25, 110, 65);

      // Wood plank slats
      ctx.strokeStyle = '#8E2C17';
      ctx.lineWidth = 1.5;
      for (let wx = bx - 45; wx < bx + 50; wx += 15) {
        ctx.beginPath();
        ctx.moveTo(wx, by - 25);
        ctx.lineTo(wx, by + 40);
        ctx.stroke();
      }

      // Barn Gable Roof (Angled 3D Isometric Look)
      ctx.fillStyle = '#E65100';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx - 65, by - 25);
      ctx.lineTo(bx, by - 65);
      ctx.lineTo(bx + 65, by - 25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Barn Doorway (Dark interior with yellow hay light)
      ctx.fillStyle = '#26150B';
      ctx.fillRect(bx - 20, by + 5, 40, 35);
      ctx.strokeRect(bx - 20, by + 5, 40, 35);
      ctx.fillStyle = '#FFE600';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('CORRAL (46)', bx - 28, by - 10);

      // Barn Camera Beacon Pin (CAM-02)
      ctx.fillStyle = selectedCamera === 'CAM-02' ? '#FFE600' : '#FF3B30';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bx, by - 70, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('02', bx - 5, by - 67);

      // B) CAM-01: 3D WATER TROUGH
      const tx = 320;
      const ty = 220;
      // Trough Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(tx, ty + 12, 42, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stone/Metal Outer Rim
      ctx.fillStyle = '#4A5568';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(tx, ty, 40, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Shimmering Blue Water
      const waterGrad = ctx.createRadialGradient(tx, ty, 5, tx, ty, 35);
      waterGrad.addColorStop(0, '#63B3ED');
      waterGrad.addColorStop(1, '#2B6CB0');
      ctx.fillStyle = waterGrad;
      ctx.beginPath();
      ctx.ellipse(tx, ty, 34, 16, 0, Math.PI * 2);
      ctx.fill();

      // Animated Water Ripple
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.5;
      const rippleRadius = 8 + (t % 40) * 0.5;
      ctx.beginPath();
      ctx.ellipse(tx, ty, rippleRadius, rippleRadius * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Mineral block salt lick next to trough
      ctx.fillStyle = '#E2E8F0';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.fillRect(tx + 36, ty + 2, 14, 14);
      ctx.strokeRect(tx + 36, ty + 2, 14, 14);

      // Beacon Pin (CAM-01)
      ctx.fillStyle = selectedCamera === 'CAM-01' ? '#FFE600' : '#3182CE';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tx, ty - 22, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('01', tx - 5, ty - 19);

      // C) CAM-03: NORTH PASTURE GATE
      const gx = 440;
      const gy = 80;
      // Gate Posts
      ctx.fillStyle = '#8B5A2B';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.fillRect(gx - 26, gy - 16, 8, 32);
      ctx.strokeRect(gx - 26, gy - 16, 8, 32);
      ctx.fillRect(gx + 18, gy - 16, 8, 32);
      ctx.strokeRect(gx + 18, gy - 16, 8, 32);

      // Split Rail Wooden Gate Bar
      ctx.fillStyle = '#D69E2E';
      ctx.fillRect(gx - 22, gy - 6, 42, 6);
      ctx.strokeRect(gx - 22, gy - 6, 42, 6);
      ctx.fillRect(gx - 22, gy + 4, 42, 6);
      ctx.strokeRect(gx - 22, gy + 4, 42, 6);

      // Beacon Pin (CAM-03)
      ctx.fillStyle = selectedCamera === 'CAM-03' ? '#FFE600' : '#D69E2E';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(gx, gy - 20, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('03', gx - 5, gy - 17);

      // D) CAM-04: EAST PERIMETER BREACH ZONE
      const ex = 530;
      const ey = 270;
      // Broken Post with snapped wire
      ctx.fillStyle = '#744210';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      // Slanted broken post
      ctx.save();
      ctx.translate(ex - 15, ey);
      ctx.rotate(0.3);
      ctx.fillRect(-3, -15, 6, 26);
      ctx.strokeRect(-3, -15, 6, 26);
      ctx.restore();

      // Jagged red dashed wire gap
      ctx.strokeStyle = isBreached ? '#FF3B30' : '#A0AEC0';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ex - 20, ey - 20);
      ctx.lineTo(ex + 10, ey);
      ctx.lineTo(ex + 40, ey + 20);
      ctx.stroke();
      ctx.setLineDash([]);

      // Beacon Pin (CAM-04)
      ctx.fillStyle = selectedCamera === 'CAM-04' ? '#FFE600' : '#E53E3E';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ex, ey - 18, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('04', ex - 5, ey - 15);

      // 6. ANIMATED CATTLE MOVEMENT & GRAZING
      state.cows.forEach((cow, idx) => {
        // If Curfew Breach active, breach cows run through East gap towards Highway 81!
        if (isBreached && cow.isBreachCow) {
          // Move towards Highway 81 (x: 620, y: 280)
          const targetX = 590 + (idx % 2) * 20;
          const targetY = 250 + (idx % 4) * 25;
          const dx = targetX - cow.x;
          const dy = targetY - cow.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 5) {
            cow.x += (dx / dist) * 1.2;
            cow.y += (dy / dist) * 1.2;
            cow.angle = Math.atan2(dy, dx);
          }
        } else {
          // Normal peaceful grazing wander
          cow.chewingTick += 1;
          const dx = cow.targetX - cow.x;
          const dy = cow.targetY - cow.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 10 || Math.random() < 0.005) {
            // Pick new pasture target
            cow.targetX = 160 + Math.random() * 360;
            cow.targetY = 90 + Math.random() * 240;
          } else {
            cow.x += (dx / dist) * cow.speed;
            cow.y += (dy / dist) * cow.speed;
            cow.angle = Math.atan2(dy, dx);
          }
        }

        // DRAW CUTE BLACK ANGUS COW
        ctx.save();
        ctx.translate(cow.x, cow.y);

        // Cow shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.beginPath();
        ctx.ellipse(0, 6, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cow Body (Black Angus)
        ctx.fillStyle = cow.isBreachCow && isBreached ? '#FF3B30' : '#1A202C';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;

        // Oval body
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 5, cow.angle, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cow Head
        const hx = Math.cos(cow.angle) * 7;
        const hy = Math.sin(cow.angle) * 7;
        ctx.beginPath();
        ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cute Little White Horns
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(hx - 1, hy - 4, 2, 2);

        // Hover bounding box bracket if hovered
        if (hoveredEntity && hoveredEntity.type === 'cow' && hoveredEntity.data.id === cow.id) {
          ctx.strokeStyle = '#FFE600';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-12, -12, 24, 24);
        }

        ctx.restore();
      });

      // 7. ANIMATED ESCAPE VECTOR & CHEVRONS (When Breached)
      if (isBreached) {
        // Glowing Neon Yellow/Red Dashed Trajectory from Barn to Highway
        ctx.save();
        ctx.strokeStyle = '#FFE600';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.setLineDash([14, 10]);
        ctx.lineDashOffset = -t * 1.5;

        ctx.beginPath();
        ctx.moveTo(180, 140);
        ctx.quadraticCurveTo(360, 260, 600, 275);
        ctx.stroke();

        // Outer red pulse glow
        ctx.strokeStyle = 'rgba(255, 59, 48, 0.6)';
        ctx.lineWidth = 12;
        ctx.stroke();
        ctx.restore();

        // Big Arrowhead entering Highway 81
        ctx.fillStyle = '#FFE600';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(605, 275);
        ctx.lineTo(585, 263);
        ctx.lineTo(588, 287);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Comic Starburst Label: 'BREACH TO HWY 81'
        ctx.fillStyle = '#FF3B30';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.fillRect(470, 215, 110, 22);
        ctx.strokeRect(470, 215, 110, 22);
        ctx.fillStyle = '#FFE600';
        ctx.font = 'bold 9px "Space Grotesk", sans-serif';
        ctx.fillText('⚡ 4 COWS ESCAPING!', 475, 230);
      }

      // 8. AUTONOMOUS DRONE OVERHEAD SWEEP
      const drone = state.dronePos;
      // Target moves towards active camera or breach
      if (isBreached) {
        drone.targetX = 520;
        drone.targetY = 240;
      } else if (selectedCamera === 'CAM-01') {
        drone.targetX = 320;
        drone.targetY = 180;
      } else if (selectedCamera === 'CAM-02') {
        drone.targetX = 140;
        drone.targetY = 100;
      } else if (selectedCamera === 'CAM-03') {
        drone.targetX = 440;
        drone.targetY = 70;
      } else {
        drone.targetX = 300 + Math.sin(t * 0.02) * 120;
        drone.targetY = 180 + Math.cos(t * 0.02) * 60;
      }

      drone.x += (drone.targetX - drone.x) * 0.04;
      drone.y += (drone.targetY - drone.y) * 0.04;

      // Drone Spotlight Beam on ground
      const spotGrad = ctx.createRadialGradient(
        drone.x,
        drone.y + 15,
        10,
        drone.x,
        drone.y + 15,
        45
      );
      spotGrad.addColorStop(0, 'rgba(255, 230, 0, 0.28)');
      spotGrad.addColorStop(1, 'rgba(255, 230, 0, 0.0)');
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.ellipse(drone.x, drone.y + 15, 45, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Drone Quadcopter Icon
      ctx.save();
      ctx.translate(drone.x, drone.y);

      // Drone Arms
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-16, -16);
      ctx.lineTo(16, 16);
      ctx.moveTo(-16, 16);
      ctx.lineTo(16, -16);
      ctx.stroke();

      // Spinning Rotor Discs
      ctx.fillStyle = 'rgba(255, 230, 0, 0.6)';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      [-16, 16].forEach((rx) => {
        [-16, 16].forEach((ry) => {
          ctx.beginPath();
          ctx.arc(rx, ry, 5 + Math.sin(t * 0.5) * 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      });

      // Drone Central Fuselage
      ctx.fillStyle = '#FFE600';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.fillRect(-6, -6, 12, 12);
      ctx.strokeRect(-6, -6, 12, 12);

      // Flashing Navigation Light
      ctx.fillStyle = t % 30 < 15 ? '#00D26A' : '#FF3B30';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } catch (err) {
      console.warn('Canvas render error safely handled:', err);
    }

    if (stateRef.current) {
      stateRef.current.animFrame = requestAnimationFrame(render);
    }
  };

    render();

    return () => {
      if (stateRef.current.animFrame) {
        cancelAnimationFrame(stateRef.current.animFrame);
      }
    };
  }, [isBreached, selectedCamera]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[16/10] bg-[#689E68] border-4 border-black rounded-2xl overflow-hidden shadow-comic select-none cursor-crosshair"
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
        className="w-full h-full block"
      />

      {/* Floating HUD Badges inside Canvas */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
        <span className="px-2.5 py-1 bg-[#141414] text-[#FFE600] font-mono font-bold text-[10px] rounded-lg border border-black shadow-comic-sm">
          AERIAL 3D RADAR • 60 FPS
        </span>
        <span className="px-2 py-0.5 bg-[#00D26A] text-black font-mono font-bold text-[10px] rounded border border-black shadow-comic-sm">
          FLIR THERMAL: ONLINE
        </span>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none">
        <span className="px-2 py-1 bg-white text-black font-mono font-bold text-[10px] rounded-lg border-2 border-black shadow-comic-sm">
          DRONE: ALPHA-01 [ALT 45M]
        </span>
      </div>

      {/* Hover Tooltip Card */}
      {hoveredEntity && (
        <div
          style={{
            left: `${Math.min(mousePos.x + 12, 480)}px`,
            top: `${Math.min(mousePos.y + 12, 300)}px`,
          }}
          className="absolute z-40 bg-white border-2 border-black rounded-xl p-2 shadow-comic font-mono text-[10px] pointer-events-none whitespace-nowrap"
        >
          {hoveredEntity.type === 'camera' && (
            <div>
              <div className="font-bold text-black flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#00D26A] inline-block" />
                {hoveredEntity.data.label}
              </div>
              <div className="text-neutral-600">Click to focus CCTV & Drone</div>
            </div>
          )}
          {hoveredEntity.type === 'cow' && (
            <div>
              <div className="font-bold text-black flex items-center gap-1">
                🐮 {hoveredEntity.data.id} ({hoveredEntity.data.tag})
              </div>
              <div className="text-neutral-700">
                Weight: {hoveredEntity.data.weight} lbs • {isBreached && hoveredEntity.data.isBreachCow ? '⚠️ ESCAPING' : 'Grazing'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
