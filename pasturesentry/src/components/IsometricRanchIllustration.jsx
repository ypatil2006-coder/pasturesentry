import React from 'react';
import { soundManager } from '../utils/audio';

export const IsometricRanchIllustration = ({
  isBreached,
  selectedCamera,
  onSelectCamera,
}) => {
  // 12 Angus Cattle positions with realistic scale & distribution matching camera feeds
  // 4 resting in shelter barn, 3 near water trough, 2 in north meadow, 3 heading toward Highway 81 breach
  const cattleList = [
    // In Shelter Barn (resting on golden straw)
    { id: 'COW-01', x: 205, y: 220, label: 'COW #01', isBreach: false, resting: true, rotation: 15 },
    { id: 'COW-02', x: 245, y: 205, label: 'COW #02', isBreach: false, resting: true, rotation: -20 },
    { id: 'COW-03', x: 275, y: 230, label: 'COW #03', isBreach: false, resting: false, rotation: 30 },
    { id: 'COW-08', x: 230, y: 245, label: 'COW #08', isBreach: false, resting: true, rotation: 5 },

    // Near Central Water Trough
    { id: 'COW-06', x: 345, y: 275, label: 'COW #06', isBreach: false, resting: false, rotation: -45 },
    { id: 'COW-07', x: 490, y: 285, label: 'COW #07', isBreach: false, resting: false, rotation: 120 },
    { id: 'COW-09', x: 380, y: 330, label: 'COW #09', isBreach: false, resting: false, rotation: 60 },

    // North Pasture Meadows
    { id: 'COW-10', x: 360, y: 150, label: 'COW #10', isBreach: false, resting: false, rotation: -15 },
    { id: 'COW-11', x: 435, y: 165, label: 'COW #11', isBreach: false, resting: false, rotation: 40 },

    // East Perimeter Breach Corridor (Escaping toward Highway 81)
    { id: 'COW-04', x: 550, y: 315, label: 'COW #04', isBreach: true, resting: false, rotation: 35 },
    { id: 'COW-12', x: 615, y: 345, label: 'COW #12', isBreach: true, resting: false, rotation: 40 },
    { id: 'COW-05', x: 675, y: 330, label: 'COW #05', isBreach: true, resting: false, rotation: 50 },
  ];

  return (
    <div className="relative w-full bg-white border-4 border-black rounded-2xl shadow-comic overflow-hidden select-none">
      {/* Top Yellow Header Bar */}
      <div className="bg-[#FFE600] px-4 py-2 border-b-4 border-black flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#00D26A] border-2 border-black inline-block animate-pulse" />
          <h3 className="font-comic text-xs sm:text-sm font-black uppercase text-black tracking-wider">
            PASTURE SPATIAL TWIN & CCTV SENTINELS
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold bg-black text-white px-2 py-0.5 rounded border border-black">
            800×500 AXONOMETRIC
          </span>
          <span className={`text-[10px] font-comic font-black px-2 py-0.5 rounded border border-black ${
            isBreached ? 'bg-[#FF3B30] text-white animate-pulse' : 'bg-[#00D26A] text-black'
          }`}>
            {isBreached ? '🚨 CURFEW BREACH' : 'SECURE (50 HEAD)'}
          </span>
        </div>
      </div>

      {/* Floating Tilted Starburst Badge on Top-Left */}
      <div className="absolute top-11 -left-2 z-30 transform -rotate-12 pointer-events-none">
        <div className="relative flex items-center justify-center">
          <svg className="w-24 h-24 drop-shadow-[3px_3px_0px_#000]" viewBox="0 0 100 100">
            <polygon
              points="50,0 63,22 88,10 82,35 100,50 82,65 88,90 63,78 50,100 37,78 12,90 18,65 0,50 18,35 12,10 37,22"
              fill="#FFE600"
              stroke="#000000"
              strokeWidth="3.5"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
            <span className="font-comic text-[#FF3B30] text-sm font-black tracking-tight">
              LIVE!
            </span>
            <span className="font-comic text-black text-[8px] font-black uppercase">
              4 CAMS
            </span>
            <span className="font-mono text-black text-[7px] font-bold">
              SENTINEL
            </span>
          </div>
        </div>
      </div>

      {/* Main Isometric SVG Ranch Illustration */}
      <div className="relative w-full aspect-[16/10] bg-[#3B8A44] overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full block"
          style={{ shapeRendering: 'geometricPrecision' }}
        >
          <defs>
            {/* Halftone dot pattern for pasture */}
            <pattern id="pastureDots" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="8" cy="8" r="1.4" fill="#000000" opacity="0.08" />
            </pattern>

            {/* Corrugated Metal Roof Ribs Pattern */}
            <pattern id="corrugatedRibs" width="8" height="12" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="8" y2="0" stroke="#475569" strokeWidth="1.5" />
              <line x1="0" y1="6" x2="8" y2="6" stroke="#CBD5E1" strokeWidth="1" />
            </pattern>

            {/* Golden Straw Bedding Texture */}
            <pattern id="strawPattern" width="12" height="12" patternUnits="userSpaceOnUse">
              <line x1="2" y1="3" x2="8" y2="2" stroke="#B45309" strokeWidth="1" strokeLinecap="round" />
              <line x1="4" y1="9" x2="10" y2="8" stroke="#D97706" strokeWidth="1" strokeLinecap="round" />
            </pattern>

            {/* Asphalt Texture */}
            <pattern id="asphaltStipple" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="#1E293B" />
              <circle cx="2" cy="2" r="0.8" fill="#334155" opacity="0.6" />
              <circle cx="5" cy="5" r="0.8" fill="#0F172A" opacity="0.8" />
            </pattern>
          </defs>

          {/* 1. ISOMETRIC PASTURE SURFACE (Large Axonometric Diamond Grid) */}
          <polygon
            points="70,240 400,60 730,240 400,440"
            fill="#48BB78"
            stroke="#000000"
            strokeWidth="4"
          />

          {/* Halftone texture overlay on pasture */}
          <polygon
            points="70,240 400,60 730,240 400,440"
            fill="url(#pastureDots)"
          />

          {/* Grass tufts scattered naturally */}
          {[
            [120, 260], [160, 310], [210, 360], [310, 390], [380, 410],
            [300, 130], [340, 95], [450, 110], [520, 160], [560, 210],
            [480, 230], [350, 210], [450, 350], [520, 370], [640, 260],
          ].map(([gx, gy], i) => (
            <g key={i} stroke="#22543D" strokeWidth="1.8" strokeLinecap="round">
              <line x1={gx} y1={gy} x2={gx - 3} y2={gy - 6} />
              <line x1={gx + 2} y1={gy} x2={gx + 3} y2={gy - 8} />
              <line x1={gx + 6} y1={gy} x2={gx + 9} y2={gy - 5} />
            </g>
          ))}

          {/* 2. HIGHWAY 81 (EAST BORDER CORRIDOR) */}
          <g id="highway81">
            {/* Asphalt Highway Corridor */}
            <polygon
              points="580,40 760,135 770,390 600,295"
              fill="url(#asphaltStipple)"
              stroke="#000000"
              strokeWidth="4"
            />

            {/* Asphalt Highway Shoulder / Gravel Edge */}
            <line x1="588" y1="44" x2="608" y2="299" stroke="#64748B" strokeWidth="3" />
            <line x1="752" y1="139" x2="762" y2="385" stroke="#64748B" strokeWidth="3" />

            {/* Double Solid Yellow Center Line */}
            <line
              x1="669"
              y1="87"
              x2="684"
              y2="343"
              stroke="#FFE600"
              strokeWidth="3.5"
            />
            <line
              x1="675"
              y1="90"
              x2="690"
              y2="346"
              stroke="#FFE600"
              strokeWidth="3.5"
            />

            {/* Highway 81 Green Shield Sign */}
            <g transform="translate(640, 60)">
              <line x1="20" y1="28" x2="20" y2="52" stroke="#000000" strokeWidth="3.5" />
              <rect
                x="0"
                y="0"
                width="84"
                height="30"
                rx="5"
                fill="#007A3D"
                stroke="#000000"
                strokeWidth="3"
              />
              <text
                x="42"
                y="14"
                textAnchor="middle"
                fill="#FFFFFF"
                fontFamily="Space Grotesk, sans-serif"
                fontSize="9"
                fontWeight="900"
                letterSpacing="0.8"
              >
                HIGHWAY 81
              </text>
              <text
                x="42"
                y="24"
                textAnchor="middle"
                fill="#FFE600"
                fontFamily="Space Grotesk, sans-serif"
                fontSize="7.5"
                fontWeight="800"
              >
                SPEED LIMIT 65
              </text>
            </g>
          </g>

          {/* 3. SANDY TWO-TRACK RANCH ACCESS TRAILS */}
          <g id="ranchTrails">
            {/* Trail from North Gate to Central Crossroads */}
            <polygon
              points="385,85 415,85 430,240 370,240"
              fill="#D4A373"
              stroke="#000000"
              strokeWidth="2.5"
            />
            {/* Tire track indentations */}
            <path d="M 392,90 Q 395,160 380,235" stroke="#B08968" strokeWidth="2" strokeDasharray="6 4" fill="none" />
            <path d="M 408,90 Q 412,160 420,235" stroke="#B08968" strokeWidth="2" strokeDasharray="6 4" fill="none" />

            {/* Trail from Shelter Barn to Central Crossroads */}
            <polygon
              points="250,235 385,235 390,265 260,265"
              fill="#D4A373"
              stroke="#000000"
              strokeWidth="2.5"
            />

            {/* Trail past Water Trough heading toward East Breach */}
            <polygon
              points="385,255 580,315 575,345 375,275"
              fill="#D4A373"
              stroke="#000000"
              strokeWidth="2.5"
            />

            {/* Trampled escape path extending from East Breach across ditch to Highway 81 */}
            <polygon
              points="575,325 640,345 635,370 570,345"
              fill="#B45309"
              stroke="#000000"
              strokeWidth="2"
            />
          </g>

          {/* 4. PERIMETER FENCE & GATES */}
          <g id="perimeterFence">
            {/* North-West Fence line */}
            <line x1="70" y1="240" x2="385" y2="85" stroke="#4A2E18" strokeWidth="3" />
            <line x1="70" y1="234" x2="385" y2="79" stroke="#4A2E18" strokeWidth="2" />

            {/* North-East Fence line to Highway */}
            <line x1="415" y1="85" x2="580" y2="165" stroke="#4A2E18" strokeWidth="3" />
            <line x1="415" y1="79" x2="580" y2="159" stroke="#4A2E18" strokeWidth="2" />

            {/* South-West Fence line */}
            <line x1="70" y1="240" x2="400" y2="440" stroke="#4A2E18" strokeWidth="3" />
            <line x1="70" y1="234" x2="400" y2="434" stroke="#4A2E18" strokeWidth="2" />

            {/* South-East Fence line WITH BREACH GAP at CAM-04 */}
            <line x1="400" y1="440" x2="560" y2="355" stroke="#4A2E18" strokeWidth="3" />
            {/* GAP between (560, 355) and (625, 320) */}
            <line x1="625" y1="320" x2="730" y2="240" stroke="#4A2E18" strokeWidth="3" />

            {/* Downed barbed wire mesh crushed on ground at CAM-04 */}
            <path
              d="M 560,355 Q 585,365 600,345 T 625,320"
              fill="none"
              stroke="#64748B"
              strokeWidth="2.5"
              strokeDasharray="4 3"
            />

            {/* Regular Fence Posts */}
            {[
              [80, 235], [130, 210], [180, 185], [230, 160], [280, 135], [330, 110], [380, 85],
              [420, 85], [460, 105], [500, 125], [540, 145],
              [90, 255], [140, 285], [190, 315], [240, 345], [290, 375], [340, 405], [390, 435],
              [440, 420], [480, 400], [520, 380], [555, 360],
              [635, 310], [675, 280], [715, 250]
            ].map(([px, py], idx) => (
              <g key={idx}>
                <ellipse cx={px + 2} cy={py + 1} rx="3.5" ry="2" fill="rgba(0,0,0,0.3)" />
                <rect x={px - 2} y={py - 12} width="4.5" height="13" fill="#8B5A2B" stroke="#000000" strokeWidth="1.5" />
              </g>
            ))}
          </g>

          {/* 5. CAM-02: AUTHENTIC MASSIVE OPEN-FRONT TIMBER POLE BARN (Matching cam2_shelter_barn.jpg) */}
          {/* Dominates Sector Bravo (Western quadrant) with 220px x 140px footprint */}
          <g
            id="barn-cam02"
            onClick={() => {
              soundManager.playLockBeep();
              onSelectCamera('CAM-02');
            }}
            className="cursor-pointer transition-transform hover:scale-[1.01]"
          >
            {/* Barn Drop Shadow */}
            <polygon
              points="110,215 220,150 360,210 250,285"
              fill="rgba(0,0,0,0.25)"
            />

            {/* Golden Straw Bedding Floor (Visible inside open bays!) */}
            <polygon
              points="120,205 220,155 330,205 230,265"
              fill="#F59E0B"
              stroke="#000000"
              strokeWidth="2.5"
            />
            <polygon
              points="120,205 220,155 330,205 230,265"
              fill="url(#strawPattern)"
            />

            {/* Solid Weathered Back Timber Wall */}
            <polygon
              points="220,155 330,205 330,150 220,100"
              fill="#78350F"
              stroke="#000000"
              strokeWidth="3.5"
            />
            {/* Vertical Wood Planks on Back Wall */}
            {[235, 250, 265, 280, 295, 310].map((bx, i) => (
              <line
                key={i}
                x1={bx}
                y1={100 + (bx - 220) * 0.45}
                x2={bx}
                y2={155 + (bx - 220) * 0.45}
                stroke="#451A03"
                strokeWidth="1.5"
              />
            ))}

            {/* Solid Left Timber Gable End Wall */}
            <polygon
              points="120,205 220,155 220,100 120,150"
              fill="#92400E"
              stroke="#000000"
              strokeWidth="3.5"
            />
            {/* Planks on Left Wall */}
            {[140, 160, 180, 200].map((lx, i) => (
              <line
                key={i}
                x1={lx}
                y1={150 + (lx - 120) * -0.5}
                x2={lx}
                y2={205 + (lx - 120) * -0.5}
                stroke="#5C2605"
                strokeWidth="1.5"
              />
            ))}

            {/* Interior Tubular Steel Cattle Corral Gates (Dividing stalls inside) */}
            <g id="interiorPens">
              {/* Center partition rails */}
              <line x1="225" y1="180" x2="275" y2="235" stroke="#94A3B8" strokeWidth="2.5" />
              <line x1="225" y1="188" x2="275" y2="243" stroke="#94A3B8" strokeWidth="2.5" />
              <line x1="225" y1="196" x2="275" y2="251" stroke="#94A3B8" strokeWidth="2.5" />

              {/* Feed bunk along back wall */}
              <polygon
                points="240,165 310,195 310,183 240,153"
                fill="#475569"
                stroke="#000000"
                strokeWidth="2"
              />
              <polygon
                points="240,153 310,183 315,180 245,150"
                fill="#FBBF24"
                stroke="#000000"
                strokeWidth="1"
              />
            </g>

            {/* Heavy Vertical Timber Structural Poles Supporting the Open Bays */}
            {[
              { x: 120, yBottom: 205, yTop: 150 },
              { x: 175, yBottom: 235, yTop: 180 },
              { x: 230, yBottom: 265, yTop: 210 },
              { x: 280, yBottom: 235, yTop: 180 },
              { x: 330, yBottom: 205, yTop: 150 },
            ].map((pole, i) => (
              <g key={i}>
                {/* Pole drop shadow */}
                <ellipse cx={pole.x + 2} cy={pole.yBottom + 2} rx="4" ry="2" fill="rgba(0,0,0,0.4)" />
                {/* Heavy Timber Column */}
                <rect
                  x={pole.x - 3}
                  y={pole.yTop}
                  width="6"
                  height={pole.yBottom - pole.yTop}
                  fill="#78350F"
                  stroke="#000000"
                  strokeWidth="2"
                />
                {/* 45° Diagonal Knee Braces */}
                <line
                  x1={pole.x}
                  y1={pole.yTop + 14}
                  x2={pole.x + 12}
                  y2={pole.yTop + 2}
                  stroke="#451A03"
                  strokeWidth="2.5"
                />
              </g>
            ))}

            {/* Exposed Timber Roof Trusses & Header Beams (Open Underhang) */}
            <line x1="120" y1="150" x2="230" y2="210" stroke="#78350F" strokeWidth="4" />
            <line x1="230" y1="210" x2="330" y2="150" stroke="#78350F" strokeWidth="4" />
            <line x1="175" y1="180" x2="275" y2="125" stroke="#451A03" strokeWidth="3" strokeDasharray="6 3" />

            {/* Broad Pitched Corrugated Steel Roof */}
            <polygon
              points="110,145 220,90 340,145 230,205"
              fill="#94A3B8"
              stroke="#000000"
              strokeWidth="4"
            />
            {/* Corrugated Texture Lines on Roof */}
            <polygon
              points="110,145 220,90 340,145 230,205"
              fill="url(#corrugatedRibs)"
              opacity="0.75"
            />

            {/* Roof Ridge Cap Bevel */}
            <line x1="220" y1="90" x2="340" y2="145" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.8" />
            <line x1="110" y1="145" x2="230" y2="205" stroke="#334155" strokeWidth="3" />

            {/* Sentry CCTV Camera Mounted on Right Front Timber Beam */}
            <g transform="translate(325, 142)">
              {/* Bracket */}
              <line x1="0" y1="0" x2="8" y2="8" stroke="#000000" strokeWidth="3" />
              {/* Bullet camera body */}
              <rect x="6" y="5" width="12" height="7" rx="2" fill="#FFFFFF" stroke="#000000" strokeWidth="1.8" />
              {/* Lens */}
              <circle cx="18" cy="8.5" r="3" fill="#0284C7" stroke="#000000" strokeWidth="1.2" />
              {/* Blinking Green LED */}
              <circle cx="9" cy="6.5" r="1.5" fill="#00D26A" />
            </g>

            {/* CAM-02 Comic Identification Badge */}
            <g transform="translate(160, 85)">
              <rect
                x="0"
                y="0"
                width="95"
                height="26"
                rx="6"
                fill="#FFFFFF"
                stroke="#000000"
                strokeWidth="3"
                className="drop-shadow-[2px_2px_0px_#000]"
              />
              <rect x="4" y="4" width="28" height="18" rx="4" fill="#FFE600" stroke="#000000" strokeWidth="1.5" />
              <text x="18" y="16.5" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="9" fontWeight="900" fill="#000000">
                02
              </text>
              <text x="62" y="12" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="8" fontWeight="900" fill="#000000">
                CAM-02
              </text>
              <text x="62" y="21" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="6.5" fontWeight="800" fill="#4B5563">
                SHELTER BARN
              </text>
            </g>
          </g>

          {/* 6. CAM-01: AUTHENTIC LONG CONCRETE WATER TROUGH (Matching cam1_water_trough.jpg) */}
          <g
            id="trough-cam01"
            onClick={() => {
              soundManager.playLockBeep();
              onSelectCamera('CAM-01');
            }}
            className="cursor-pointer transition-transform hover:scale-105"
          >
            {/* Dark Moist Mud / Soil Perimeter around base */}
            <polygon
              points="385,260 515,260 525,295 375,295"
              fill="#451A03"
              stroke="#000000"
              strokeWidth="2"
            />

            {/* Long Poured-Concrete Stock Tank (110px x 24px) */}
            {/* Concrete Outer Shell */}
            <polygon
              points="395,265 505,265 515,285 405,285"
              fill="#94A3B8"
              stroke="#000000"
              strokeWidth="3.5"
            />
            {/* Front Concrete Wall Depth */}
            <polygon
              points="405,285 515,285 515,293 405,293"
              fill="#64748B"
              stroke="#000000"
              strokeWidth="2"
            />

            {/* Crystal Turquoise Water Basin */}
            <polygon
              points="400,268 500,268 508,282 408,282"
              fill="#0284C7"
              stroke="#000000"
              strokeWidth="1.8"
            />

            {/* Water Ripple Specular Highlight Line */}
            <line x1="406" y1="272" x2="495" y2="272" stroke="#E0F2FE" strokeWidth="2" strokeLinecap="round" />
            <line x1="412" y1="277" x2="480" y2="277" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round" />

            {/* Float Valve Assembly at Left End */}
            <rect x="396" y="266" width="6" height="8" fill="#1E293B" stroke="#000" strokeWidth="1" />
            <circle cx="399" cy="273" r="2.5" fill="#DC2626" />

            {/* Rustic Ranch Windmill beside Water Trough */}
            <g transform="translate(370, 215)">
              {/* 4 Diagonal Lattice Tower Legs */}
              <line x1="0" y1="45" x2="10" y2="0" stroke="#475569" strokeWidth="2.5" />
              <line x1="24" y1="45" x2="14" y2="0" stroke="#475569" strokeWidth="2.5" />
              <line x1="3" y1="30" x2="21" y2="30" stroke="#475569" strokeWidth="1.5" />
              <line x1="6" y1="15" x2="18" y2="15" stroke="#475569" strokeWidth="1.5" />

              {/* Windmill Hub & Blades */}
              <circle cx="12" cy="0" r="14" fill="none" stroke="#64748B" strokeWidth="1" />
              <circle cx="12" cy="0" r="3" fill="#1E293B" stroke="#000" strokeWidth="1.5" />
              {[0, 45, 90, 135].map((ang, i) => (
                <line
                  key={i}
                  x1={12 + Math.cos((ang * Math.PI) / 180) * 13}
                  y1={0 + Math.sin((ang * Math.PI) / 180) * 13}
                  x2={12 - Math.cos((ang * Math.PI) / 180) * 13}
                  y2={0 - Math.sin((ang * Math.PI) / 180) * 13}
                  stroke="#CBD5E1"
                  strokeWidth="2"
                />
              ))}
              {/* Rudder Vane */}
              <polygon points="12,0 0,-4 0,4" fill="#D97706" stroke="#000" strokeWidth="1.2" />
            </g>

            {/* CAM-01 CCTV Sentinel Pole beside Trough */}
            <g transform="translate(525, 255)">
              <rect x="0" y="0" width="4" height="24" fill="#334155" stroke="#000" strokeWidth="1.5" />
              <rect x="-3" y="2" width="10" height="6" rx="2" fill="#FFFFFF" stroke="#000" strokeWidth="1.5" />
              <circle cx="7" cy="5" r="2" fill="#0284C7" />
              <circle cx="-1" cy="4" r="1" fill="#00D26A" />
            </g>

            {/* CAM-01 Comic Identification Badge */}
            <g transform="translate(430, 225)">
              <rect
                x="0"
                y="0"
                width="95"
                height="26"
                rx="6"
                fill="#FFFFFF"
                stroke="#000000"
                strokeWidth="3"
                className="drop-shadow-[2px_2px_0px_#000]"
              />
              <rect x="4" y="4" width="28" height="18" rx="4" fill="#FFE600" stroke="#000000" strokeWidth="1.5" />
              <text x="18" y="16.5" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="9" fontWeight="900" fill="#000000">
                01
              </text>
              <text x="62" y="12" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="8" fontWeight="900" fill="#000000">
                CAM-01
              </text>
              <text x="62" y="21" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="6.5" fontWeight="800" fill="#4B5563">
                WATER TROUGH
              </text>
            </g>
          </g>

          {/* 7. CAM-03: AUTHENTIC NORTH PASTURE GATE (Matching cam3_north_gate.jpg) */}
          <g
            id="gate-cam03"
            onClick={() => {
              soundManager.playLockBeep();
              onSelectCamera('CAM-03');
            }}
            className="cursor-pointer transition-transform hover:scale-105"
          >
            {/* Cattle Guard Grate across Two-Track Road */}
            <polygon
              points="385,80 415,80 415,92 385,92"
              fill="#334155"
              stroke="#000000"
              strokeWidth="2"
            />
            {[83, 86, 89].map((gy, i) => (
              <line key={i} x1="385" y1={gy} x2="415" y2={gy} stroke="#94A3B8" strokeWidth="1.8" />
            ))}

            {/* Heavy 10"x10" Square Timber Gateposts */}
            <rect x="382" y="62" width="7" height="24" fill="#4A2E18" stroke="#000000" strokeWidth="2" />
            <rect x="412" y="62" width="7" height="24" fill="#4A2E18" stroke="#000000" strokeWidth="2" />

            {/* Overhead Timber Ranch Archway Signboard */}
            <polygon points="378,62 422,62 422,56 378,56" fill="#78350F" stroke="#000" strokeWidth="2" />
            <rect x="385" y="47" width="30" height="9" rx="2" fill="#FFE600" stroke="#000" strokeWidth="1.5" />
            <text x="400" y="54" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="5.5" fontWeight="900" fill="#000">
              NORTH GATE
            </text>

            {/* 5-Rail Galvanized Steel Pipe Gate (Hinged on Left) */}
            {[66, 70, 74, 78, 82].map((ry, i) => (
              <line key={i} x1="389" y1={ry} x2="412" y2={ry} stroke="#CBD5E1" strokeWidth="2.5" />
            ))}
            {/* Center diagonal truss brace */}
            <line x1="389" y1="82" x2="412" y2="66" stroke="#94A3B8" strokeWidth="2" />

            {/* CAM-03 CCTV Sentinel Pole */}
            <g transform="translate(365, 60)">
              <rect x="0" y="0" width="3.5" height="22" fill="#334155" stroke="#000" strokeWidth="1.5" />
              <rect x="1" y="2" width="9" height="5" rx="1.5" fill="#FFFFFF" stroke="#000" strokeWidth="1.2" />
              <circle cx="10" cy="4.5" r="1.5" fill="#0284C7" />
              <circle cx="3" cy="3.5" r="0.8" fill="#00D26A" />
            </g>

            {/* CAM-03 Comic Identification Badge */}
            <g transform="translate(352, 22)">
              <rect
                x="0"
                y="0"
                width="95"
                height="26"
                rx="6"
                fill="#FFFFFF"
                stroke="#000000"
                strokeWidth="3"
                className="drop-shadow-[2px_2px_0px_#000]"
              />
              <rect x="4" y="4" width="28" height="18" rx="4" fill="#FFE600" stroke="#000000" strokeWidth="1.5" />
              <text x="18" y="16.5" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="9" fontWeight="900" fill="#000000">
                03
              </text>
              <text x="62" y="12" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="8" fontWeight="900" fill="#000000">
                CAM-03
              </text>
              <text x="62" y="21" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="6.5" fontWeight="800" fill="#4B5563">
                NORTH GATE
              </text>
            </g>
          </g>

          {/* 8. CAM-04: AUTHENTIC EAST PERIMETER BREACH (Matching cam4_east_breach.jpg) */}
          <g
            id="breach-cam04"
            onClick={() => {
              soundManager.playLockBeep();
              onSelectCamera('CAM-04');
            }}
            className="cursor-pointer transition-transform hover:scale-105"
          >
            {/* Splintered 8" Timber Corner Post Snapped at 35° Angle */}
            <g transform="translate(562, 356) rotate(35)">
              <polygon
                points="-3,-16 0,-20 3,-17 3,0 -3,0"
                fill="#78350F"
                stroke="#000000"
                strokeWidth="2"
              />
            </g>
            {/* Snapped Post Stump in Ground */}
            <rect x="558" y="354" width="6" height="8" fill="#451A03" stroke="#000" strokeWidth="1.5" />

            {/* Trampled Grass & Cattle Tracks leading through the gap */}
            {[
              [575, 340], [590, 350], [605, 345], [620, 355]
            ].map(([tx, ty], i) => (
              <ellipse key={i} cx={tx} cy={ty} rx="4" ry="2.5" fill="#451A03" opacity="0.7" />
            ))}

            {/* Warning Flasher Sentinel if Breached */}
            {isBreached && (
              <g transform="translate(595, 320)">
                <circle cx="0" cy="0" r="16" fill="#FF3B30" opacity="0.3" className="animate-ping" />
                <circle cx="0" cy="0" r="10" fill="#FF3B30" stroke="#000000" strokeWidth="2.5" />
                <text x="0" y="3" textAnchor="middle" fill="#FFFFFF" fontFamily="Space Grotesk, sans-serif" fontSize="9" fontWeight="900">
                  !
                </text>
              </g>
            )}

            {/* CAM-04 CCTV Sentinel Pole */}
            <g transform="translate(540, 320)">
              <rect x="0" y="0" width="3.5" height="24" fill="#334155" stroke="#000" strokeWidth="1.5" />
              <rect x="1" y="2" width="10" height="6" rx="2" fill="#FFFFFF" stroke="#000" strokeWidth="1.5" />
              <circle cx="11" cy="5" r="2" fill="#0284C7" />
              <circle cx="3" cy="4" r="1" fill={isBreached ? '#FF3B30' : '#00D26A'} className={isBreached ? 'animate-pulse' : ''} />
            </g>

            {/* CAM-04 Comic Identification Badge */}
            <g transform="translate(565, 275)">
              <rect
                x="0"
                y="0"
                width="105"
                height="28"
                rx="6"
                fill="#FFFFFF"
                stroke="#000000"
                strokeWidth="3"
                className="drop-shadow-[2px_2px_0px_#000]"
              />
              <rect
                x="4"
                y="4"
                width="28"
                height="20"
                rx="4"
                fill={isBreached ? '#FF3B30' : '#FFE600'}
                stroke="#000000"
                strokeWidth="1.5"
              />
              <text
                x="18"
                y="17.5"
                textAnchor="middle"
                fontFamily="Space Grotesk, sans-serif"
                fontSize="9"
                fontWeight="900"
                fill={isBreached ? '#FFFFFF' : '#000000'}
              >
                04
              </text>
              <text x="68" y="13" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="8" fontWeight="900" fill="#000000">
                CAM-04
              </text>
              <text
                x="68"
                y="22"
                textAnchor="middle"
                fontFamily="Space Grotesk, sans-serif"
                fontSize="6.5"
                fontWeight="900"
                fill={isBreached ? '#FF3B30' : '#4B5563'}
              >
                {isBreached ? '🚨 FENCE BREACH' : 'EAST PERIMETER'}
              </text>
            </g>
          </g>

          {/* 9. 12 BLACK ANGUS CATTLE (Realistic Scale & Proportion) */}
          <g id="cattleHerd">
            {cattleList.map((cow) => (
              <g
                key={cow.id}
                transform={`translate(${cow.x}, ${cow.y}) rotate(${cow.rotation})`}
                className="transition-transform hover:scale-125 cursor-pointer"
              >
                {/* Cow Drop Shadow */}
                <ellipse cx="2" cy={cow.resting ? 3 : 6} rx="8" ry="4" fill="rgba(0,0,0,0.3)" />

                {/* Legs (if standing) */}
                {!cow.resting && (
                  <>
                    <line x1="-4" y1="2" x2="-4" y2="7" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" />
                    <line x1="-1" y1="3" x2="-1" y2="8" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" />
                    <line x1="4" y1="3" x2="4" y2="8" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" />
                    <line x1="7" y1="2" x2="7" y2="7" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" />
                  </>
                )}

                {/* Torso (Black Angus) */}
                <ellipse
                  cx="1.5"
                  cy="1"
                  rx="7.5"
                  ry={cow.resting ? 4.5 : 5}
                  fill={cow.isBreach ? '#18181B' : '#27272A'}
                  stroke="#000000"
                  strokeWidth="1.8"
                />

                {/* Cow Head */}
                <ellipse
                  cx="-5.5"
                  cy="-1.5"
                  rx="3.8"
                  ry="3.2"
                  fill="#09090B"
                  stroke="#000000"
                  strokeWidth="1.8"
                />

                {/* Muzzle */}
                <ellipse cx="-8.5" cy="-1.5" rx="2" ry="1.8" fill="#52525B" stroke="#000" strokeWidth="0.8" />

                {/* Ears */}
                <circle cx="-6" cy="-4.5" r="1.1" fill="#FFFFFF" stroke="#000" strokeWidth="0.8" />
                <circle cx="-3.5" cy="-4.5" r="1.1" fill="#FFFFFF" stroke="#000" strokeWidth="0.8" />

                {/* Breach RFID glowing tag */}
                {cow.isBreach && isBreached && (
                  <circle cx="-7" cy="-2.5" r="1.5" fill="#FF3B30" className="animate-pulse" />
                )}
              </g>
            ))}
          </g>

          {/* 10. DYNAMIC ESCAPE TRAJECTORY TO HIGHWAY 81 (Triggered on Breach) */}
          {isBreached && (
            <g id="escapeTrajectory">
              {/* Bold Red Trajectory Glow */}
              <path
                d="M 520,310 Q 580,360 670,340"
                fill="none"
                stroke="#D90429"
                strokeWidth="10"
                strokeLinecap="round"
                className="opacity-95"
              />
              {/* Yellow Segmented Chevron Dashes */}
              <path
                d="M 520,310 Q 580,360 670,340"
                fill="none"
                stroke="#FFE600"
                strokeWidth="5"
                strokeDasharray="10 8"
                strokeLinecap="round"
              />
              {/* Bold Yellow/Red Arrowhead entering Highway 81 */}
              <polygon
                points="680,338 655,326 662,352"
                fill="#FFE600"
                stroke="#000000"
                strokeWidth="3"
              />

              {/* CRITICAL COLLISION HAZARD CALLOUT */}
              <g transform="translate(620, 395)">
                <rect
                  x="0"
                  y="0"
                  width="135"
                  height="30"
                  rx="6"
                  fill="#FF3B30"
                  stroke="#000000"
                  strokeWidth="3"
                  className="drop-shadow-[3px_3px_0px_#000]"
                />
                <text x="67" y="14" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="8" fontWeight="900" fill="#FFFFFF">
                  ⚠️ TRAFFIC IMPACT RISK
                </text>
                <text x="67" y="24" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontSize="7" fontWeight="800" fill="#FFE600">
                  4 COWS IN ROAD EASEMENT
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
