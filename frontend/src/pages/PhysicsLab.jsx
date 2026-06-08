// PhysicsLab.jsx — 3D WebGL AI Physics Laboratory Chamber
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Zap, Play, Pause, RotateCcw, 
  Sparkles, Activity, Search
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import * as THREE from "three";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const SIMULATIONS = [
  { id: "projectile", name: "3D Projectile Trajectory", icon: "⚡", equation: "y = x tan(θ) - (g x²) / (2 v₀² cos²(θ))", topic: "Kinematics in 2D" },
  { id: "relative", name: "Relative Motion & Frames", icon: "🏃", equation: "v_rel = v_A - v_B", topic: "Frame of Reference" },
  { id: "freedrop", name: "Free Drop Kinematics", icon: "⬇️", equation: "s = 1/2 g t²", topic: "One-Dimensional Motion" },
  { id: "tangential", name: "Tangential Circular Release", icon: "🔄", equation: "v_tangent = ω × r", topic: "Uniform Circular Motion" },
  { id: "spacetime", name: "Spacetime Gravity Distortion", icon: "🌌", equation: "G_μν = (8πG / c⁴) T_μν", topic: "General Relativity" },
  { id: "pendulum", name: "3D Pendulum Energy", icon: "⏱️", equation: "E_total = KE + PE = constant", topic: "Simple Harmonic Motion" },
  { id: "electromagnetism", name: "Solenoid Field Induction", icon: "🧲", equation: "B = μ₀ n I", topic: "Magnetic Fields" },
  { id: "wave", name: "Wave Interference Ripple", icon: "🌊", equation: "y_res = 2A cos(φ/2) sin(kx - ωt)", topic: "Wave Optics" }
];

