import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useRanch } from '../context/RanchContext';
import { soundManager } from '../utils/audio';
import { Camera, Compass, Eye, Maximize2, Navigation, Radio, RotateCcw, ShieldAlert, Sparkles, Wind } from 'lucide-react';

export const DroneView3D = ({ onCameraSelect }) => {
  const containerRef = useRef(null);
  const {
    timeMinutes,
    cattle,
    cameras,
    selectedCamera,
    setSelectedCamera,
    ranchStatus,
    breachEvent,
  } = useRanch();

  // Drone HUD state
  const [hudStats, setHudStats] = useState({
    alt: 48,
    heading: 42,
    speed: 12.4,
    battery: 86,
    signal: 99.2,
    lat: "34°56'22.4\"N",
    lon: "98°23'58.1\"W",
  });

  // Scene references
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef({
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    spherical: { radius: 65, theta: 0.8, phi: 0.9 },
    target: new THREE.Vector3(0, 0, 0),
    targetLookAt: new THREE.Vector3(0, 0, 0),
    desiredCamPos: new THREE.Vector3(45, 45, 45),
  });

  const cattleMeshesRef = useRef(new Map());
  const beaconsRef = useRef([]);
  const windmillBladesRef = useRef(null);
  const trajectoryLineRef = useRef(null);
  const dirLightRef = useRef(null);
  const ambLightRef = useRef(null);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera - Vibrant Daylight Sky
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7BC5F9); // Crisp sunny sky
    scene.fog = new THREE.Fog(0x7BC5F9, 70, 260);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500);
    camera.position.set(45, 48, 48);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 2. High-Performance Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Dynamic Daylight Lighting (Hemisphere Sky/Grass Fill & Directional Sun)
    const ambientLight = new THREE.HemisphereLight(0xffffff, 0x48bb78, 1.2);
    scene.add(ambientLight);
    ambLightRef.current = ambientLight;

    const sunLight = new THREE.DirectionalLight(0xfff5ea, 2.2);
    sunLight.position.set(45, 80, 35);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 250;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);
    dirLightRef.current = sunLight;

    // 4. Pasture Terrain Geometry: Outer Prairie Ground + Distinct Rectangular Paddock Box
    // A. Outer Prairie Ground (Surrounding terrain outside the ranch box)
    const outerGeo = new THREE.PlaneGeometry(180, 180);
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0x769371, // Natural prairie sage/earth outside the box
      roughness: 0.95,
      metalness: 0.02,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    outerMesh.rotation.x = -Math.PI / 2;
    outerMesh.position.y = 0;
    outerMesh.receiveShadow = true;
    scene.add(outerMesh);

    // B. The Large Ranch Box Ground (64m x 64m enclosed pasture box from -32 to +32)
    const boxGeo = new THREE.PlaneGeometry(64, 64);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x48bb78, // Vibrant rich pasture green inside the box
      roughness: 0.85,
      metalness: 0.02,
    });
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxMesh.rotation.x = -Math.PI / 2;
    boxMesh.position.y = 0.02;
    boxMesh.receiveShadow = true;
    scene.add(boxMesh);

    // Subtle pasture grid lines inside the 64x64 box
    const gridHelper = new THREE.GridHelper(64, 16, 0x1f4e38, 0x276749);
    gridHelper.position.y = 0.03;
    scene.add(gridHelper);

    // 5. Build Ranch Structures (Barn, Trough, Fences, Gates)
    buildRanchStructures(scene);

    // 6. Camera Stations (Real CCTV Security Poles)
    buildCameraBeacons(scene);

    // 7. Event Listeners for Drone Orbit Navigation
    setupOrbitEvents(container);

    // 8. Animation Loop
    let animationId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Camera smooth lerp
      updateCameraLerp(delta);

      // Pulse beacon rings
      updateBeaconsAnimation(time);

      // Animate trajectory trail if breach active
      updateTrajectoryAnimation(time);

      renderer.render(scene, camera);
    };

    animate();

    // Handle Resize with ResizeObserver for responsive viewMode switches
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Sun & Ambient Lighting based on simulated time - ALWAYS highly visible!
  useEffect(() => {
    if (!dirLightRef.current || !ambLightRef.current || !sceneRef.current) return;
    const hours = timeMinutes / 60; // 0 to 24

    // Day/Night calculations - Clear outdoor visibility at all times!
    let sunIntensity = 2.2;
    let skyColor = 0x7bc5f9; // Crisp blue sky
    let sunColor = 0xfff5ea;
    let ambColor = 0xdcfce7;

    if (hours >= 6 && hours < 8) {
      // Dawn / Sunrise
      sunIntensity = 1.9;
      skyColor = 0x93c5fd;
      sunColor = 0xfde68a;
      ambColor = 0xfef3c7;
    } else if (hours >= 8 && hours < 17) {
      // Full Daylight
      sunIntensity = 2.4;
      skyColor = 0x7bc5f9;
      sunColor = 0xffffff;
      ambColor = 0xdcfce7;
    } else if (hours >= 17 && hours < 19.5) {
      // Dusk / Sunset (Curfew window)
      sunIntensity = 2.0;
      skyColor = 0xfb923c;
      sunColor = 0xf97316; // Warm golden sunset
      ambColor = 0xfed7aa;
    } else {
      // Night Curfew Surveillance: clear, bright moonlit view (NOT pitch black!)
      sunIntensity = 1.5;
      skyColor = 0x1e293b; // Deep slate navy sky
      sunColor = 0x93c5fd; // Bright cool moonlight
      ambColor = 0x475569;
    }

    dirLightRef.current.intensity = sunIntensity;
    dirLightRef.current.color.setHex(sunColor);
    ambLightRef.current.color.setHex(ambColor);
    sceneRef.current.background.setHex(skyColor);
    if (sceneRef.current.fog) {
      sceneRef.current.fog.color.setHex(skyColor);
    }

    // Sun position arc
    const sunAngle = ((hours - 6) / 12) * Math.PI;
    const sunX = Math.cos(sunAngle) * 70;
    const sunY = Math.max(25, Math.sin(sunAngle) * 75);
    dirLightRef.current.position.set(sunX, sunY, 30);
  }, [timeMinutes]);

  // Update Cattle 3D Entities on pasture
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    cattle.forEach((cow) => {
      let meshGroup = cattleMeshesRef.current.get(cow.id);

      if (!meshGroup) {
        meshGroup = createCattleMesh(cow);
        scene.add(meshGroup);
        cattleMeshesRef.current.set(cow.id, meshGroup);
      }

      // Smooth position lerp
      meshGroup.position.lerp(new THREE.Vector3(cow.x, 0.4, cow.z), 0.2);
      meshGroup.rotation.y = THREE.MathUtils.lerp(meshGroup.rotation.y, cow.rotation, 0.15);

      // Highlight missing cattle if breach active
      const bodyMesh = meshGroup.getObjectByName('cowBody');
      const tagLight = meshGroup.getObjectByName('tagLight');

      if (ranchStatus === 'BREACH' && cow.isMissingCandidate) {
        if (bodyMesh) bodyMesh.material.emissive.setHex(0xef4444);
        if (tagLight) tagLight.visible = true;
      } else {
        if (bodyMesh) bodyMesh.material.emissive.setHex(0x000000);
        if (tagLight) tagLight.visible = false;
      }
    });
  }, [cattle, ranchStatus]);

  // Dynamic Breach Trajectory Vector Trail
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (ranchStatus === 'BREACH') {
      if (!trajectoryLineRef.current) {
        // Curve from Central Ranch Pathway -> South-East Fence Door -> Highway 81
        const curvePoints = [
          new THREE.Vector3(0, 0.6, -10),      // Central Ranch Pathway
          new THREE.Vector3(10, 0.6, 2),       // Pasture Transit Corridor
          new THREE.Vector3(20, 0.6, 12),      // Approach toward Fence Door
          new THREE.Vector3(32, 0.6, 18),      // CAM-04 East Fence Door Breach
          new THREE.Vector3(40, 0.6, 20),      // Outside the Box onto Highway 81
        ];

        const curve = new THREE.CatmullRomCurve3(curvePoints);
        const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.25, 8, false);
        const tubeMat = new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xef4444,
          emissiveIntensity: 0.8,
          roughness: 0.2,
          transparent: true,
          opacity: 0.85,
        });

        const trajectoryMesh = new THREE.Mesh(tubeGeo, tubeMat);
        scene.add(trajectoryMesh);
        trajectoryLineRef.current = trajectoryMesh;

        // Add breadcrumb pings
        curvePoints.forEach((pt, i) => {
          const pingGeo = new THREE.RingGeometry(0.3, 0.8, 16);
          const pingMat = new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
          });
          const pingMesh = new THREE.Mesh(pingGeo, pingMat);
          pingMesh.rotation.x = -Math.PI / 2;
          pingMesh.position.copy(pt).setY(0.2);
          scene.add(pingMesh);
        });
      }
    } else {
      if (trajectoryLineRef.current) {
        scene.remove(trajectoryLineRef.current);
        trajectoryLineRef.current.geometry.dispose();
        trajectoryLineRef.current.material.dispose();
        trajectoryLineRef.current = null;
      }
    }
  }, [ranchStatus]);

  // Handle Camera Fly-to when selectedCamera changes
  useEffect(() => {
    if (!controlsRef.current) return;
    const ctrl = controlsRef.current;

    if (selectedCamera) {
      soundManager.playFlyWhoosh();
      const [cx, cy, cz] = selectedCamera.pos;
      // Position drone camera slightly elevated and angled toward camera focus
      ctrl.desiredCamPos.set(cx + 8, cy + 12, cz + 10);
      ctrl.targetLookAt.set(cx, 0, cz);
    } else {
      // Reset to overview drone perspective
      ctrl.desiredCamPos.set(45, 48, 48);
      ctrl.targetLookAt.set(0, 0, 0);
    }
  }, [selectedCamera]);

  // Smooth Camera Lerp Update
  const updateCameraLerp = (delta) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const ctrl = controlsRef.current;

    // Smoothly step position and lookAt target
    camera.position.lerp(ctrl.desiredCamPos, 0.05);
    ctrl.target.lerp(ctrl.targetLookAt, 0.05);
    camera.lookAt(ctrl.target);

    // Update HUD telemetry
    setHudStats((prev) => ({
      ...prev,
      alt: Math.round(camera.position.y),
      heading: Math.round(((Math.atan2(camera.position.x, camera.position.z) * 180) / Math.PI + 360) % 360),
    }));
  };

  // Camera Station Status LEDs & Ground Field-of-View Surveillance Cone Animation
  const updateBeaconsAnimation = (time) => {
    beaconsRef.current.forEach((stationGroup) => {
      const led = stationGroup.getObjectByName('camLed');
      const groundFov = stationGroup.getObjectByName('groundFov');
      const isBreach = stationGroup.userData.id === 'CAM-04' && ranchStatus === 'BREACH';

      if (led) {
        if (isBreach) {
          led.material.color.setHex(Math.sin(time * 8) > 0 ? 0xff0000 : 0x450a0a);
        } else {
          led.material.color.setHex(0x00d26a);
        }
      }

      if (groundFov) {
        if (isBreach) {
          groundFov.material.color.setHex(0xef4444);
          groundFov.material.opacity = 0.28 + Math.sin(time * 4) * 0.12;
        } else {
          groundFov.material.color.setHex(0x10b981);
          groundFov.material.opacity = 0.18 + Math.sin(time * 2) * 0.05;
        }
      }
    });

    // Spin rustic ranch windmill fan blades
    if (windmillBladesRef.current) {
      windmillBladesRef.current.rotation.z += 0.015;
    }
  };

  const updateTrajectoryAnimation = (time) => {
    if (trajectoryLineRef.current) {
      const pulse = 0.6 + Math.sin(time * 6) * 0.4;
      trajectoryLineRef.current.material.opacity = pulse;
    }
  };

  // Build Low-Poly Cattle Entity
  const createCattleMesh = (cow) => {
    const group = new THREE.Group();
    group.name = cow.id;

    // Body
    const bodyGeo = new THREE.BoxGeometry(1.6, 0.9, 0.9);
    const isSpecial = cow.id === 'COW-12' || cow.id === 'COW-19';
    const bodyMat = new THREE.MeshStandardMaterial({
      color: isSpecial ? 0x854d0e : 0x3f2e22, // Black Angus / Dark Chestnut
      roughness: 0.9,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.name = 'cowBody';
    bodyMesh.position.y = 0.55;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Head
    const headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x271c16, roughness: 0.9 });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0.9, 0.75, 0);
    headMesh.castShadow = true;
    group.add(headMesh);

    // Muzzle
    const muzzleGeo = new THREE.BoxGeometry(0.3, 0.3, 0.4);
    const muzzleMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 });
    const muzzleMesh = new THREE.Mesh(muzzleGeo, muzzleMat);
    muzzleMesh.position.set(1.2, 0.65, 0);
    group.add(muzzleMesh);

    // 4 Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.55, 0.2);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1f1611, roughness: 0.9 });
    const legPositions = [
      [0.6, 0.25, 0.3],
      [0.6, 0.25, -0.3],
      [-0.6, 0.25, 0.3],
      [-0.6, 0.25, -0.3],
    ];
    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(...pos);
      leg.castShadow = true;
      group.add(leg);
    });

    // RFID ear tag glowing marker (green normal, red breach)
    const tagGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const tagMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tagLight = new THREE.Mesh(tagGeo, tagMat);
    tagLight.name = 'tagLight';
    tagLight.position.set(0.9, 1.05, 0.3);
    tagLight.visible = false;
    group.add(tagLight);

    group.position.set(cow.x, 0, cow.z);
    group.scale.set(0.7, 0.7, 0.7);
    return group;
  };

  // Build 3D Ranch Structures: The Large Box, NW Big Shelter, NE Drinking Station + Pathway, SW Gate, SE Highway Door
  const buildRanchStructures = (scene) => {
    const roadMat = new THREE.MeshStandardMaterial({ color: 0xc29363, roughness: 0.95 }); // Warm sandy ranch dirt
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }); // Dark treated timber
    const brokenFenceMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 });

    // =========================================================================
    // 1. THE LARGE BOX PERIMETER FENCE (64m x 64m enclosing the paddock)
    // Encloses X in [-32, +32], Z in [-32, +32]
    // =========================================================================
    // 4 Heavy Corner Posts
    const cornerPosts = [
      [-32, -32],
      [32, -32],
      [-32, 32],
      [32, 32],
    ];
    cornerPosts.forEach(([cx, cz]) => {
      const cPost = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.8, 0.5), fenceMat);
      cPost.position.set(cx, 1.4, cz);
      cPost.castShadow = true;
      scene.add(cPost);
    });

    // North Fence Line (z = -32, from x = -32 to 32)
    for (let x = -32; x <= 32; x += 4) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.2, 6), fenceMat);
      post.position.set(x, 1.1, -32);
      post.castShadow = true;
      scene.add(post);
      if (x < 32) {
        const r1 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 0.12), fenceMat);
        r1.position.set(x + 2, 0.7, -32);
        const r2 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 0.12), fenceMat);
        r2.position.set(x + 2, 1.3, -32);
        scene.add(r1, r2);
      }
    }

    // West Fence Line (x = -32, from z = -32 to 32)
    for (let z = -32; z <= 32; z += 4) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.2, 6), fenceMat);
      post.position.set(-32, 1.1, z);
      post.castShadow = true;
      scene.add(post);
      if (z < 32) {
        const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 4.2), fenceMat);
        r1.position.set(-32, 0.7, z + 2);
        const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 4.2), fenceMat);
        r2.position.set(-32, 1.3, z + 2);
        scene.add(r1, r2);
      }
    }

    // South Fence Line (z = 32, from x = -32 to 32)
    for (let x = -32; x <= 32; x += 4) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.2, 6), fenceMat);
      post.position.set(x, 1.1, 32);
      post.castShadow = true;
      scene.add(post);
      if (x < 32) {
        const r1 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 0.12), fenceMat);
        r1.position.set(x + 2, 0.7, 32);
        const r2 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.1, 0.12), fenceMat);
        r2.position.set(x + 2, 1.3, 32);
        scene.add(r1, r2);
      }
    }

    // East Fence Line (x = 32, from z = -32 to 32)
    // NOTE: Between z = 13 and z = 23 is the "DOOR" / BREACH GAP!
    for (let z = -32; z <= 32; z += 4) {
      const isDoorSpot = z >= 13 && z <= 23;
      if (isDoorSpot) {
        // Tilted broken/open post at the door opening
        if (z === 16) {
          const brokenPost = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 2.4, 6), brokenFenceMat);
          brokenPost.position.set(32.4, 0.45, 16);
          brokenPost.rotation.z = 0.65;
          brokenPost.rotation.x = 0.35;
          brokenPost.castShadow = true;
          scene.add(brokenPost);

          // Crushed wire mesh flattened on the ground in the doorway
          const meshWire = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 2.5),
            new THREE.MeshStandardMaterial({ color: 0x64748b, wireframe: true })
          );
          meshWire.rotation.x = -Math.PI / 2;
          meshWire.position.set(33, 0.04, 18);
          scene.add(meshWire);
        }
      } else {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.2, 6), fenceMat);
        post.position.set(32, 1.1, z);
        post.castShadow = true;
        scene.add(post);

        if (z < 32 && !(z >= 12 && z < 24)) {
          const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 4.2), fenceMat);
          r1.position.set(32, 0.7, z + 2);
          const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 4.2), fenceMat);
          r2.position.set(32, 1.3, z + 2);
          scene.add(r1, r2);
        }
      }
    }

    // =========================================================================
    // 2. CORNER 1 (NORTH-WEST): BIG SHELTER BARN (CAM-02 Area) at [-20, 0, -20]
    // =========================================================================
    const barnGroup = new THREE.Group();
    barnGroup.position.set(-20, 0, -20);

    const timberMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const timberDarkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const metalRoofMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.65, roughness: 0.35 });
    const strawMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.95 });
    const steelTubingMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.7, roughness: 0.3 });

    // A. Golden Straw Bedding Floor across the barn interior (18m x 14m)
    const strawFloor = new THREE.Mesh(new THREE.BoxGeometry(18, 0.15, 14), strawMat);
    strawFloor.position.set(0, 0.075, 0);
    strawFloor.receiveShadow = true;
    barnGroup.add(strawFloor);

    // B. Weathered Timber Back Wall (z = -6.85, facing North fence)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(18, 5.5, 0.3), timberMat);
    backWall.position.set(0, 2.75, -6.85);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    barnGroup.add(backWall);

    // C. Weathered Timber Left Side Wall (x = -8.85, facing West fence)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5.5, 14), timberMat);
    leftWall.position.set(-8.85, 2.75, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    barnGroup.add(leftWall);

    // D. 6 Heavy Vertical Timber Structural Poles (South front & East side are OPEN!)
    const barnPosts = [
      [-8.85, 3.1, 6.85],
      [0, 3.1, 6.85],
      [8.85, 3.1, 6.85],
      [-8.85, 3.1, -6.85],
      [0, 3.1, -6.85],
      [8.85, 3.1, -6.85],
    ];
    barnPosts.forEach(([px, py, pz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 6.2, 8), timberDarkMat);
      pole.position.set(px, py, pz);
      pole.castShadow = true;
      pole.receiveShadow = true;
      barnGroup.add(pole);

      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.4, 0.14), timberDarkMat);
      brace.position.set(px > 0 ? px - 0.45 : px + 0.45, py + 2.3, pz);
      brace.rotation.z = px > 0 ? 0.78 : -0.78;
      barnGroup.add(brace);
    });

    // E. Heavy Horizontal Timber Header Beams & Cross Rafters
    const frontBeam = new THREE.Mesh(new THREE.BoxGeometry(18.4, 0.38, 0.38), timberMat);
    frontBeam.position.set(0, 6.2, 6.85);
    frontBeam.castShadow = true;
    barnGroup.add(frontBeam);

    const backBeam = new THREE.Mesh(new THREE.BoxGeometry(18.4, 0.38, 0.38), timberMat);
    backBeam.position.set(0, 5.4, -6.85);
    backBeam.castShadow = true;
    barnGroup.add(backBeam);

    [-8.85, -4.4, 0, 4.4, 8.85].forEach((rx) => {
      const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 14.2), timberMat);
      rafter.position.set(rx, 5.8, 0);
      rafter.rotation.x = 0.057;
      rafter.castShadow = true;
      barnGroup.add(rafter);
    });

    // F. Broad Pitched Corrugated Galvanized Steel Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(19.5, 0.18, 15.2), metalRoofMat);
    roof.position.set(0, 6.0, 0);
    roof.rotation.x = 0.057;
    roof.castShadow = true;
    roof.receiveShadow = true;
    barnGroup.add(roof);

    // G. Interior Tubular Steel Corral Pen Dividers
    for (let h = 0.6; h <= 1.8; h += 0.55) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 13.5, 6), steelTubingMat);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(0, h, 0);
      rail.castShadow = true;
      barnGroup.add(rail);
    }

    // H. Hay Feed Bunk along Back Wall
    const feedBunk = new THREE.Mesh(new THREE.BoxGeometry(14, 0.9, 1.2), steelTubingMat);
    feedBunk.position.set(0, 0.45, -5.8);
    feedBunk.castShadow = true;
    const hayInBunk = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.4, 0.9), strawMat);
    hayInBunk.position.set(0, 0.85, -5.8);
    barnGroup.add(feedBunk, hayInBunk);

    // I. Resting Cattle Inside Shelter Barn
    [
      { x: -4, z: 1, rot: 0.3 },
      { x: -5, z: -2, rot: -0.4 },
      { x: 3, z: 2, rot: 0.8 },
      { x: 4, z: -3, rot: -0.6 },
    ].forEach((c) => {
      const cowMesh = new THREE.Group();
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.65, 0.9), new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9 }));
      bMesh.position.y = 0.35;
      bMesh.castShadow = true;
      cowMesh.add(bMesh);
      const hMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 }));
      hMesh.position.set(0.9, 0.55, 0);
      cowMesh.add(hMesh);
      cowMesh.position.set(c.x, 0, c.z);
      cowMesh.rotation.y = c.rot;
      barnGroup.add(cowMesh);
    });

    scene.add(barnGroup);

    // =========================================================================
    // 3. CORNER 2 (ADJACENT NORTH-EAST): DRINKING STATION (CAM-01 Area) at [20, 0, -20]
    // =========================================================================
    const troughGroup = new THREE.Group();
    troughGroup.position.set(20, 0, -20);

    // A. Dark Moist Mud / Soil Perimeter around trough
    const mudMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 });
    const mudBed = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.05, 4.8), mudMat);
    mudBed.position.y = 0.025;
    mudBed.receiveShadow = true;
    troughGroup.add(mudBed);

    // B. Long Poured-Concrete Stock Tank (14m x 2.4m x 1.1m)
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.88 });
    const troughGeo = new THREE.BoxGeometry(14, 1.1, 2.4);
    const troughMesh = new THREE.Mesh(troughGeo, concreteMat);
    troughMesh.position.y = 0.55;
    troughMesh.castShadow = true;
    troughMesh.receiveShadow = true;
    troughGroup.add(troughMesh);

    // C. Clean Turquoise-Blue Water Surface with Reflection
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.85,
      transparent: true,
      opacity: 0.88,
    });
    const waterGeo = new THREE.PlaneGeometry(13.4, 1.95);
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = 1.05;
    troughGroup.add(waterMesh);

    // D. Red Float Valve Assembly
    const valve = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.35), new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.7 }));
    valve.position.set(-6.5, 1.15, 0);
    troughGroup.add(valve);

    // E. Mineral Salt Lick Blocks
    const saltMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9 });
    const saltBlock = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.9), saltMat);
    saltBlock.position.set(7.8, 0.4, 0);
    saltBlock.castShadow = true;
    troughGroup.add(saltBlock);

    scene.add(troughGroup);

    // F. Standalone Windmill in NE Corner (at [26, 0, -27] BEHIND trough - NO CLIPPING!)
    const windmillGroup = new THREE.Group();
    windmillGroup.position.set(26, 0, -27);

    const legMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
    [
      [-1.2, 5.5, -1.2],
      [1.2, 5.5, -1.2],
      [-1.2, 5.5, 1.2],
      [1.2, 5.5, 1.2],
    ].forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 11, 6), legMat);
      leg.position.set(lx, ly, lz);
      leg.castShadow = true;
      windmillGroup.add(leg);
    });

    [3.5, 7.0, 10.5].forEach((sy) => {
      const strut1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.08), legMat);
      strut1.position.set(0, sy, 1.2);
      const strut2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.08), legMat);
      strut2.position.set(0, sy, -1.2);
      windmillGroup.add(strut1, strut2);
    });

    const headPlatform = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.5), legMat);
    headPlatform.position.y = 11.2;
    windmillGroup.add(headPlatform);

    const fanGroup = new THREE.Group();
    fanGroup.position.set(0, 11.2, 0.85);

    const hubMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12), hubMat);
    hub.rotation.x = Math.PI / 2;
    fanGroup.add(hub);

    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6, roughness: 0.3 });
    for (let b = 0; b < 12; b++) {
      const angle = (b / 12) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 0.03), bladeMat);
      blade.position.set(Math.cos(angle) * 1.3, Math.sin(angle) * 1.3, 0);
      blade.rotation.z = angle;
      fanGroup.add(blade);
    }
    windmillGroup.add(fanGroup);
    windmillBladesRef.current = fanGroup;

    const tailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.2, 2.5), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 }));
    tailMesh.position.set(0, 11.2, -1.6);
    windmillGroup.add(tailMesh);
    scene.add(windmillGroup);

    // G. Live Oak Trees providing natural shade in the NE quadrant
    const oakWoodMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9 });
    const oakLeavesMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });
    [
      { x: 10, z: -27, scale: 1.1 },
      { x: 28, z: -14, scale: 1.0 },
    ].forEach((tree) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(tree.x, 0, tree.z);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 4.5, 7), oakWoodMat);
      trunk.position.y = 2.25;
      trunk.castShadow = true;
      treeGroup.add(trunk);
      const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4), oakLeavesMat);
      canopy.position.y = 5.2;
      canopy.castShadow = true;
      treeGroup.add(canopy);
      treeGroup.scale.set(tree.scale, tree.scale, tree.scale);
      scene.add(treeGroup);
    });

    // =========================================================================
    // 4. PATHWAYS: DIRECT PATHWAY FROM SHELTER TO DRINKING STATION & CENTRAL TRAIL
    // =========================================================================
    // A. Direct straight pathway from Shelter Barn (NW) to Drinking Station (NE) along z = -20
    const roadShelterToTrough = new THREE.Mesh(new THREE.PlaneGeometry(28, 6), roadMat);
    roadShelterToTrough.rotation.x = -Math.PI / 2;
    roadShelterToTrough.position.set(0, 0.025, -20);
    roadShelterToTrough.receiveShadow = true;
    scene.add(roadShelterToTrough);

    // B. Central Southbound Pathway from (0, -20) down through pasture to z = 18
    const centralRoad = new THREE.Mesh(new THREE.PlaneGeometry(6, 38), roadMat);
    centralRoad.rotation.x = -Math.PI / 2;
    centralRoad.position.set(0, 0.025, -1);
    centralRoad.receiveShadow = true;
    scene.add(centralRoad);

    // C. Pathway branch heading West toward CAM-03 Gateway at [-18, 0, 18]
    const roadToGate = new THREE.Mesh(new THREE.PlaneGeometry(18, 6), roadMat);
    roadToGate.rotation.x = -Math.PI / 2;
    roadToGate.position.set(-9, 0.025, 18);
    roadToGate.receiveShadow = true;
    scene.add(roadToGate);

    // D. Pathway branch heading East toward the Fence Door at [32, 0, 18]
    const roadToDoor = new THREE.Mesh(new THREE.PlaneGeometry(32, 6), roadMat);
    roadToDoor.rotation.x = -Math.PI / 2;
    roadToDoor.position.set(16, 0.025, 18);
    roadToDoor.receiveShadow = true;
    scene.add(roadToDoor);

    // E. Trampled dirt path through the door OUTSIDE THE BOX directly onto Highway 81
    const roadToHwy = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), roadMat);
    roadToHwy.rotation.x = -Math.PI / 2;
    roadToHwy.position.set(36, 0.025, 18);
    roadToHwy.receiveShadow = true;
    scene.add(roadToHwy);

    // =========================================================================
    // 5. CORNER 3 / ON THE PATHWAY (SOUTH-WEST): CAM-03 GATEWAY at [-18, 0, 18]
    // =========================================================================
    const gateGroup = new THREE.Group();
    gateGroup.position.set(-18, 0, 18);

    const darkPostMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.9 });
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.8, 0.7), darkPostMat);
    pillarL.position.set(0, 1.9, -3.4);
    pillarL.castShadow = true;
    const pillarR = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.8, 0.7), darkPostMat);
    pillarR.position.set(0, 1.9, 3.4);
    pillarR.castShadow = true;
    gateGroup.add(pillarL, pillarR);

    // Overhead Ranch Archway Signboard
    const archBar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 7.5), darkPostMat);
    archBar.position.set(0, 4.0, 0);
    const archSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.9, 5.5),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 })
    );
    archSign.position.set(0, 4.7, 0);
    gateGroup.add(archBar, archSign);

    // Cattle Guard Metal Grating across the roadway
    const grateMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.3 });
    const grate = new THREE.Mesh(new THREE.PlaneGeometry(4, 6.2), grateMat);
    grate.rotation.x = -Math.PI / 2;
    grate.position.set(0, 0.035, 0);
    gateGroup.add(grate);

    // 5-Rail Galvanized Steel Pipe Gate
    for (let r = 0.5; r <= 2.5; r += 0.5) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 6.4, 6), steelTubingMat);
      rail.position.set(0.05, r, 0);
      gateGroup.add(rail);
    }
    scene.add(gateGroup);

    // =========================================================================
    // 6. CORNER 4 / OPPOSITE TO SHELTER (SOUTH-EAST): HIGHWAY 81 OUTSIDE THE BOX
    // Runs outside the box at x = 40 from z = -45 to +45
    // =========================================================================
    const hwyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const hwy = new THREE.Mesh(new THREE.PlaneGeometry(9, 90), hwyMat);
    hwy.rotation.x = -Math.PI / 2;
    hwy.position.set(40, 0.02, 0);
    hwy.receiveShadow = true;
    scene.add(hwy);

    // Double Solid Yellow Center Line down Highway 81
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffe600 });
    const stripe1 = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 88), stripeMat);
    stripe1.rotation.x = -Math.PI / 2;
    stripe1.position.set(39.85, 0.03, 0);
    const stripe2 = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 88), stripeMat);
    stripe2.rotation.x = -Math.PI / 2;
    stripe2.position.set(40.15, 0.03, 0);
    scene.add(stripe1, stripe2);

    // White Shoulder Lines
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const whiteLineL = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 88), whiteLineMat);
    whiteLineL.rotation.x = -Math.PI / 2;
    whiteLineL.position.set(35.8, 0.03, 0);
    const whiteLineR = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 88), whiteLineMat);
    whiteLineR.rotation.x = -Math.PI / 2;
    whiteLineR.position.set(44.2, 0.03, 0);
    scene.add(whiteLineL, whiteLineR);

    // Highway 81 Green Sign beside the road
    const hwySignGroup = new THREE.Group();
    hwySignGroup.position.set(45.5, 0, 10);
    const hwyPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.6, 6), legMat);
    hwyPost.position.y = 1.8;
    const hwyBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 1.2, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x007a3d, roughness: 0.5 })
    );
    hwyBoard.position.y = 3.0;
    hwySignGroup.add(hwyPost, hwyBoard);
    scene.add(hwySignGroup);

    // Hazard Warning Sentry Marker at the Door Breach (at [32, 0, 18])
    const breachSignGroup = new THREE.Group();
    breachSignGroup.position.set(32.5, 0, 14);
    const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.4, 6), fenceMat);
    signPost.position.y = 1.2;
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.9, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.4 })
    );
    signBoard.position.y = 2.2;
    breachSignGroup.add(signPost, signBoard);
    scene.add(breachSignGroup);
  };

  // Build the 4 Real CCTV Security Camera Stations (Real Ranch CCTV Poles - NOT satellites!)
  const buildCameraBeacons = (scene) => {
    // Exact aiming angles toward the 4 distinct corners/stations
    const camAngles = {
      'CAM-01': Math.PI * 0.75,  // Faces NE toward Water Trough
      'CAM-02': -Math.PI * 0.75, // Faces NW toward Shelter Barn
      'CAM-03': -Math.PI * 0.25, // Faces SW toward Gateway on Pathway
      'CAM-04': Math.PI * 0.25,  // Faces SE toward Fence Door & Highway 81
    };

    cameras.forEach((cam) => {
      const stationGroup = new THREE.Group();
      stationGroup.position.set(...cam.pos);
      stationGroup.userData = { id: cam.id, camera: cam };

      const rotationY = camAngles[cam.id] || 0;

      // 1. Concrete Ground Pad
      const basePad = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.6, 0.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 })
      );
      basePad.position.y = 0.1;
      basePad.receiveShadow = true;
      stationGroup.add(basePad);

      // 2. Heavy-Duty Galvanized/Timber Utility Pole (Height 4.5m)
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, 4.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.4, roughness: 0.6 })
      );
      pole.position.y = 2.25;
      pole.castShadow = true;
      pole.receiveShadow = true;
      stationGroup.add(pole);

      // 3. Weatherproof NEMA Power / Solar Junction Box
      const junctionBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.5, 0.28),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.2, roughness: 0.5 })
      );
      junctionBox.position.set(0, 1.8, 0.15);
      junctionBox.castShadow = true;
      stationGroup.add(junctionBox);

      // 4. CCTV Camera Assembly (Mounting Arm + Industrial Bullet CCTV Camera)
      const camAssembly = new THREE.Group();
      camAssembly.position.set(0, 4.2, 0);
      camAssembly.rotation.y = rotationY;

      // Horizontal Extension Bracket Arm
      const mountArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 })
      );
      mountArm.rotation.x = Math.PI / 2;
      mountArm.position.set(0, 0, 0.4);
      camAssembly.add(mountArm);

      // Bullet CCTV Housing Group (angled downward ~25 degrees looking at pasture)
      const cameraHousing = new THREE.Group();
      cameraHousing.position.set(0, -0.05, 0.8);
      cameraHousing.rotation.x = 0.42; // Tilted downward looking at ground

      // Main Bullet Body (White powdercoat)
      const camBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.65, 12),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.2 })
      );
      camBody.rotation.x = Math.PI / 2;
      camBody.castShadow = true;
      cameraHousing.add(camBody);

      // Sun Shade / Weather Visor
      const visor = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.04, 0.72),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
      );
      visor.position.set(0, 0.12, 0.02);
      cameraHousing.add(visor);

      // Dark Front Bezel & Camera Lens
      const lensBezel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.04, 12),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.9 })
      );
      lensBezel.rotation.x = Math.PI / 2;
      lensBezel.position.set(0, 0, 0.34);
      cameraHousing.add(lensBezel);

      // Glass Lens Core
      const lensGlass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.95 })
      );
      lensGlass.rotation.x = Math.PI / 2;
      lensGlass.position.set(0, 0, 0.36);
      cameraHousing.add(lensGlass);

      // Status LED (Green recording / Red alert)
      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        new THREE.MeshBasicMaterial({ color: cam.id === 'CAM-04' ? 0xef4444 : 0x00d26a })
      );
      led.name = 'camLed';
      led.position.set(0, -0.1, 0.33);
      cameraHousing.add(led);

      // Wireless Dipole Antenna on Rear
      const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.35, 4),
        new THREE.MeshStandardMaterial({ color: 0x0f172a })
      );
      antenna.position.set(0, 0.15, -0.28);
      antenna.rotation.x = -0.3;
      cameraHousing.add(antenna);

      camAssembly.add(cameraHousing);
      stationGroup.add(camAssembly);

      // 5. Realistic Surveillance Field-of-View (FOV) on the Ground
      // A flat ground sector fan showing the camera's actual lens coverage zone
      const fovRadius = cam.id === 'CAM-04' ? 16 : 14;
      const fovAngle = Math.PI / 3; // 60 degree camera FOV
      const fovGeo = new THREE.CircleGeometry(fovRadius, 24, rotationY - fovAngle / 2 + Math.PI / 2, fovAngle);
      const fovMat = new THREE.MeshBasicMaterial({
        color: cam.id === 'CAM-04' ? 0xef4444 : 0x10b981,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
      });
      const groundFov = new THREE.Mesh(fovGeo, fovMat);
      groundFov.name = 'groundFov';
      groundFov.rotation.x = -Math.PI / 2;
      groundFov.position.y = 0.03; // Just above pasture grass
      stationGroup.add(groundFov);

      // 6. Floating Comic Camera Badge Sprite/Tag
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 96;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(8, 8, 240, 80, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = cam.id === 'CAM-04' ? '#FF3B30' : '#FFE600';
      ctx.beginPath();
      ctx.roundRect(14, 14, 60, 68, 10);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 36px monospace';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cam.id.slice(-2), 44, 48);

      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(cam.id, 86, 38);
      ctx.font = '18px monospace';
      ctx.fillStyle = '#4B5563';
      ctx.fillText('CCTV SENTRY', 86, 64);

      const badgeTexture = new THREE.CanvasTexture(canvas);
      const badgeMat = new THREE.SpriteMaterial({ map: badgeTexture, transparent: true });
      const badgeSprite = new THREE.Sprite(badgeMat);
      badgeSprite.position.set(0, 5.2, 0);
      badgeSprite.scale.set(3.5, 1.3, 1);
      stationGroup.add(badgeSprite);

      scene.add(stationGroup);
      beaconsRef.current.push(stationGroup);
    });
  };

  // Setup Mouse Orbit & Raycasting for Interactive Beacon Clicks
  const setupOrbitEvents = (container) => {
    const ctrl = controlsRef.current;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e) => {
      ctrl.isDragging = true;
      ctrl.prevMouseX = e.clientX;
      ctrl.prevMouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (!ctrl.isDragging) return;
      const deltaX = e.clientX - ctrl.prevMouseX;
      const deltaY = e.clientY - ctrl.prevMouseY;
      ctrl.prevMouseX = e.clientX;
      ctrl.prevMouseY = e.clientY;

      // Orbit angles
      ctrl.spherical.theta -= deltaX * 0.006;
      ctrl.spherical.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, ctrl.spherical.phi - deltaY * 0.006));

      // Calculate new desired position
      const sinPhiRadius = ctrl.spherical.radius * Math.sin(ctrl.spherical.phi);
      ctrl.desiredCamPos.x = ctrl.targetLookAt.x + sinPhiRadius * Math.sin(ctrl.spherical.theta);
      ctrl.desiredCamPos.y = ctrl.targetLookAt.y + ctrl.spherical.radius * Math.cos(ctrl.spherical.phi);
      ctrl.desiredCamPos.z = ctrl.targetLookAt.z + sinPhiRadius * Math.cos(ctrl.spherical.theta);
    };

    const onMouseUp = (e) => {
      ctrl.isDragging = false;
      // Detect clicks on beacons
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (cameraRef.current) {
        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObjects(beaconsRef.current, true);

        if (intersects.length > 0) {
          let rootGroup = intersects[0].object;
          while (rootGroup.parent && !rootGroup.userData?.id) {
            rootGroup = rootGroup.parent;
          }
          if (rootGroup.userData?.camera) {
            handleBeaconClick(rootGroup.userData.camera);
          }
        }
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      ctrl.spherical.radius = Math.max(15, Math.min(100, ctrl.spherical.radius + e.deltaY * 0.05));
      const sinPhiRadius = ctrl.spherical.radius * Math.sin(ctrl.spherical.phi);
      ctrl.desiredCamPos.x = ctrl.targetLookAt.x + sinPhiRadius * Math.sin(ctrl.spherical.theta);
      ctrl.desiredCamPos.y = ctrl.targetLookAt.y + ctrl.spherical.radius * Math.cos(ctrl.spherical.phi);
      ctrl.desiredCamPos.z = ctrl.targetLookAt.z + sinPhiRadius * Math.cos(ctrl.spherical.theta);
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
  };

  const handleBeaconClick = (cam) => {
    soundManager.playLockBeep();
    setSelectedCamera(cam);
    if (onCameraSelect) {
      onCameraSelect(cam);
    }
  };

  const resetDroneView = () => {
    soundManager.playLockBeep();
    setSelectedCamera(null);
  };

  return (
    <div className="relative w-full h-full bg-ranch-dark overflow-hidden">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Drone Tactical Crosshairs Reticle */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="relative w-48 h-48 border border-black/20 rounded-full flex items-center justify-center">
          <div className="w-16 h-16 border-t border-b border-black/40" />
          <div className="absolute w-16 h-16 border-l border-r border-black/40" />
          <div className="absolute w-2.5 h-2.5 bg-[#FF3B30] rounded-full border border-black shadow-sm" />
        </div>
      </div>

      {/* Top Left: Drone Flight HUD Telemetry */}
      <div className="absolute top-4 left-4 pointer-events-auto bg-white border-3 border-black rounded-2xl p-3 text-xs font-mono shadow-comic space-y-2 min-w-[220px] text-black">
        <div className="flex items-center justify-between border-b-2 border-black pb-1.5 font-bold">
          <span className="flex items-center gap-1.5 text-black font-comic text-xs">
            <Navigation className="w-3.5 h-3.5 text-[#00D26A] animate-spin" style={{ animationDuration: '6s' }} />
            DRONE SENTINEL-01
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#00D26A] text-black border border-black font-black">
            AIRBORNE
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-0.5">
          <div className="bg-[#FAF7F0] p-1.5 rounded-lg border border-black">
            <span className="text-neutral-600 text-[9px] font-bold block">ALTITUDE</span>
            <p className="text-black font-black text-xs">{hudStats.alt}m AGL</p>
          </div>
          <div className="bg-[#FAF7F0] p-1.5 rounded-lg border border-black">
            <span className="text-neutral-600 text-[9px] font-bold block">HEADING</span>
            <p className="text-black font-black text-xs">{hudStats.heading}° NNE</p>
          </div>
          <div className="bg-[#FAF7F0] p-1.5 rounded-lg border border-black">
            <span className="text-neutral-600 text-[9px] font-bold block">SPEED</span>
            <p className="text-black font-black text-xs">{hudStats.speed} kts</p>
          </div>
          <div className="bg-[#FAF7F0] p-1.5 rounded-lg border border-black">
            <span className="text-neutral-600 text-[9px] font-bold block">BATTERY</span>
            <p className="text-[#008f47] font-black text-xs">{hudStats.battery}%</p>
          </div>
        </div>

        <div className="pt-1 text-[10px] text-neutral-700 border-t-2 border-black flex justify-between font-bold">
          <span>GPS: {hudStats.lat}</span>
          <span className="text-[#008f47]">LINK: {hudStats.signal}%</span>
        </div>
      </div>

      {/* Top Right: Normal Single Live Perspective Status & Reset Orbit */}
      <div className="absolute top-4 right-4 pointer-events-auto flex items-center gap-2">
        <div className="bg-white border-3 border-black rounded-2xl px-3.5 py-1.5 shadow-comic flex items-center gap-2 text-xs font-comic font-black text-black uppercase">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00D26A] animate-ping" />
          <span>LIVE SURVEILLANCE FEED • 4 CCTV SENTINELS</span>
        </div>

        {selectedCamera && (
          <button
            onClick={resetDroneView}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFE600] border-3 border-black hover:bg-yellow-400 text-black rounded-2xl text-xs font-comic font-black shadow-comic btn-comic active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
            RESET TO ORBIT
          </button>
        )}
      </div>

      {/* Bottom Center: Camera Sentinels Quick Navigator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto bg-white border-3 border-black rounded-2xl p-1.5 shadow-comic flex items-center gap-2 font-mono text-xs text-black">
        <span className="px-2 text-[10px] text-neutral-700 uppercase tracking-wider flex items-center gap-1 font-black font-comic">
          <Camera className="w-4 h-4 text-black stroke-[2.5]" /> CCTV POLES:
        </span>
        {cameras.map((cam) => {
          const isSelected = selectedCamera?.id === cam.id;
          const isBreachZone = cam.id === 'CAM-04' && ranchStatus === 'BREACH';

          return (
            <button
              key={cam.id}
              onClick={() => handleBeaconClick(cam)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border-2 transition-all font-bold btn-comic shadow-comic-sm cursor-pointer ${
                isBreachZone
                  ? 'bg-[#FF3B30] border-black text-white animate-pulse'
                  : isSelected
                  ? 'bg-[#FFE600] border-black text-black'
                  : 'bg-[#FAF7F0] border-black text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full border border-black ${
                  isBreachZone
                    ? 'bg-white'
                    : isSelected
                    ? 'bg-black'
                    : 'bg-[#00D26A]'
                }`}
              />
              <span className="font-comic font-black">{cam.id}</span>
              <span className="hidden sm:inline text-[11px] font-bold text-neutral-700">
                ({cam.name.split(' ')[0]})
              </span>
            </button>
          );
        })}
      </div>

      {/* Breach Alert Dynamic Banner Overlay on 3D View */}
      {ranchStatus === 'BREACH' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none bg-[#FF3B30] text-white font-comic text-xs px-5 py-2 rounded-2xl border-3 border-black shadow-comic-lg flex items-center gap-2 animate-bounce">
          <ShieldAlert className="w-4 h-4 text-yellow-300" />
          <span className="tracking-wide">
            🚨 BREACH VECTOR ACTIVE — 4 MISSING CATTLE HEADING TOWARD HIGHWAY 81
          </span>
        </div>
      )}
    </div>
  );
};