export default function PhysicsLab() {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  
  const getInitialSim = () => {
    const searchParams = new URLSearchParams(location.search);
    const simParam = searchParams.get("sim");
    if (simParam && SIMULATIONS.some(s => s.id === simParam)) {
      return simParam;
    }
    return "projectile";
  };

  const [activeSim, setActiveSim] = useState(getInitialSim);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const simParam = searchParams.get("sim");
    if (simParam && SIMULATIONS.some(s => s.id === simParam) && simParam !== activeSim) {
      setActiveSim(simParam);
    }
  }, [location.search]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isPlaying, setIsPlaying] = useState(true);
  const [refFrame, setRefFrame] = useState("ground"); // ground, runnerA, runnerB (for Relative Motion)

  // --- Parameter Sliders ---
  const [params, setParams] = useState({
    // General / Projectile
    velocity: 20,
    angle: 45,
    gravity: 9.8,
    airResist: 0.05,
    // Relative
    speedA: 5,
    speedB: -3,
    // Rotational / Tangential
    torque: 5,
    radius: 2.0,
    // Spacetime
    mass: 4.0,
    // Pendulum
    length: 2.5,
    pendMass: 2.0,
    // Electromagnetism
    current: 4,
    coilTurns: 15,
    // Wave
    frequency: 4,
    slitDist: 1.0
  });

  const [chartData, setChartData] = useState([]);
  const [ariaInsight, setAriaInsight] = useState("");
  const [isGraphFullscreen, setIsGraphFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsGraphFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Refs for tracking physics updates inside WebGL render loops
  const stateRef = useRef({
    // Projectile
    px: -8, py: 0, pz: 0,
    pvx: 0, pvy: 0, pvz: 0,
    impacted: false,
    projectileMesh: null,
    trailGeometry: null,
    innerTrailGeometry: null,
    trailPoints: [],
    trailMeshes: [],
    // Tangential
    rotAngle: 0,
    isReleased: false,
    stoneMesh: null,
    stoneVX: 0, stoneVZ: 0,
    // Spacetime
    gridVertices: [],
    satelliteMesh: null,
    satelliteAngle: 0,
    // Pendulum
    pendTheta: 0.8,
    pendOmega: 0,
    rodMesh: null,
    bobMesh: null,
    // Electromagnetism
    electrons: [],
    fieldLines: [],
    // Wave
    waveMesh: null,
    // Mouse dragging for custom Orbit Camera
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    cameraRadius: 22,
    isMouseDown: false,
    mouseX: 0,
    mouseY: 0
  });

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    const state = stateRef.current;
    state.px = -8; state.py = 0; state.pz = 0;
    const rad = (params.angle * Math.PI) / 180;
    state.pvx = params.velocity * Math.cos(rad);
    state.pvy = params.velocity * Math.sin(rad);
    state.pvz = 0;
    state.impacted = false;
    state.trailPoints = [];
    state.rotAngle = 0;
    state.isReleased = false;
    state.stoneVX = 0; state.stoneVZ = 0;
    state.satelliteAngle = 0;
    state.pendTheta = 0.8;
    state.pendOmega = 0;
    setChartData([]);

    // Clear spawned trail meshes to avoid visual overlay bugs
    if (state.trailMeshes) {
      state.trailMeshes.forEach(mesh => {
        if (mesh.parent) {
          mesh.parent.remove(mesh);
        }
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      });
      state.trailMeshes = [];
    }
  };

  useEffect(() => {
    handleReset();
  }, [activeSim]);

  // --- Dynamic Professor ARIA Insights ---
  useEffect(() => {
    let insight = "";
    switch (activeSim) {
      case "projectile":
        insight = `Professor ARIA: Launching at ${params.velocity} m/s and ${params.angle}° elevation in gravity ${params.gravity} m/s² creates a 3D parabolic trail. Drag coefficients drag kinetic energy out of the system.`;
        break;
      case "relative":
        const rel = params.speedA - params.speedB;
        insight = `Professor ARIA: In the ground frame, Runner A is moving at ${params.speedA} m/s and Runner B at ${params.speedB} m/s. In Runner A's reference frame, Runner A is static and Runner B moves relatively at ${-rel} m/s!`;
        break;
      case "freedrop":
        insight = `Professor ARIA: Dropping from rest demonstrates constant gravitational acceleration ($a = -g$). Look at the distance increments: they grow quadratically as s = 1/2 g t²!`;
        break;
      case "tangential":
        insight = `Professor ARIA: As the stone spins, centripetal force pulls it inward. Clicking "Release Stone" cuts this force. By Newton's First Law, the stone instantly flies off tangentially to its rotation point!`;
        break;
      case "spacetime":
        insight = `Professor ARIA: General Relativity states mass bends space-time. The central core of mass ${params.mass} creates a gravity well in the coordinates grid, forcing the satellite into orbit.`;
        break;
      case "pendulum":
        const T = 2 * Math.PI * Math.sqrt(params.length / params.gravity);
        insight = `Professor ARIA: Under simple harmonic oscillations, kinetic and potential energy continuously trade off, but the mechanical energy sum remains perfectly constant at ${T.toFixed(2)}s period.`;
        break;
      case "electromagnetism":
        insight = `Professor ARIA: Flowing electric current ($I = ${params.current}$ A) induces a magnetic field inside the solenoid. Iron cores align domain flux lines, boosting magnetic intensity by 200x.`;
        break;
      case "wave":
        insight = `Professor ARIA: Concentric waves overlap on the coordinate grid plane. Notice how constructive interference creates double-amplitude heights, while destructive nodes remain completely flat.`;
        break;
      default:
        insight = "Welcome to the Lab.";
    }
    setAriaInsight(insight);
  }, [activeSim, params]);

  // --- Core 3D WebGL Three.js Setup & Animation Loop ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId;

    // Reset physics state when building new scene to avoid coordinate or impact carryovers
    handleReset();

    const createGlowTexture = (red, green, blue) => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.25, `rgba(${red}, ${green}, ${blue}, 0.8)`);
      gradient.addColorStop(0.55, `rgba(${red}, ${green}, ${blue}, 0.25)`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(canvas);
    };

    // 1. Scene, Camera & WebGL Renderer setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030010);
    
    // Add grid floor
    const gridHelper = new THREE.GridHelper(30, 30, 0x06b6d4, 0x1e1b4b);
    gridHelper.position.y = -6;
    scene.add(gridHelper);

    const camera = new THREE.PerspectiveCamera(40, 520 / 300, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(520, 300);
    renderer.shadowMap.enabled = true;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Volumetric lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00ffff, 1.2);
    dirLight.position.set(10, 15, 10);
    scene.add(dirLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 2, 50);
    purpleLight.position.set(-10, 5, -10);
    scene.add(purpleLight);

    // 3. Populate simulation meshes
    const state = stateRef.current;
    let mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Dynamic setups for each active simulation
    if (activeSim === "projectile") {
      // Canon base & nozzle
      const canonBaseGeo = new THREE.CylinderGeometry(1.2, 1.5, 1, 16);
      const canonBaseMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.2, metalness: 0.8 });
      const canonBase = new THREE.Mesh(canonBaseGeo, canonBaseMat);
      canonBase.position.set(-8, -5.5, 0);
      mainGroup.add(canonBase);

      const nozzleGeo = new THREE.CylinderGeometry(0.5, 0.5, 3, 16);
      const nozzleMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.1, metalness: 0.9, emissive: 0xa855f7, emissiveIntensity: 0.2 });
      const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
      nozzle.position.set(-8, -4.5, 0);
      nozzle.rotation.z = (params.angle * Math.PI) / 180 - Math.PI / 2;
      mainGroup.add(nozzle);

      // Projectile ball
      const projGeo = new THREE.SphereGeometry(0.5, 32, 32);
      const projMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5 });
      const proj = new THREE.Mesh(projGeo, projMat);
      mainGroup.add(proj);
      state.projectileMesh = proj;

      // Trajectory trail (pre-allocated position buffer line for continuous path drawing)
      const maxPoints = 1500;
      const positions = new Float32Array(maxPoints * 3);
      const innerTrailGeo = new THREE.BufferGeometry();
      innerTrailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const innerTrailMat = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
      const innerTrailLine = new THREE.Line(innerTrailGeo, innerTrailMat);
      mainGroup.add(innerTrailLine);
      state.innerTrailGeometry = innerTrailGeo;

      // Initialize trail meshes array
      state.trailPoints = [];
      state.trailMeshes = [];

    } else if (activeSim === "relative") {
      // Grid path
      const pathGeo = new THREE.BoxGeometry(25, 0.2, 5);
      const pathMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.6 });
      const path = new THREE.Mesh(pathGeo, pathMat);
      path.position.y = -5.8;
      mainGroup.add(path);

      // Runner A (Blue Cylinder Node)
      const runnerAGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16);
      const runnerAMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.3 });
      const runnerA = new THREE.Mesh(runnerAGeo, runnerAMat);
      runnerA.position.set(-5, -5.2, -1);
      mainGroup.add(runnerA);

      // Runner B (Purple Cylinder Node)
      const runnerBGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16);
      const runnerBMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0xa855f7, emissiveIntensity: 0.3 });
      const runnerB = new THREE.Mesh(runnerBGeo, runnerBMat);
      runnerB.position.set(5, -5.2, 1);
      mainGroup.add(runnerB);

      // Store in state to update position
      state.runnerAMesh = runnerA;
      state.runnerBMesh = runnerB;

    } else if (activeSim === "freedrop") {
      // Drop tower stand
      const towerGeo = new THREE.CylinderGeometry(0.2, 0.2, 12, 16);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.3, metalness: 0.8 });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(-2, 0, 0);
      mainGroup.add(tower);

      // Distance coordinate ticks
      for (let i = 0; i <= 5; i++) {
        const tickGeo = new THREE.BoxGeometry(1.2, 0.1, 0.1);
        const tickMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
        const tick = new THREE.Mesh(tickGeo, tickMat);
        // ticks spaced quadratically (s = 1/2 g t^2)
        const tickY = 5 - (i ** 2 * 0.4);
        tick.position.set(-2, tickY, 0.2);
        mainGroup.add(tick);
      }

      // Ball
      const ballGeo = new THREE.SphereGeometry(0.5, 32, 32);
      const ballMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5 });
      const ball = new THREE.Mesh(ballGeo, ballMat);
      ball.position.set(-2, 5, 0.5);
      mainGroup.add(ball);
      state.projectileMesh = ball;

    } else if (activeSim === "tangential") {
      // Orbital ring wire
      const torusGeo = new THREE.TorusGeometry(params.radius, 0.08, 16, 100);
      const torusMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.9, roughness: 0.1 });
      const torus = new THREE.Mesh(torusGeo, torusMat);
      torus.rotation.x = Math.PI / 2;
      torus.position.y = -2;
      mainGroup.add(torus);

      // Stone
      const stoneGeo = new THREE.SphereGeometry(0.4, 32, 32);
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.4 });
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.set(params.radius, -2, 0);
      mainGroup.add(stone);
      state.stoneMesh = stone;

      // Tangential throw path trail (pre-allocated position buffer line for continuous path drawing)
      const maxPoints = 1500;
      const positions = new Float32Array(maxPoints * 3);
      const innerTrailGeo = new THREE.BufferGeometry();
      innerTrailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const innerTrailMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 });
      const innerTrailLine = new THREE.Line(innerTrailGeo, innerTrailMat);
      mainGroup.add(innerTrailLine);
      state.innerTrailGeometry = innerTrailGeo;

      // Initialize trail meshes array
      state.trailPoints = [];
      state.trailMeshes = [];

    } else if (activeSim === "spacetime") {
      // 3D grid net
      const gridSegments = 16;
      const gridGeo = new THREE.PlaneGeometry(16, 16, gridSegments, gridSegments);
      const gridMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.4 });
      const gridMesh = new THREE.Mesh(gridGeo, gridMat);
      gridMesh.rotation.x = -Math.PI / 2;
      gridMesh.position.y = -2;
      mainGroup.add(gridMesh);
      state.waveMesh = gridMesh;

      // Heavy central mass
      const centralMassGeo = new THREE.SphereGeometry(1.6, 32, 32);
      const centralMassMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, emissive: 0x7c3aed, emissiveIntensity: 0.3, roughness: 0.1 });
      const centralMass = new THREE.Mesh(centralMassGeo, centralMassMat);
      centralMass.position.set(0, -2, 0);
      mainGroup.add(centralMass);

      // Accretion particle disk
      const particleCount = 120;
      const particlesGeo = new THREE.BufferGeometry();
      const positions = [];
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 2.8 + Math.random() * 0.8;
        positions.push(radius * Math.cos(angle), -2 + (Math.random() - 0.5) * 0.15, radius * Math.sin(angle));
      }
      particlesGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      const particlesMat = new THREE.PointsMaterial({ color: 0x00ffff, size: 0.15, transparent: true, opacity: 0.8 });
      const points = new THREE.Points(particlesGeo, particlesMat);
      mainGroup.add(points);

      // Satellite sphere
      const satelliteGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const satelliteMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.4 });
      const satellite = new THREE.Mesh(satelliteGeo, satelliteMat);
      mainGroup.add(satellite);
      state.satelliteMesh = satellite;

    } else if (activeSim === "pendulum") {
      // Metallic pivot head
      const pivotGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 16);
      const pivotMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
      const pivot = new THREE.Mesh(pivotGeo, pivotMat);
      pivot.position.set(0, 5, 0);
      pivot.rotation.x = Math.PI / 2;
      mainGroup.add(pivot);

      // Pendulum Rod (wire)
      const rodGeo = new THREE.CylinderGeometry(0.08, 0.08, params.length, 8);
      const rodMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
      const rod = new THREE.Mesh(rodGeo, rodMat);
      mainGroup.add(rod);
      state.rodMesh = rod;

      // Bob sphere
      const bobGeo = new THREE.SphereGeometry(0.7, 32, 32);
      const bobMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, roughness: 0.05, metalness: 0.9, emissive: 0x00ffff, emissiveIntensity: 0.2 });
      const bob = new THREE.Mesh(bobGeo, bobMat);
      mainGroup.add(bob);
      state.bobMesh = bob;

    } else if (activeSim === "electromagnetism") {
      // 3D coil cylinder core
      const coreGeo = new THREE.CylinderGeometry(2, 2, 8, 32);
      const coreMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.rotation.z = Math.PI / 2;
      mainGroup.add(core);

      // Solenoid wire loops (represented by multiple torus shapes)
      const numTurns = params.coilTurns;
      for (let i = 0; i < numTurns; i++) {
        const wrapX = -4 + (i / (numTurns - 1)) * 8;
        const loopGeo = new THREE.TorusGeometry(2.1, 0.1, 16, 60);
        const loopMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.1, metalness: 0.9, emissive: 0xf59e0b, emissiveIntensity: 0.2 });
        const loop = new THREE.Mesh(loopGeo, loopMat);
        loop.position.x = wrapX;
        loop.rotation.y = Math.PI / 2;
        mainGroup.add(loop);
      }

      // Magnetic field lines loops
      const numLines = Math.round(params.current * 1.5);
      for (let i = 1; i <= numLines; i++) {
        const radiusY = 2.5 + i * 0.8;
        const radiusX = 4 + i * 0.5;
        const lineGeo = new THREE.TorusGeometry(radiusX, 0.05, 8, 100);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.35 });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.scale.set(1, radiusY / radiusX, 1);
        mainGroup.add(line);
      }

    } else if (activeSim === "wave") {
      // Deformed interference plane
      const waveGeo = new THREE.PlaneGeometry(16, 16, 64, 64);
      const waveMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.1, metalness: 0.8, wireframe: true });
      const wave = new THREE.Mesh(waveGeo, waveMat);
      wave.rotation.x = -Math.PI / 2;
      wave.position.y = -2;
      mainGroup.add(wave);
      state.waveMesh = wave;
    }

    // 4. Custom Orbit Camera positions
    const updateCameraPosition = () => {
      camera.position.x = state.cameraRadius * Math.sin(state.phi) * Math.sin(state.theta);
      camera.position.y = state.cameraRadius * Math.cos(state.phi);
      camera.position.z = state.cameraRadius * Math.sin(state.phi) * Math.cos(state.theta);
      camera.lookAt(0, 0, 0);
    };
    updateCameraPosition();

    // 5. Animation loop
    let frameCount = 0;
    const dt = 0.05;

    const animate = () => {
      if (!rendererRef.current) return;

      if (isPlaying) {
        if (activeSim === "projectile") {
          if (!state.impacted) {
            // Update kinematics physics (using custom slow-mo time integration step)
            const speedScale = 0.03;
            state.pvy -= (params.gravity + params.airResist * state.pvy) * speedScale;
            state.pvx -= params.airResist * state.pvx * speedScale;

            state.px += state.pvx * speedScale;
            state.py += state.pvy * speedScale;

            if (state.py <= -5.5) {
              state.py = -5.5;
              state.impacted = true;
            }

            state.trailPoints.push(new THREE.Vector3(state.px, state.py, state.pz));
            if (state.projectileMesh) {
              state.projectileMesh.position.set(state.px, state.py, state.pz);
            }

            // Draw continuous line trail using pre-allocated position attributes
            const index = state.trailPoints.length - 1;
            if (index < 1500 && state.innerTrailGeometry) {
              const posAttr = state.innerTrailGeometry.attributes.position;
              posAttr.setXYZ(index, state.px, state.py, state.pz);
              posAttr.needsUpdate = true;
              state.innerTrailGeometry.setDrawRange(0, index + 1);
            }

            // Draw glowing node particles along the trajectory path
            if (frameCount % 3 === 0 && mainGroup) {
              const nodeGeo = new THREE.SphereGeometry(0.18, 8, 8);
              const nodeMat = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.6
              });
              const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
              nodeMesh.position.set(state.px, state.py, state.pz);
              mainGroup.add(nodeMesh);
              if (state.trailMeshes) {
                state.trailMeshes.push(nodeMesh);
              }
            }

            // Logging for charts
            if (frameCount % 4 === 0) {
              setChartData(prev => [
                ...prev.slice(-30),
                {
                  time: (frameCount * dt).toFixed(1),
                  Height: parseFloat((state.py + 5.5).toFixed(1)),
                  Velocity: parseFloat(Math.sqrt(state.pvx**2 + state.pvy**2).toFixed(1))
                }
              ]);
            }
          }

        } else if (activeSim === "relative") {
          // Runners speeds
          const relSpeed = params.speedA - params.speedB;
          
          if (refFrame === "ground") {
            state.runnerAMesh.position.x += params.speedA * 0.02;
            state.runnerBMesh.position.x += params.speedB * 0.02;
            // loop
            if (state.runnerAMesh.position.x > 12) state.runnerAMesh.position.x = -12;
            if (state.runnerBMesh.position.x < -12) state.runnerBMesh.position.x = 12;
          } else if (refFrame === "runnerA") {
            // Runner A static, B moves relative to A
            state.runnerAMesh.position.x = -2;
            state.runnerBMesh.position.x += -relSpeed * 0.02;
            if (state.runnerBMesh.position.x < -12) state.runnerBMesh.position.x = 12;
          } else if (refFrame === "runnerB") {
            // Runner B static, A moves relative to B
            state.runnerBMesh.position.x = 2;
            state.runnerAMesh.position.x += relSpeed * 0.02;
            if (state.runnerAMesh.position.x > 12) state.runnerAMesh.position.x = -12;
          }

          if (frameCount % 4 === 0) {
            setChartData(prev => [
              ...prev.slice(-30),
              {
                time: (frameCount * dt).toFixed(1),
                RelativeVelocity: parseFloat(relSpeed.toFixed(1)),
                RunnerASpeed: parseFloat(params.speedA.toFixed(1)),
                RunnerBSpeed: parseFloat(params.speedB.toFixed(1))
              }
            ]);
          }

        } else if (activeSim === "freedrop") {
          // free drop under gravity (using customized visual speed scale)
          const dropScale = 0.02;
          state.pvy -= params.gravity * dropScale;
          state.py += state.pvy * dropScale;

          if (state.py <= -5.5) {
            // bounce
            state.py = -5.5;
            state.pvy = -state.pvy * 0.5; // coefficient of restitution = 0.5
            if (Math.abs(state.pvy) < 0.5) state.pvy = 0;
          }

          if (state.projectileMesh) {
            state.projectileMesh.position.set(-2, state.py, 0.5);
          }

          if (frameCount % 4 === 0) {
            setChartData(prev => [
              ...prev.slice(-30),
              {
                time: (frameCount * dt).toFixed(1),
                Height: parseFloat((state.py + 5.5).toFixed(1)),
                DropSpeed: parseFloat(Math.abs(state.pvy).toFixed(1))
              }
            ]);
          }

        } else if (activeSim === "tangential") {
          if (!state.isReleased) {
            // Circular rotating motion (slipped down to allow easy student tracking)
            state.rotAngle += params.torque * 0.005;
            const x = params.radius * Math.cos(state.rotAngle);
            const z = params.radius * Math.sin(state.rotAngle);
            state.stoneMesh.position.set(x, -2, z);
          } else {
            // straight tangential path
            state.stoneMesh.position.x += state.stoneVX * 0.2;
            state.stoneMesh.position.z += state.stoneVZ * 0.2;

            state.trailPoints.push(new THREE.Vector3(state.stoneMesh.position.x, -2, state.stoneMesh.position.z));

            // Draw continuous line trail using pre-allocated position attributes
            const index = state.trailPoints.length - 1;
            if (index < 1500 && state.innerTrailGeometry) {
              const posAttr = state.innerTrailGeometry.attributes.position;
              posAttr.setXYZ(index, state.stoneMesh.position.x, -2, state.stoneMesh.position.z);
              posAttr.needsUpdate = true;
              state.innerTrailGeometry.setDrawRange(0, index + 1);
            }

            // Draw glowing node particles along the tangential release path
            if (frameCount % 3 === 0 && mainGroup) {
              const nodeGeo = new THREE.SphereGeometry(0.18, 8, 8);
              const nodeMat = new THREE.MeshBasicMaterial({
                color: 0xf59e0b,
                transparent: true,
                opacity: 0.6
              });
              const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
              nodeMesh.position.set(state.stoneMesh.position.x, -2, state.stoneMesh.position.z);
              mainGroup.add(nodeMesh);
              if (state.trailMeshes) {
                state.trailMeshes.push(nodeMesh);
              }
            }
          }

          if (frameCount % 4 === 0) {
            setChartData(prev => [
              ...prev.slice(-30),
              {
                time: (frameCount * dt).toFixed(1),
                Radius: parseFloat(params.radius.toFixed(1)),
                Speed: parseFloat(params.torque.toFixed(1))
              }
            ]);
          }

        } else if (activeSim === "spacetime") {
          // Bending space time vertices
          const position = state.waveMesh.geometry.attributes.position;
          const massVal = params.mass;
          for (let i = 0; i < position.count; i++) {
            const vx = position.getX(i);
            const vy = position.getY(i);
            const dist = Math.sqrt(vx**2 + vy**2);
            // deform Y vertically proportional to mass and inverse square distance
            const defY = -(massVal * 2.2) / (dist + 1.2);
            position.setZ(i, defY);
          }
          position.needsUpdate = true;

          // Orbit satellite around bent coordinates
          state.satelliteAngle += 0.04;
          const satRadius = 4.2;
          const satX = satRadius * Math.cos(state.satelliteAngle);
          const satZ = satRadius * Math.sin(state.satelliteAngle);
          const satDist = Math.sqrt(satX**2 + satZ**2);
          const satY = -2 - (massVal * 2.2) / (satDist + 1.2);
          state.satelliteMesh.position.set(satX, satY, satZ);

          if (frameCount % 4 === 0) {
            setChartData(prev => [
              ...prev.slice(-30),
              {
                time: (frameCount * dt).toFixed(1),
                GridBendingDepth: parseFloat((- (massVal * 2.2) / 1.2).toFixed(2)),
                OrbitalVelocity: parseFloat(satRadius.toFixed(1))
              }
            ]);
          }

        } else if (activeSim === "pendulum") {
          const acc = -(params.gravity / params.length) * Math.sin(state.pendTheta) - 0.05 * state.pendOmega;
          state.pendOmega += acc * dt;
          state.pendTheta += state.pendOmega * dt;

          const len = params.length;
          const bx = len * Math.sin(state.pendTheta);
          const by = 5 - len * Math.cos(state.pendTheta);

          if (state.bobMesh) {
            state.bobMesh.position.set(bx, by, 0);
          }
          if (state.rodMesh) {
            state.rodMesh.position.set(bx / 2, 5 - (len / 2) * Math.cos(state.pendTheta), 0);
            state.rodMesh.rotation.z = -state.pendTheta;
          }

          if (frameCount % 4 === 0) {
            const ke = 0.5 * params.pendMass * ((len * state.pendOmega) ** 2);
            const pe = params.pendMass * params.gravity * len * (1 - Math.cos(state.pendTheta));
            setChartData(prev => [
              ...prev.slice(-30),
              {
                time: (frameCount * dt).toFixed(1),
                KineticEnergy: parseFloat(ke.toFixed(2)),
                PotentialEnergy: parseFloat(pe.toFixed(2)),
                TotalEnergy: parseFloat((ke + pe).toFixed(2))
              }
            ]);
          }

        } else if (activeSim === "wave") {
          // Deformed wave interference plane
          const waveMesh = state.waveMesh;
          const position = waveMesh.geometry.attributes.position;
          const time = frameCount * 0.15;
          const gap = params.slitDist * 3;
          const source1Y = -gap / 2;
          const source2Y = gap / 2;

          for (let i = 0; i < position.count; i++) {
            const vx = position.getX(i);
            const vy = position.getY(i);
            
            // Distances from both sources
            const d1 = Math.sqrt((vx - 8)**2 + (vy - source1Y)**2);
            const d2 = Math.sqrt((vx - 8)**2 + (vy - source2Y)**2);
            
            // double-slit phase heights interference calculation
            const h1 = Math.sin(d1 * 1.2 - time) / (d1 + 1.5);
            const h2 = Math.sin(d2 * 1.2 - time) / (d2 + 1.5);
            const z = (h1 + h2) * params.frequency * 0.6;
            
            position.setZ(i, z);
          }
          position.needsUpdate = true;
        }
      }

      frameCount++;
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    // --- Interactive Orbit Drag Handlers ---
    const onMouseDown = (e) => {
      state.isMouseDown = true;
      state.mouseX = e.clientX;
      state.mouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (!state.isMouseDown) return;
      const dx = e.clientX - state.mouseX;
      const dy = e.clientY - state.mouseY;
      
      state.theta -= dx * 0.008;
      state.phi = Math.max(0.1, Math.min(Math.PI - 0.1, state.phi - dy * 0.008));
      
      state.mouseX = e.clientX;
      state.mouseY = e.clientY;
      updateCameraPosition();
    };

    const onMouseUp = () => {
      state.isMouseDown = false;
    };

    const onWheel = (e) => {
      state.cameraRadius = Math.max(8, Math.min(45, state.cameraRadius + e.deltaY * 0.02));
      updateCameraPosition();
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("wheel", onWheel);

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("wheel", onWheel);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [activeSim, isPlaying, params, refFrame]);

  // Tangential throw release action trigger
  const handleReleaseStone = () => {
    if (activeSim !== "tangential") return;
    const state = stateRef.current;
    state.isReleased = true;
    
    // Calculate tangential direction vector based on release angle
    const angle = state.rotAngle;
    state.stoneVX = -params.torque * Math.sin(angle) * 0.1;
    state.stoneVZ = params.torque * Math.cos(angle) * 0.1;
  };

  // Pre-configured Ask ARIA launcher
  const handleAskAria = () => {
    let prompt = "";
    if (activeSim === "projectile") {
      prompt = `For a 3D projectile launched with speed v = ${params.velocity} m/s and angle = ${params.angle}°, derive the trajectory equation and explain the component coordinates velocity in gravity = ${params.gravity} m/s².`;
    } else if (activeSim === "relative") {
      prompt = `Using relative motion formulas, detail what happens when two runners move in opposite directions at ${params.speedA} m/s and ${params.speedB} m/s. Explain ground frame vs. Runner A's reference frame.`;
    } else if (activeSim === "freedrop") {
      prompt = `Explain the kinematics acceleration for a free drop under gravity = ${params.gravity} m/s². Prove that the distance ticks grow quadratically as s = 1/2 gt².`;
    } else if (activeSim === "tangential") {
      prompt = `For circular motion with radius = ${params.radius}m and speed = ${params.torque}m/s, analyze mathematically the instantaneous tangential velocity vector components when the string is cut.`;
    } else if (activeSim === "spacetime") {
      prompt = `How does a mass of ${params.mass} kg distort space-time coordinates grid lines under General Relativity? Explain the orbital satellite equations in this curved metric.`;
    } else {
      prompt = `Help me analyze the physical properties and equations for my current active lab configurations.`;
    }
    localStorage.setItem("edumind_aria_draft", prompt);
    navigate("/ask-aria");
  };

  // Filtered simulations list using query
  const filteredSims = SIMULATIONS.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen text-white relative py-8 px-6 lg:px-12 flex flex-col justify-between overflow-y-auto" style={{ background: "#030014" }}>
      
      {/* Cinematic Background highlight orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10 space-y-6">
        
        {/* Navigation & Ambient Music Spectrum Indicator */}
        <header className="flex justify-between items-center border-b border-white/5 pb-4">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors font-medium"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-purple-400 font-mono tracking-widest font-semibold">3D LAB SPECTRUM</span>
            <div className="flex items-end gap-[2px] h-3">
              {[8, 12, 16, 10, 6, 14, 11, 7, 13, 9].map((h, i) => (
                <motion.div
                  key={i}
                  className="w-[2px] bg-cyan-400 rounded-t-sm"
                  animate={{ height: [3, h, 3] }}
                  transition={{ repeat: Infinity, duration: 0.8 + i * 0.1, ease: "easeInOut" }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>⚗️</div>
            <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400" style={{ fontFamily: "Poppins" }}>
              EduMind 3D Physics
            </span>
          </div>
        </header>

        {/* Cinematic Title & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/2 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-purple-500/10 border border-purple-500/20 text-purple-300">
              HOLOGRAPHIC 3D LAB CHAMBER
            </span>
            <h1 className="text-3xl font-black mt-1.5" style={{ fontFamily: "Poppins" }}>
              Virtual Physics Lab
            </h1>
          </div>
          
          {/* Top Search Bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search concepts (e.g. relative, drop)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-black/40 border border-white/10 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 text-white transition-all"
            />
            <Search size={16} className="absolute left-3.5 top-3 text-gray-500" />
          </div>
        </div>

        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel: HUD Simulation Selector (3 Columns) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase font-mono px-1">
              Interactive Systems
            </h3>
            <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredSims.map((sim) => (
                <button
                  key={sim.id}
                  onClick={() => setActiveSim(sim.id)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left border transition-all cursor-pointer"
                  style={{
                    background: activeSim === sim.id ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.02)",
                    borderColor: activeSim === sim.id ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.05)"
                  }}
                >
                  <span className="text-xl">{sim.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{sim.name}</p>
                    <p className="text-xs text-purple-400 font-mono truncate">{sim.topic}</p>
                  </div>
                </button>
              ))}
              {filteredSims.length === 0 && (
                <p className="text-center py-6 text-sm text-gray-500">No matching concepts found.</p>
              )}
            </div>

            {/* Chamber Telemetry Board */}
            <div className="p-4 rounded-xl border border-white/5 bg-white/2 space-y-2 text-xs font-mono">
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Telemetry HUD</p>
              <div className="flex justify-between">
                <span className="text-gray-500">3D WEBGL</span>
                <span className="text-cyan-400 font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">GRAVITY WELL</span>
                <span className="text-purple-400 font-bold">ENABLED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">REF FRAME</span>
                <span className="text-amber-400 font-bold">{refFrame.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Center Panel: 3D Canvas Workspace (6 Columns) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 relative overflow-hidden flex flex-col items-center">
              
              {/* Sci-fi border corners */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/40 rounded-tl" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-500/40 rounded-br" />

              <div className="w-full flex justify-between items-center mb-3 px-2 border-b border-white/5 pb-2 text-xs font-mono text-gray-400">
                <span>3D_SOLVER_viewport_01 // GRAB & DRAG CAMERA TO ROTATE</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  REALTIME_WEBGL_SCENE
                </span>
              </div>

              {/* WebGL Container */}
              <div 
                ref={containerRef} 
                className="rounded-xl border border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.7)] cursor-grab active:cursor-grabbing overflow-hidden" 
                style={{ width: "520px", height: "300px", background: "#030010" }}
              />

              {/* Playback & Action Controls */}
              <div className="flex flex-wrap gap-4 mt-4 relative z-10">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {isPlaying ? <Pause size={14} className="text-cyan-400" /> : <Play size={14} className="text-emerald-400" />}
                  {isPlaying ? "Freeze Loop" : "Resume Loop"}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <RotateCcw size={14} className="text-purple-400" /> Reset State
                </button>

                {/* Special Action button for Circular release */}
                {activeSim === "tangential" && (
                  <button
                    onClick={handleReleaseStone}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-black flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 shadow-md hover:scale-105 transition-all cursor-pointer"
                  >
                    Throw Stone (Tangential)
                  </button>
                )}
              </div>
            </div>

            {/* Slider Control Deck */}
            <div className="p-5 rounded-2xl border border-white/5 bg-white/2 backdrop-blur-md space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">
                  Physics Parameters
                </h3>
                <span className="text-xs text-gray-500 font-mono">CALIBRATING WORLD TELEMETRY</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {activeSim === "projectile" && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-400">Launch Velocity ($v_0$)</span>
                        <span className="text-cyan-400 font-bold font-mono">{params.velocity} m/s</span>
                      </div>
                      <input 
                        type="range" min="10" max="40" step="1" value={params.velocity} 
                        onChange={(e) => updateParam("velocity", parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-1 rounded-lg bg-white/5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-400">Angle ($\theta$)</span>
                        <span className="text-cyan-400 font-bold font-mono">{params.angle}°</span>
                      </div>
                      <input 
                        type="range" min="15" max="85" step="1" value={params.angle} 
                        onChange={(e) => updateParam("angle", parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-1 rounded-lg bg-white/5"
                      />
                    </div>
                  </>
                )}

                {activeSim === "relative" && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-400">Runner A Velocity</span>
                        <span className="text-purple-400 font-bold font-mono">{params.speedA} m/s</span>
                      </div>
                      <input 
                        type="range" min="-10" max="10" step="1" value={params.speedA} 
                        onChange={(e) => updateParam("speedA", parseFloat(e.target.value))}
                        className="w-full accent-purple-400 cursor-pointer h-1 rounded-lg bg-white/5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-400">Runner B Velocity</span>
                        <span className="text-purple-400 font-bold font-mono">{params.speedB} m/s</span>
                      </div>
                      <input 
                        type="range" min="-10" max="10" step="1" value={params.speedB} 
                        onChange={(e) => updateParam("speedB", parseFloat(e.target.value))}
                        className="w-full accent-purple-400 cursor-pointer h-1 rounded-lg bg-white/5"
                      />
                    </div>
                    
                    {/* Toggle Frame Buttons */}
                    <div className="space-y-1.5 col-span-2">
                      <span className="text-xs sm:text-sm text-gray-400 block mb-1">Select Reference Frame</span>
                      <div className="flex gap-2">
                        {["ground", "runnerA", "runnerB"].map((frame) => (
                          <button
                            key={frame}
                            onClick={() => setRefFrame(frame)}
                            className="flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded border transition-colors cursor-pointer"
                            style={{
                              background: refFrame === frame ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.02)",
                              borderColor: refFrame === frame ? "#a855f7" : "rgba(255,255,255,0.08)",
                              color: refFrame === frame ? "#c084fc" : "#94a3b8"
                            }}
                          >
                            {frame === "ground" ? "Ground View" : frame === "runnerA" ? "Runner A Frame" : "Runner B Frame"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {activeSim === "freedrop" && (
                  <div className="space-y-1.5 col-span-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-400">Gravity ($g$)</span>
                      <span className="text-cyan-400 font-bold font-mono">{params.gravity} m/s²</span>
                    </div>
                    <input 
                      type="range" min="1.6" max="25" step="0.5" value={params.gravity} 
                      onChange={(e) => updateParam("gravity", parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-1 rounded-lg bg-white/5"
                    />
                  </div>
                )}

                {activeSim === "tangential" && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-400">Orbital Speed ($\omega$)</span>
                        <span className="text-purple-400 font-bold font-mono">{params.torque} rad/s</span>
                      </div>
                      <input 
                        type="range" min="1" max="15" step="0.5" value={params.torque} 
                        onChange={(e) => updateParam("torque", parseFloat(e.target.value))}
                        className="w-full accent-purple-400 cursor-pointer h-1 rounded-lg bg-white/5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-400">Circular Radius ($r$)</span>
                        <span className="text-purple-400 font-bold font-mono">{params.radius} m</span>
                      </div>
                      <input 
                        type="range" min="1" max="4" step="0.1" value={params.radius} 
                        onChange={(e) => updateParam("radius", parseFloat(e.target.value))}
                        className="w-full accent-purple-400 cursor-pointer h-1 rounded-lg bg-white/5"
                      />
                    </div>
                  </>
                )}

                {activeSim === "spacetime" && (
                  <div className="space-y-1.5 col-span-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-400">Core Mass ($M$)</span>
                      <span className="text-cyan-400 font-bold font-mono">{params.mass} × 10²⁴ kg</span>
                    </div>
                    <input 
                      type="range" min="1" max="10" step="0.5" value={params.mass} 
                      onChange={(e) => updateParam("mass", parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-1 rounded-lg bg-white/5"
                    />
                  </div>
                )}

                {activeSim === "pendulum" && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-400">Length ($L$)</span>
                        <span className="text-cyan-400 font-bold font-mono">{params.length} m</span>
                      </div>
                      <input 
                        type="range" min="1.0" max="4.0" step="0.1" value={params.length} 
                        onChange={(e) => updateParam("length", parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-1 rounded-lg bg-white/5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-400">Gravity ($g$)</span>
                        <span className="text-cyan-400 font-bold font-mono">{params.gravity} m/s²</span>
                      </div>
                      <input 
                        type="range" min="1.6" max="25" step="0.5" value={params.gravity} 
                        onChange={(e) => updateParam("gravity", parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-1 rounded-lg bg-white/5"
                      />
                    </div>
                  </>
                )}

                {activeSim === "electromagnetism" && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-400">Current ($I$)</span>
                        <span className="text-purple-400 font-bold font-mono">{params.current} A</span>
                      </div>
                      <input 
                        type="range" min="0" max="10" step="0.5" value={params.current} 
                        onChange={(e) => updateParam("current", parseFloat(e.target.value))}
                        className="w-full accent-purple-400 cursor-pointer h-1 rounded-lg bg-white/5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-400">Turns ($n$)</span>
                        <span className="text-purple-400 font-bold font-mono">{params.coilTurns}</span>
                      </div>
                      <input 
                        type="range" min="5" max="30" step="1" value={params.coilTurns} 
                        onChange={(e) => updateParam("coilTurns", parseFloat(e.target.value))}
                        className="w-full accent-purple-400 cursor-pointer h-1 rounded-lg bg-white/5"
                      />
                    </div>
                  </>
                )}

                {activeSim === "wave" && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-400">Frequency ($f$)</span>
                        <span className="text-cyan-400 font-bold font-mono">{params.frequency} Hz</span>
                      </div>
                      <input 
                        type="range" min="1" max="8" step="0.5" value={params.frequency} 
                        onChange={(e) => updateParam("frequency", parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-1 rounded-lg bg-white/5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-400">Slits Distance ($d$)</span>
                        <span className="text-cyan-400 font-bold font-mono">{params.slitDist} mm</span>
                      </div>
                      <input 
                        type="range" min="0.5" max="2.0" step="0.1" value={params.slitDist} 
                        onChange={(e) => updateParam("slitDist", parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-1 rounded-lg bg-white/5"
                      />
                    </div>
                  </>
                )}

              </div>
            </div>
          </div>

          {/* Right Panel: AI ARIA Advisor & Governing Formula HUD (3 Columns) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Professor ARIA's HUD */}
            <div className="p-4 rounded-xl border border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-cyan-500/2 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 blur-xl rounded-full" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base bg-purple-500/10 border border-purple-500/20 animate-pulse">🤖</div>
                <div>
                  <p className="text-sm font-bold text-purple-300">Professor ARIA</p>
                  <p className="text-[10px] text-gray-500">Live AI Assistant Stream</p>
                </div>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed min-h-[60px]" style={{ fontFamily: "Outfit" }}>
                {ariaInsight}
              </p>
              
              <button
                onClick={handleAskAria}
                className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-white flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 hover:scale-[1.01] transition-transform cursor-pointer"
              >
                <Sparkles size={13} className="text-cyan-400" /> Deep Consult ARIA
              </button>
            </div>

            {/* Glowing Governing Formula Card (Enlarged) */}
            <div className="p-5 rounded-2xl border border-cyan-500/30 bg-black/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] space-y-3">
              <p className="text-xs text-cyan-400 font-bold tracking-wider uppercase font-mono">Governing Formula</p>
              <div className="py-4 px-2 rounded-xl bg-white/2 border border-white/5 flex items-center justify-center">
                <span className="text-2xl font-black text-white text-center font-mono tracking-wide leading-relaxed">
                  {SIMULATIONS.find(s => s.id === activeSim)?.equation}
                </span>
              </div>
            </div>

            {/* Real-time Graph Analyzer */}
            <div 
              onClick={() => setIsGraphFullscreen(true)}
              className="p-4 rounded-xl border border-white/5 bg-white/2 space-y-3 flex-1 flex flex-col justify-between cursor-pointer hover:border-cyan-500/30 transition-all group relative"
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 rounded text-[8px] font-mono text-cyan-300">
                ZOOM DIAGNOSTIC
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono uppercase tracking-wider">
                  <Activity size={14} className="text-cyan-400" /> Telemetry Charts
                </h4>
                <p className="text-[10px] text-gray-500 mt-0.5">Real-time variables projection (Click to expand)</p>
              </div>

              <div className="h-[120px] w-full mt-2 relative">
                {chartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.15)" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.15)" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ background: "rgba(10,5,25,0.95)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "10px", fontSize: "11px" }} 
                      />
                      {activeSim === "projectile" && (
                        <>
                          <Area type="monotone" dataKey="Height" stroke="#00ffff" fill="rgba(6,182,212,0.1)" strokeWidth={1.5} name="Height (m)" dot={false} />
                          <Area type="monotone" dataKey="Velocity" stroke="#a855f7" fill="rgba(168,85,247,0.05)" strokeWidth={1.5} name="Velocity (m/s)" dot={false} />
                        </>
                      )}
                      {activeSim === "relative" && (
                        <>
                          <Area type="monotone" dataKey="RelativeVelocity" stroke="#a855f7" fill="rgba(168,85,247,0.1)" strokeWidth={1.5} name="v_rel (m/s)" dot={false} />
                          <Area type="monotone" dataKey="RunnerASpeed" stroke="#00ffff" fill="rgba(6,182,212,0.05)" strokeWidth={1.5} name="v_A (m/s)" dot={false} />
                        </>
                      )}
                      {activeSim === "freedrop" && (
                        <>
                          <Area type="monotone" dataKey="Height" stroke="#00ffff" fill="rgba(6,182,212,0.1)" strokeWidth={1.5} name="Height (m)" dot={false} />
                          <Area type="monotone" dataKey="DropSpeed" stroke="#a855f7" fill="rgba(168,85,247,0.05)" strokeWidth={1.5} name="Speed (m/s)" dot={false} />
                        </>
                      )}
                      {activeSim === "pendulum" && (
                        <>
                          <Area type="monotone" dataKey="KineticEnergy" stroke="#00ffff" fill="rgba(6,182,212,0.1)" strokeWidth={1.5} name="KE (J)" dot={false} />
                          <Area type="monotone" dataKey="PotentialEnergy" stroke="#a855f7" fill="rgba(168,85,247,0.05)" strokeWidth={1.5} name="PE (J)" dot={false} />
                          <Area type="monotone" dataKey="TotalEnergy" stroke="#10b981" fill="none" strokeWidth={1} name="Total (J)" dot={false} />
                        </>
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                    <Activity size={18} className="text-gray-600 animate-pulse mb-1" />
                    <span className="text-xs font-mono">TELEMETRY_AWAITING_DATA...</span>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      <footer className="max-w-7xl mx-auto w-full mt-6 text-xs text-gray-600 font-mono flex justify-between">
        <span>&copy; {new Date().getFullYear()} EDUMIND 3D PHYSICS SYSTEM.</span>
        <span>ALL CHANNELS ONLINE // 3D_RENDERING_ACTIVE</span>
      </footer>

      {/* Fullscreen Telemetry Diagnostic Modal */}
      <AnimatePresence>
        {isGraphFullscreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#030014]/95 backdrop-blur-2xl flex flex-col p-6 overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Activity size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white font-mono tracking-wider text-left">
                    DIAGNOSTIC TELEMETRY LAB GRID
                  </h2>
                  <p className="text-xs text-gray-400 text-left">Real-time variables projection & system equation models</p>
                </div>
              </div>
              <button 
                onClick={() => setIsGraphFullscreen(false)}
                className="px-4 py-2 rounded-xl border border-white/10 hover:border-red-500/30 bg-white/5 hover:bg-red-500/10 text-xs font-bold text-gray-400 hover:text-red-400 transition-all cursor-pointer font-mono"
              >
                CLOSE GRID [ESC]
              </button>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
              
              {/* Left Column: Full-screen graph view */}
              <div className="lg:col-span-8 bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-cyan-400 font-mono uppercase tracking-widest mb-1 text-left">
                    System Response Plot
                  </h3>
                  <p className="text-xs text-gray-500 mb-4 text-left">Continuous telemetry tracking loop</p>
                </div>

                <div className="h-[400px] w-full mt-4">
                  {chartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={11} name="Time (s)" />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                        <Tooltip 
                          contentStyle={{ background: "rgba(10,5,25,0.98)", border: "1px solid rgba(6,182,212,0.4)", borderRadius: "12px", fontSize: "12px", color: "#fff" }} 
                        />
                        {activeSim === "projectile" && (
                          <>
                            <Area type="monotone" dataKey="Height" stroke="#00ffff" fill="rgba(6,182,212,0.15)" strokeWidth={2} name="Height (m)" dot={false} />
                            <Area type="monotone" dataKey="Velocity" stroke="#a855f7" fill="rgba(168,85,247,0.08)" strokeWidth={2} name="Velocity (m/s)" dot={false} />
                          </>
                        )}
                        {activeSim === "relative" && (
                          <>
                            <Area type="monotone" dataKey="RelativeVelocity" stroke="#a855f7" fill="rgba(168,85,247,0.15)" strokeWidth={2} name="v_rel (m/s)" dot={false} />
                            <Area type="monotone" dataKey="RunnerASpeed" stroke="#00ffff" fill="rgba(6,182,212,0.08)" strokeWidth={2} name="v_A (m/s)" dot={false} />
                            <Area type="monotone" dataKey="RunnerBSpeed" stroke="#fbbf24" fill="rgba(251,191,36,0.08)" strokeWidth={2} name="v_B (m/s)" dot={false} />
                          </>
                        )}
                        {activeSim === "freedrop" && (
                          <>
                            <Area type="monotone" dataKey="Height" stroke="#00ffff" fill="rgba(6,182,212,0.15)" strokeWidth={2} name="Height (m)" dot={false} />
                            <Area type="monotone" dataKey="DropSpeed" stroke="#a855f7" fill="rgba(168,85,247,0.08)" strokeWidth={2} name="Speed (m/s)" dot={false} />
                          </>
                        )}
                        {activeSim === "tangential" && (
                          <>
                            <Area type="monotone" dataKey="Radius" stroke="#a855f7" fill="rgba(168,85,247,0.15)" strokeWidth={2} name="Radius (m)" dot={false} />
                            <Area type="monotone" dataKey="Speed" stroke="#00ffff" fill="rgba(6,182,212,0.08)" strokeWidth={2} name="Angular Speed (rad/s)" dot={false} />
                          </>
                        )}
                        {activeSim === "spacetime" && (
                          <>
                            <Area type="monotone" dataKey="GridBendingDepth" stroke="#00ffff" fill="rgba(6,182,212,0.15)" strokeWidth={2} name="Max Bending Depth (z)" dot={false} />
                            <Area type="monotone" dataKey="OrbitalVelocity" stroke="#a855f7" fill="rgba(168,85,247,0.08)" strokeWidth={2} name="Orbital radius (r)" dot={false} />
                          </>
                        )}
                        {activeSim === "pendulum" && (
                          <>
                            <Area type="monotone" dataKey="KineticEnergy" stroke="#00ffff" fill="rgba(6,182,212,0.15)" strokeWidth={2} name="KE (J)" dot={false} />
                            <Area type="monotone" dataKey="PotentialEnergy" stroke="#a855f7" fill="rgba(168,85,247,0.08)" strokeWidth={2} name="PE (J)" dot={false} />
                            <Area type="monotone" dataKey="TotalEnergy" stroke="#10b981" fill="rgba(16,185,129,0.05)" strokeWidth={1.5} name="Total Mechanical Energy (J)" dot={false} />
                          </>
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 border border-white/5 rounded-xl bg-black/20">
                      <Activity size={32} className="text-gray-600 mb-2 animate-pulse" />
                      <span className="text-sm font-mono tracking-widest text-gray-400">TELEMETRY_AWAITING_DATA...</span>
                      <p className="text-xs text-gray-600 mt-1">Start loop simulation to capture diagnostic data</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Exhaustive Parameter Dashboard */}
              <div className="lg:col-span-4 space-y-6 text-left">
                
                {/* Governing Formula HUD */}
                <div className="p-5 rounded-2xl border border-cyan-500/30 bg-black/40 shadow-[0_0_20px_rgba(6,182,212,0.1)] space-y-3">
                  <span className="text-xs text-cyan-400 font-bold tracking-wider uppercase font-mono block">Active Equation Model</span>
                  <div className="py-4 px-3 rounded-xl bg-white/2 border border-white/5 flex items-center justify-center">
                    <span className="text-2xl font-black text-white text-center font-mono tracking-wide leading-relaxed">
                      {SIMULATIONS.find(s => s.id === activeSim)?.equation}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono text-center">
                    {activeSim === "projectile" && "Models parabolic coordinate vectors through gravitational pull."}
                    {activeSim === "relative" && "Translates frame coordinate velocity vector differences."}
                    {activeSim === "freedrop" && "Tracks accelerated position vectors under constant force."}
                    {activeSim === "tangential" && "Resolves linear velocities from centripetal break points."}
                    {activeSim === "spacetime" && "Displays general relativistic coordinate field deforming."}
                    {activeSim === "pendulum" && "Illustrates mechanical conservation of kinetic & potential energies."}
                    {activeSim === "electromagnetism" && "Calculates flux density loop induction from current loops."}
                    {activeSim === "wave" && "Wavelength and slit-spacing phase interference height offsets."}
                  </p>
                </div>

                {/* Parameters Panel */}
                <div className="p-5 rounded-2xl border border-white/5 bg-white/2 space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                    Diagnostic Parameters
                  </h4>
                  <div className="space-y-3 text-xs font-mono">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-gray-400">Simulation Identifier</span>
                      <span className="text-cyan-400 uppercase font-bold">{activeSim}</span>
                    </div>

                    {/* Physics Parameters Detail */}
                    {activeSim === "projectile" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Launch Velocity (v₀)</span>
                          <span className="text-white font-bold">{params.velocity} m/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Launch Angle (θ)</span>
                          <span className="text-white font-bold">{params.angle}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Gravitational Constant (g)</span>
                          <span className="text-white font-bold">{params.gravity} m/s²</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Air Resistance Coeff (μ)</span>
                          <span className="text-white font-bold">{params.airResist}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-2 text-cyan-400">
                          <span>Calculated Max Range</span>
                          <span className="font-bold">
                            {((params.velocity**2 * Math.sin(2 * (params.angle * Math.PI / 180))) / params.gravity).toFixed(2)} m
                          </span>
                        </div>
                        <div className="flex justify-between text-purple-400">
                          <span>Calculated Peak Height</span>
                          <span className="font-bold">
                            {((params.velocity**2 * Math.sin(params.angle * Math.PI / 180)**2) / (2 * params.gravity)).toFixed(2)} m
                          </span>
                        </div>
                      </>
                    )}

                    {activeSim === "relative" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Runner A Speed (v_A)</span>
                          <span className="text-white font-bold">{params.speedA} m/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Runner B Speed (v_B)</span>
                          <span className="text-white font-bold">{params.speedB} m/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Active Ref Frame</span>
                          <span className="text-amber-400 uppercase font-bold">{refFrame} View</span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-2 text-cyan-400">
                          <span>Relative Separation Speed</span>
                          <span className="font-bold">{Math.abs(params.speedA - params.speedB).toFixed(2)} m/s</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-normal leading-relaxed mt-2 border-t border-white/5 pt-2 font-mono">
                          In Runner A's frame, Runner A is stationary (v_A = 0) and Runner B recedes at v_rel. In Runner B's frame, Runner A moves at -v_rel.
                        </p>
                      </>
                    )}

                    {activeSim === "freedrop" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Gravity Acceleration (g)</span>
                          <span className="text-white font-bold">{params.gravity} m/s²</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Starting Height</span>
                          <span className="text-white font-bold">12.0 m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Terminal Velocity (est)</span>
                          <span className="text-white font-bold">{Math.sqrt(2 * params.gravity * 12.0).toFixed(2)} m/s</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-normal leading-relaxed mt-2 border-t border-white/5 pt-2 font-mono">
                          The quadratic formula determines the tick coordinates s(t) = 0.5 * g * t². The coefficient of restitution is set to 0.5.
                        </p>
                      </>
                    )}

                    {activeSim === "tangential" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Angular Velocity (ω)</span>
                          <span className="text-white font-bold">{params.torque} rad/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Orbit Radius (r)</span>
                          <span className="text-white font-bold">{params.radius} m</span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-2 text-cyan-400">
                          <span>Tangential Speed (v)</span>
                          <span className="font-bold">{(params.torque * params.radius).toFixed(2)} m/s</span>
                        </div>
                        <div className="flex justify-between text-purple-400">
                          <span>Centripetal Accel (a_c)</span>
                          <span className="font-bold">{(params.torque**2 * params.radius).toFixed(2)} m/s²</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-normal leading-relaxed mt-2 border-t border-white/5 pt-2 font-mono">
                          When released, the centripetal force constraint v²/r drops to 0, causing the object to continue along its tangential velocity vector.
                        </p>
                      </>
                    )}

                    {activeSim === "spacetime" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Central Mass (M)</span>
                          <span className="text-white font-bold">{params.mass} × 10²⁴ kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Orbit radius</span>
                          <span className="text-white font-bold">4.20 m</span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-2 text-cyan-400">
                          <span>Max Relativistic Bending</span>
                          <span className="font-bold">{(-(params.mass * 2.2) / 1.2).toFixed(2)} units</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-normal leading-relaxed mt-2 border-t border-white/5 pt-2 font-mono">
                          Implements Einstein's field equation deformation on a flat coordinate sheet. The satellite orbits inside the mass gravitational potential well.
                        </p>
                      </>
                    )}

                    {activeSim === "pendulum" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Pendulum Length (L)</span>
                          <span className="text-white font-bold">{params.length} m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Bob Mass (m)</span>
                          <span className="text-white font-bold">{params.pendMass} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Gravity Constant (g)</span>
                          <span className="text-white font-bold">{params.gravity} m/s²</span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-2 text-cyan-400">
                          <span>Natural Period (T)</span>
                          <span className="font-bold">{(2 * Math.PI * Math.sqrt(params.length / params.gravity)).toFixed(2)} s</span>
                        </div>
                      </>
                    )}

                    {activeSim === "electromagnetism" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Active Current (I)</span>
                          <span className="text-white font-bold">{params.current} A</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Coil Turns Density (n)</span>
                          <span className="text-white font-bold">{params.coilTurns}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-2 text-cyan-400">
                          <span>Flux Density (B)</span>
                          <span className="font-bold">{(1.256e-6 * params.coilTurns * params.current).toExponential(3)} Tesla</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-normal leading-relaxed mt-2 border-t border-white/5 pt-2 font-mono">
                          The magnetic field strength is directly proportional to turns density and active current according to Ampere's Law.
                        </p>
                      </>
                    )}

                    {activeSim === "wave" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Ripple Frequency (f)</span>
                          <span className="text-white font-bold">{params.frequency} Hz</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Slits Distance (d)</span>
                          <span className="text-white font-bold">{params.slitDist} mm</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-normal leading-relaxed mt-2 border-t border-white/5 pt-2 font-mono">
                          Constructive interference causes crest spikes where path differences satisfy n * lambda. Destructive nodes cause null regions.
                        </p>
                      </>
                    )}

                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
