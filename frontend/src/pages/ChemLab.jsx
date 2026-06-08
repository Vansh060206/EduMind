// ChemLab.jsx — 3D WebGL AI Chemistry Research Chamber
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
  { id: "bonding", name: "3D Molecular Bonding", icon: "⚛️", equation: "E_bond = E_atoms - E_molecule", topic: "Chemical Bonding" },
  { id: "crystal", name: "NaCl Crystal Lattice Zoom", icon: "💎", equation: "Coordination Number = 6:6", topic: "Solid State Chemistry" },
  { id: "equilibrium", name: "Le Chatelier equilibrium", icon: "⚖️", equation: "N₂ + 3H₂ ⇌ 2NH₃ + ΔH", topic: "Chemical Equilibrium" },
  { id: "states", name: "Kinetic Gas Chamber", icon: "💨", equation: "P V = n R T", topic: "States of Matter" },
  { id: "titration", name: "Acid-Base Titration curves", icon: "🧪", equation: "M_acid × V_acid = M_base × V_base", topic: "Volumetric Analysis" },
  { id: "phvisual", name: "pH Ion Concentration", icon: "🌈", equation: "pH = -log₁₀[H₃O⁺]", topic: "Ionic Equilibrium" }
];

const PH_SUBSTANCES = [
  { ph: 0, name: "Battery Acid", color: "#ef4444" },
  { ph: 2, name: "Lemon Juice", color: "#f59e0b" },
  { ph: 4, name: "Tomato Juice", color: "#e11d48" },
  { ph: 7, name: "Pure Water", color: "#10b981" },
  { ph: 10, name: "Hand Soap", color: "#06b6d4" },
  { ph: 12, name: "Soapy Ammonia", color: "#3b82f6" },
  { ph: 14, name: "Drain Cleaner", color: "#6366f1" }
];

export default function ChemLab() {
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
    return "bonding";
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

  // --- Parameter Sliders ---
  const [params, setParams] = useState({
    bondType: "Covalent",
    naclScale: 1.0,
    temp: 300,
    pressure: 1.0,
    flowRate: 1.0,
    phLevel: 7.0,
    eqShift: 0 // Le Chatelier offset: -2 (reactants) to +2 (products)
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

  // Refs for tracking chemistry updates inside WebGL render loops
  const stateRef = useRef({
    // Bonding
    atom1X: -3.5, atom1Y: 0,
    atom2X: 3.5, atom2Y: 0,
    bondSnapped: false,
    electronPhase: 0,
    isDragging: 0, // 1: atom1, 2: atom2
    atom1Mesh: null,
    atom2Mesh: null,
    // Titration
    titrantAdded: 0,
    titrationPH: 1.0,
    drops: [],
    // Reaction
    particles: [],
    combustions: [],
    spawnTimer: 0,
    // Orbit camera properties
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    cameraRadius: 20,
    isMouseDown: false,
    mouseX: 0,
    mouseY: 0
  });

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    const state = stateRef.current;
    state.atom1X = -3.5; state.atom1Y = 0;
    state.atom2X = 3.5; state.atom2Y = 0;
    state.bondSnapped = false;
    state.isDragging = 0;
    state.titrantAdded = 0;
    state.titrationPH = 1.0;
    state.drops = [];
    state.combustions = [];
    setChartData([]);

    // Seed gas particles
    state.particles = [];
    for (let i = 0; i < 20; i++) {
      state.particles.push({
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 6,
        z: (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        vz: (Math.random() - 0.5) * 2,
        type: Math.random() > 0.4 ? "reactA" : "reactB",
        radius: Math.random() > 0.4 ? 0.35 : 0.5
      });
    }
  };

  useEffect(() => {
    handleReset();
  }, [activeSim, params.bondType]);

  // --- Dynamic Professor ARIA Insights ---
  useEffect(() => {
    let insight = "";
    switch (activeSim) {
      case "bonding":
        insight = params.bondType === "Covalent"
          ? "Professor ARIA: Covalent bonding involves the sharing of valence electron pairs between non-metals. Drag the atoms close to merge their electron shell orbits."
          : "Professor ARIA: Ionic bonding triggers an electron transfer from Sodium (metal) to Chlorine (non-metal), creating electrostatic attraction between Na+ and Cl- ions.";
        break;
      case "crystal":
        insight = `Professor ARIA: Sodium Chloride (NaCl) forms a Face-Centered Cubic (FCC) lattice. Each ion is coordinated with 6 opposing ions (coordination number 6:6). Adjust the lattice scale to inspect packing density.`;
        break;
      case "equilibrium":
        insight = `Professor ARIA: In the synthesis of Ammonia (N2 + 3H2 ⇌ 2NH3 + Heat), increasing pressure forces the equilibrium toward the right (products) since it has fewer gaseous moles, demonstrating Le Chatelier's principle.`;
        break;
      case "states":
        insight = `Professor ARIA: Bouncing gas particles obey the ideal gas law (PV = nRT). Scaling temperature (${params.temp}K) drives higher kinetic velocities, escalating particle collision frequencies.`;
        break;
      case "titration":
        insight = `Professor ARIA: Titrating HCl with NaOH. As drops fall into the beaker, notice the sigmoidal pH curve. At stoichiometric equivalence, the solution instantly turns pink (indicator pH > 8.2).`;
        break;
      case "phvisual":
        const sub = PH_SUBSTANCES.reduce((prev, curr) => 
          Math.abs(curr.ph - params.phLevel) < Math.abs(prev.ph - params.phLevel) ? curr : prev
        );
        insight = `Professor ARIA: A pH of ${params.phLevel.toFixed(1)} represents ${sub.name}. Drag the slider to witness hydronium (H3O+) vs hydroxide (OH-) ion balance changes.`;
        break;
      default:
        insight = "Welcome to the Lab.";
    }
    setAriaInsight(insight);
  }, [activeSim, params]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId;

    // Reset chemistry state when building new scene to avoid titration volume or particle carryovers
    handleReset();

    // 1. Scene & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020210);

    const gridHelper = new THREE.GridHelper(30, 30, 0x10b981, 0x022c22);
    gridHelper.position.y = -6;
    scene.add(gridHelper);

    const camera = new THREE.PerspectiveCamera(40, 520 / 300, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(520, 300);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x10b981, 1.2);
    dirLight.position.set(10, 15, 10);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x06b6d4, 2, 50);
    pointLight.position.set(-10, 5, -10);
    scene.add(pointLight);

    const state = stateRef.current;
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 2. Mesh setups for each mode
    if (activeSim === "bonding") {
      // Left Atom
      const leftGeo = new THREE.SphereGeometry(0.8, 32, 32);
      const leftMat = new THREE.MeshStandardMaterial({ 
        color: params.bondType === "Covalent" ? 0x06b6d4 : 0xf59e0b, 
        roughness: 0.1, 
        metalness: 0.7 
      });
      const leftAtom = new THREE.Mesh(leftGeo, leftMat);
      leftAtom.position.set(state.atom1X, 0, 0);
      mainGroup.add(leftAtom);
      state.atom1Mesh = leftAtom;

      // Right Atom
      const rightGeo = new THREE.SphereGeometry(0.8, 32, 32);
      const rightMat = new THREE.MeshStandardMaterial({ 
        color: params.bondType === "Covalent" ? 0x10b981 : 0xa855f7, 
        roughness: 0.1, 
        metalness: 0.7 
      });
      const rightAtom = new THREE.Mesh(rightGeo, rightMat);
      rightAtom.position.set(state.atom2X, 0, 0);
      mainGroup.add(rightAtom);
      state.atom2Mesh = rightAtom;

      // Bonding lines (figure-8 paths mesh)
      const ringGeo = new THREE.RingGeometry(1.5, 1.6, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      mainGroup.add(ring);

      const ring2 = ring.clone();
      ring2.position.x = 2;
      mainGroup.add(ring2);

    } else if (activeSim === "crystal") {
      // NaCl FCC Lattice Cubes model
      const ionRadius = 0.35;
      const greenMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.1, metalness: 0.8, emissive: 0x10b981, emissiveIntensity: 0.2 }); // Cl-
      const purpleMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.1, metalness: 0.8, emissive: 0xa855f7, emissiveIntensity: 0.2 }); // Na+

      // Connective silver bars material
      const barMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.1 });

      const scale = params.naclScale * 2.2;

      // Draw 3x3x3 grid lattice
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            const isNa = (x + y + z) % 2 === 0;
            const sphereGeo = new THREE.SphereGeometry(isNa ? ionRadius : ionRadius * 1.3, 16, 16);
            const ion = new THREE.Mesh(sphereGeo, isNa ? purpleMat : greenMat);
            ion.position.set(x * scale, y * scale, z * scale);
            mainGroup.add(ion);

            // Connective struts along X, Y, Z
            if (x < 1) {
              const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, scale, 8), barMat);
              strut.rotation.z = Math.PI / 2;
              strut.position.set((x + 0.5) * scale, y * scale, z * scale);
              mainGroup.add(strut);
            }
            if (y < 1) {
              const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, scale, 8), barMat);
              strut.position.set(x * scale, (y + 0.5) * scale, z * scale);
              mainGroup.add(strut);
            }
            if (z < 1) {
              const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, scale, 8), barMat);
              strut.rotation.x = Math.PI / 2;
              strut.position.set(x * scale, y * scale, (z + 0.5) * scale);
              mainGroup.add(strut);
            }
          }
        }
      }

    } else if (activeSim === "equilibrium") {
      // Renders two distinct molecular chambers representing Le Chatelier shifts
      // Left reactant container
      const reactBoxGeo = new THREE.BoxGeometry(4.5, 4.5, 4.5);
      const boxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, wireframe: true });
      const reactBox = new THREE.Mesh(reactBoxGeo, boxMat);
      reactBox.position.set(-3.5, 0, 0);
      mainGroup.add(reactBox);

      // Right product container
      const prodBox = reactBox.clone();
      prodBox.position.set(3.5, 0, 0);
      mainGroup.add(prodBox);

      // Fill left container with reactants (small blue/red spheres)
      const shift = params.eqShift; // -2 to +2
      const numReactants = Math.round(15 - shift * 3);
      const numProducts = Math.round(8 + shift * 4);

      for (let i = 0; i < numReactants; i++) {
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshStandardMaterial({ color: 0x06b6d4 }));
        sphere.position.set(
          -3.5 + (Math.random() - 0.5) * 3.5,
          (Math.random() - 0.5) * 3.5,
          (Math.random() - 0.5) * 3.5
        );
        mainGroup.add(sphere);
      }

      for (let i = 0; i < numProducts; i++) {
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
        sphere.position.set(
          3.5 + (Math.random() - 0.5) * 3.5,
          (Math.random() - 0.5) * 3.5,
          (Math.random() - 0.5) * 3.5
        );
        mainGroup.add(sphere);
      }

    } else if (activeSim === "states") {
      // 3D gas chamber frame
      const borderGeo = new THREE.BoxGeometry(10, 8, 10);
      const borderMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.8, wireframe: true });
      const border = new THREE.Mesh(borderGeo, borderMat);
      mainGroup.add(border);

      // Gas particles will be updated dynamically in anim loop
      state.particles.forEach((p) => {
        const sphereGeo = new THREE.SphereGeometry(p.radius, 16, 16);
        const sphereMat = new THREE.MeshStandardMaterial({ 
          color: p.type === "reactA" ? 0xf43f5e : 0x06b6d4,
          roughness: 0.1,
          metalness: 0.8
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.set(p.x, p.y, p.z);
        mainGroup.add(sphere);
        p.mesh = sphere;
      });

    } else if (activeSim === "titration") {
      // 3D cylindrical buret tube
      const buretGeo = new THREE.CylinderGeometry(0.2, 0.2, 7, 16);
      const buretMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, transparent: true, opacity: 0.4 });
      const buret = new THREE.Mesh(buretGeo, buretMat);
      buret.position.set(0, 3.5, 0);
      mainGroup.add(buret);

      // Beaker below
      const beakerGeo = new THREE.CylinderGeometry(1.6, 1.6, 3, 32);
      const beakerMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.1, transparent: true, opacity: 0.3 });
      const beaker = new THREE.Mesh(beakerGeo, beakerMat);
      beaker.position.set(0, -3.5, 0);
      mainGroup.add(beaker);

      // Fluid cylinder inside beaker
      const fluidGeo = new THREE.CylinderGeometry(1.5, 1.5, 1.2, 32);
      const fluidMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
      const fluid = new THREE.Mesh(fluidGeo, fluidMat);
      fluid.position.set(0, -4.1, 0);
      mainGroup.add(fluid);
      state.beakerFluidMesh = fluid;

    } else if (activeSim === "phvisual") {
      // Render bounding container
      const frameGeo = new THREE.BoxGeometry(10, 7, 7);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9, wireframe: true });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      mainGroup.add(frame);

      // Spawn hydronium vs hydroxide spheres
      const ph = params.phLevel;
      const numH = Math.max(1, Math.round((14 - ph) * 2.2));
      const numOH = Math.max(1, Math.round(ph * 2.2));

      // H3O+ spheres (Red)
      const h3oMat = new THREE.MeshStandardMaterial({ color: 0xf87171, roughness: 0.1, metalness: 0.8, emissive: 0xf87171, emissiveIntensity: 0.3 });
      for (let i = 0; i < numH; i++) {
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), h3oMat);
        sphere.position.set(
          (Math.random() - 0.5) * 8.5,
          (Math.random() - 0.5) * 5.5,
          (Math.random() - 0.5) * 5.5
        );
        mainGroup.add(sphere);
      }

      // OH- spheres (Blue)
      const ohMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.1, metalness: 0.8, emissive: 0x60a5fa, emissiveIntensity: 0.3 });
      for (let i = 0; i < numOH; i++) {
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), ohMat);
        sphere.position.set(
          (Math.random() - 0.5) * 8.5,
          (Math.random() - 0.5) * 5.5,
          (Math.random() - 0.5) * 5.5
        );
        mainGroup.add(sphere);
      }
    }

    // Camera updates
    const updateCameraPosition = () => {
      camera.position.x = state.cameraRadius * Math.sin(state.phi) * Math.sin(state.theta);
      camera.position.y = state.cameraRadius * Math.cos(state.phi);
      camera.position.z = state.cameraRadius * Math.sin(state.phi) * Math.cos(state.theta);
      camera.lookAt(0, 0, 0);
    };
    updateCameraPosition();

    // 3. Animation loop
    let frameCount = 0;
    const dt = 0.05;

    const animate = () => {
      if (!rendererRef.current) return;

      if (isPlaying) {
        if (activeSim === "bonding") {
          // Check snap distance
          const d = Math.sqrt((state.atom1X - state.atom2X)**2 + (state.atom1Y - state.atom2Y)**2);
          if (d < 3.8) {
            state.bondSnapped = true;
            // Snapped position
            state.atom1X = -1.8;
            state.atom2X = 1.8;
          } else {
            state.bondSnapped = false;
          }

          if (state.atom1Mesh && state.atom2Mesh) {
            state.atom1Mesh.position.x = state.atom1X;
            state.atom2Mesh.position.x = state.atom2X;
          }

          state.electronPhase += 0.06;

        } else if (activeSim === "states") {
          const tempFactor = params.temp / 300;
          
          state.particles.forEach((p) => {
            p.x += p.vx * tempFactor * 0.2;
            p.y += p.vy * tempFactor * 0.2;
            p.z += p.vz * tempFactor * 0.2;

            // Bounce box limits: X (-5, 5), Y (-4, 4), Z (-5, 5)
            if (p.x - p.radius < -5) { p.x = -5 + p.radius; p.vx *= -1; }
            if (p.x + p.radius > 5) { p.x = 5 - p.radius; p.vx *= -1; }
            if (p.y - p.radius < -4) { p.y = -4 + p.radius; p.vy *= -1; }
            if (p.y + p.radius > 4) { p.y = 4 - p.radius; p.vy *= -1; }
            if (p.z - p.radius < -5) { p.z = -5 + p.radius; p.vz *= -1; }
            if (p.z + p.radius > 5) { p.z = 5 - p.radius; p.vz *= -1; }

            if (p.mesh) {
              p.mesh.position.set(p.x, p.y, p.z);
            }
          });

        } else if (activeSim === "titration") {
          // Spawn drop particles
          if (frameCount % Math.max(3, Math.round(20 / params.flowRate)) === 0) {
            // Spawn 3D drop sphere
            const dropGeo = new THREE.SphereGeometry(0.08, 8, 8);
            const dropMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
            const drop = new THREE.Mesh(dropGeo, dropMat);
            drop.position.set(0, 0, 0); // start at tip of buret
            mainGroup.add(drop);
            
            state.drops.push({
              mesh: drop,
              y: 0,
              vy: 0.1
            });
          }

          // Update drops
          state.drops.forEach((d) => {
            d.vy += 0.05; // gravity
            d.y -= d.vy;
            if (d.mesh) {
              d.mesh.position.y = 0 - d.y;
            }

            if (d.y >= 3.6) {
              // Splash hit flask fluid
              d.dead = true;
              mainGroup.remove(d.mesh);
              state.titrantAdded += 0.2;

              // Calculate titration stoichiometry pH
              const Va = 25.0;
              const Ma = params.acidConcentration;
              const Mb = params.baseConcentration;
              const Vb = state.titrantAdded;

              const molesH = Ma * Va;
              const molesOH = Mb * Vb;
              const totalV = Va + Vb;

              if (molesH > molesOH) {
                const concH = (molesH - molesOH) / totalV;
                state.titrationPH = Math.max(1.0, -Math.log10(concH));
              } else if (Math.abs(molesH - molesOH) < 0.05) {
                state.titrationPH = 7.0;
              } else {
                const concOH = (molesOH - molesH) / totalV;
                state.titrationPH = Math.min(13.0, 14.0 + Math.log10(concOH));
              }

              // Color color transformation based on pH
              if (state.beakerFluidMesh) {
                if (state.titrationPH >= 8.2) {
                  const intensity = Math.min(1.0, (state.titrationPH - 8.2) / 1.5);
                  state.beakerFluidMesh.material.color.setHex(0xec4899); // Pink
                  state.beakerFluidMesh.material.opacity = 0.25 + intensity * 0.45;
                } else {
                  state.beakerFluidMesh.material.color.setHex(0xffffff); // Clear
                  state.beakerFluidMesh.material.opacity = 0.1;
                }
              }

              // Feed chart
              setChartData(prev => [
                ...prev,
                {
                  volume: parseFloat(Vb.toFixed(1)),
                  pH: parseFloat(state.titrationPH.toFixed(2))
                }
              ].slice(-40));
            }
          });

          // Clean dead drops
          state.drops = state.drops.filter(d => !d.dead);
        }
      }

      frameCount++;
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    // Orbit drag controls
    const onMouseDown = (e) => {
      // Handle dragging atoms in bonding mode
      if (activeSim === "bonding") {
        const mouse = new THREE.Vector2();
        mouse.x = (e.clientX - container.getBoundingClientRect().left) / 520 * 2 - 1;
        mouse.y = -(e.clientY - container.getBoundingClientRect().top) / 300 * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects([state.atom1Mesh, state.atom2Mesh]);
        if (intersects.length > 0) {
          state.isDragging = intersects[0].object === state.atom1Mesh ? 1 : 2;
          state.isMouseDown = false;
          return;
        }
      }

      state.isMouseDown = true;
      state.mouseX = e.clientX;
      state.mouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      // Drag atom
      if (state.isDragging > 0 && activeSim === "bonding") {
        const deltaX = (e.clientX - state.mouseX) * 0.05;
        if (state.isDragging === 1) {
          state.atom1X = Math.max(-8, Math.min(1.5, state.atom1X + deltaX));
        } else {
          state.atom2X = Math.max(-1.5, Math.min(8, state.atom2X + deltaX));
        }
        state.mouseX = e.clientX;
        return;
      }

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
      state.isDragging = 0;
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
  }, [activeSim, isPlaying, params]);

  // Pre-configured Ask ARIA launcher
  const handleAskAria = () => {
    let prompt = "";
    if (activeSim === "bonding") {
      prompt = `Using molecular orbital configurations, compare Covalent vs Ionic bonding for $H_2O$ and $NaCl$ crystal lattice frameworks for Class 11.`;
    } else if (activeSim === "crystal") {
      prompt = `Explain the FCC (Face Centered Cubic) structure of NaCl crystal lattices. Define coordination numbers 6:6 and packing fractions for Class 12 Solid State.`;
    } else if (activeSim === "equilibrium") {
      prompt = `For the equilibrium reaction $N_2 + 3H_2 \\rightleftharpoons 2NH_3$, describe Le Chatelier's shifts as temperature and pressure parameters are toggled.`;
    } else if (activeSim === "states") {
      prompt = `Explain the kinetic gas theory equations ($PV = nRT$) and what happens to molecular collision rates inside a closed container as temperature rises.`;
    } else if (activeSim === "titration") {
      prompt = `State the volumetric equation $M_a V_a = M_b V_b$ and derive the equivalence pH curve calculation for strong acids and bases.`;
    } else {
      prompt = `Provide comprehensive chemical equations and notes for my current active lab configurations.`;
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
    <div className="w-full min-h-screen text-white relative py-8 px-6 lg:px-12 flex flex-col justify-between overflow-y-auto" style={{ background: "#020210" }}>
      
      {/* Background radial highlight */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10 space-y-6">
        
        {/* Navigation Header */}
        <header className="flex justify-between items-center border-b border-white/5 pb-4">
          <button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors font-medium"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-emerald-400 font-mono tracking-widest font-semibold">3D LAB SPECTRUM</span>
            <div className="flex items-end gap-[2px] h-3">
              {[6, 14, 10, 16, 8, 12, 7, 11, 13, 9].map((h, i) => (
                <motion.div
                  key={i}
                  className="w-[2px] bg-emerald-400 rounded-t-sm"
                  animate={{ height: [3, h, 3] }}
                  transition={{ repeat: Infinity, duration: 0.8 + i * 0.1, ease: "easeInOut" }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{ background: "linear-gradient(135deg,#059669,#06b6d4)" }}>🧪</div>
            <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ fontFamily: "Poppins" }}>
              EduMind 3D Chemistry
            </span>
          </div>
        </header>

        {/* Cinematic Title & Search HUD */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/2 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              MOLECULAR 3D CHAMBER
            </span>
            <h1 className="text-3xl font-black mt-1.5" style={{ fontFamily: "Poppins" }}>
              Virtual Chemistry Lab
            </h1>
          </div>
          
          {/* Top Search Bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search concepts (e.g. bonding, titration)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-black/40 border border-white/10 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 text-white transition-all"
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
                    background: activeSim === sim.id ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.02)",
                    borderColor: activeSim === sim.id ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.05)"
                  }}
                >
                  <span className="text-xl">{sim.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{sim.name}</p>
                    <p className="text-xs text-emerald-400 font-mono truncate">{sim.topic}</p>
                  </div>
                </button>
              ))}
              {filteredSims.length === 0 && (
                <p className="text-center py-6 text-sm text-gray-500">No matching concepts found.</p>
              )}
            </div>

            {/* Chamber Telemetry HUD */}
            <div className="p-4 rounded-xl border border-white/5 bg-white/2 space-y-2 text-xs font-mono">
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Telemetry HUD</p>
              <div className="flex justify-between">
                <span className="text-gray-500">3D WEBGL</span>
                <span className="text-emerald-400 font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">PRECISION</span>
                <span className="text-cyan-400 font-bold">FLOAT64</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">VALENCE</span>
                <span className="text-amber-400 font-bold">HYBRIDIZED</span>
              </div>
            </div>
          </div>

          {/* Center Panel: 3D Canvas Workspace (6 Columns) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 relative overflow-hidden flex flex-col items-center">
              
              {/* Sci-fi border corners */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-500/40 rounded-tl" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/40 rounded-br" />

              <div className="w-full flex justify-between items-center mb-3 px-2 border-b border-white/5 pb-2 text-xs font-mono text-gray-400">
                <span>3D_SOLVER_viewport_02 // GRAB & DRAG CAMERA TO ROTATE</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  REALTIME_WEBGL_SCENE
                </span>
              </div>

              {/* WebGL Container */}
              <div 
                ref={containerRef} 
                className="rounded-xl border border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.7)] cursor-grab active:cursor-grabbing overflow-hidden" 
                style={{ width: "520px", height: "300px", background: "#020210" }}
              />

              {/* Playback Controls */}
              <div className="flex gap-4 mt-4 relative z-10">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {isPlaying ? <Pause size={14} className="text-cyan-400" /> : <Play size={14} className="text-emerald-400" />}
                  {isPlaying ? "Pause Simulation" : "Play Simulation"}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <RotateCcw size={14} className="text-purple-400" /> Reset Chamber
                </button>
              </div>
            </div>

            {/* Slider Control Deck */}
            <div className="p-5 rounded-2xl border border-white/5 bg-white/2 backdrop-blur-md space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">
                  Chemical Parameters
                </h3>
                <span className="text-xs text-gray-500 font-mono">CALIBRATING MOLECULAR FORCES</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {activeSim === "bonding" && (
                  <div className="space-y-1.5 col-span-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-400">Chemical Bond Model</span>
                      <span className="text-emerald-400 font-bold font-mono">{params.bondType}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {["Covalent", "Ionic"].map((b) => (
                        <button
                          key={b}
                          onClick={() => updateParam("bondType", b)}
                          className="flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded border transition-colors cursor-pointer"
                          style={{
                            background: params.bondType === b ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.02)",
                            borderColor: params.bondType === b ? "#10b981" : "rgba(255,255,255,0.08)",
                            color: params.bondType === b ? "#34d399" : "#94a3b8"
                          }}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeSim === "crystal" && (
                  <div className="space-y-1.5 col-span-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-400">Lattice Zoom Scale</span>
                      <span className="text-emerald-400 font-bold font-mono">{(params.naclScale * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range" min="0.8" max="1.5" step="0.1" value={params.naclScale} 
                      onChange={(e) => updateParam("naclScale", parseFloat(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer h-1 rounded-lg bg-white/5"
                    />
                  </div>
                )}

                {activeSim === "equilibrium" && (
                  <div className="space-y-1.5 col-span-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-400">Equilibrium Pressure Shift (Le Chatelier)</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        {params.eqShift === 0 ? "Balanced" : params.eqShift > 0 ? "Shifted to Products (Right)" : "Shifted to Reactants (Left)"}
                      </span>
                    </div>
                    <input 
                      type="range" min="-2" max="2" step="1" value={params.eqShift} 
                      onChange={(e) => updateParam("eqShift", parseInt(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer h-1 rounded-lg bg-white/5"
                    />
                  </div>
                )}

                {activeSim === "states" && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-400">Chamber Temp</span>
                        <span className="text-purple-400 font-bold font-mono">{params.temp} K</span>
                      </div>
                      <input 
                        type="range" min="200" max="800" step="20" value={params.temp} 
                        onChange={(e) => updateParam("temp", parseFloat(e.target.value))}
                        className="w-full accent-purple-400 cursor-pointer h-1 rounded-lg bg-white/5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-400">Pressure</span>
                        <span className="text-purple-400 font-bold font-mono">{params.pressure} atm</span>
                      </div>
                      <input 
                        type="range" min="0.5" max="4.0" step="0.1" value={params.pressure} 
                        onChange={(e) => updateParam("pressure", parseFloat(e.target.value))}
                        className="w-full accent-purple-400 cursor-pointer h-1 rounded-lg bg-white/5"
                      />
                    </div>
                  </>
                )}

                {activeSim === "titration" && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-400">Buret Flow Rate</span>
                        <span className="text-cyan-400 font-bold font-mono">{params.flowRate} mL/sec</span>
                      </div>
                      <input 
                        type="range" min="0.2" max="3.0" step="0.2" value={params.flowRate} 
                        onChange={(e) => updateParam("flowRate", parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-1 rounded-lg bg-white/5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-400">Acid Concentration</span>
                        <span className="text-cyan-400 font-bold font-mono">{params.acidConcentration} M</span>
                      </div>
                      <input 
                        type="range" min="0.05" max="0.5" step="0.05" value={params.acidConcentration} 
                        onChange={(e) => updateParam("acidConcentration", parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-1 rounded-lg bg-white/5"
                      />
                    </div>
                  </>
                )}

                {activeSim === "phvisual" && (
                  <div className="space-y-1.5 col-span-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-400">Concentration Level (pH)</span>
                      <span className="text-emerald-400 font-bold font-mono">pH = {params.phLevel.toFixed(1)}</span>
                    </div>
                    <input 
                      type="range" min="0.0" max="14.0" step="0.1" value={params.phLevel} 
                      onChange={(e) => updateParam("phLevel", parseFloat(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer h-1 rounded-lg bg-white/5"
                    />
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Right Panel: AI ARIA Advisor & Governing Formula HUD (3 Columns) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Professor ARIA's HUD */}
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-cyan-500/2 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 blur-xl rounded-full" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base bg-emerald-500/10 border border-emerald-500/20 animate-pulse">🤖</div>
                <div>
                  <p className="text-sm font-bold text-emerald-300">Professor ARIA</p>
                  <p className="text-[10px] text-gray-500">Live AI Assistant Stream</p>
                </div>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed min-h-[60px]" style={{ fontFamily: "Outfit" }}>
                {ariaInsight}
              </p>
              
              <button
                onClick={handleAskAria}
                className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-white flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 hover:scale-[1.01] transition-transform cursor-pointer"
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
              className="p-4 rounded-xl border border-white/5 bg-white/2 space-y-3 flex-1 flex flex-col justify-between cursor-pointer hover:border-emerald-500/30 transition-all group relative"
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded text-[8px] font-mono text-emerald-300">
                ZOOM DIAGNOSTIC
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono uppercase tracking-wider">
                  <Activity size={14} className="text-emerald-400" /> Titration Tracker
                </h4>
                <p className="text-[10px] text-gray-500 mt-0.5">Equivalence pH curve analyzer (Click to expand)</p>
              </div>

              <div className="h-[120px] w-full mt-2 relative">
                {activeSim === "titration" && chartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                      <XAxis dataKey="volume" stroke="rgba(255,255,255,0.15)" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.15)" fontSize={9} tickLine={false} axisLine={false} domain={[0, 14]} />
                      <Tooltip 
                        contentStyle={{ background: "rgba(10,5,25,0.95)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px", fontSize: "11px" }} 
                      />
                      <Area type="monotone" dataKey="pH" stroke="#10b981" fill="rgba(16,185,129,0.1)" strokeWidth={1.5} name="pH Value" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                    <Activity size={18} className="text-gray-600 animate-pulse mb-1" />
                    <span className="text-xs font-mono">
                      {activeSim === "titration" ? "AWAITING_BASE_FLOW..." : "ANALYTICS_IN_TITRATION_ONLY"}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      <footer className="max-w-7xl mx-auto w-full mt-6 text-xs text-gray-600 font-mono flex justify-between">
        <span>&copy; {new Date().getFullYear()} EDUMIND 3D CHEMISTRY SYSTEM.</span>
        <span>ALL CHANNELS ONLINE // 3D_RENDERING_ACTIVE</span>
      </footer>

      {/* Fullscreen Telemetry Diagnostic Modal */}
      <AnimatePresence>
        {isGraphFullscreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#020210]/95 backdrop-blur-2xl flex flex-col p-6 overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Activity size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white font-mono tracking-wider text-left">
                    CHEMICAL KINETICS DIAGNOSTIC GRID
                  </h2>
                  <p className="text-xs text-gray-400 text-left">Real-time variables projection & equilibrium titration plots</p>
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
                  <h3 className="text-sm font-bold text-emerald-400 font-mono uppercase tracking-widest mb-1 text-left">
                    Titration Curve & Reaction Plot
                  </h3>
                  <p className="text-xs text-gray-500 mb-4 text-left">Continuous molecular response tracking</p>
                </div>

                <div className="h-[400px] w-full mt-4">
                  {activeSim === "titration" && chartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="volume" stroke="rgba(255,255,255,0.3)" fontSize={11} name="Base Volume (mL)" />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} domain={[0, 14]} />
                        <Tooltip 
                          contentStyle={{ background: "rgba(10,5,25,0.95)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px", fontSize: "11px", color: "#fff" }} 
                        />
                        <Area type="monotone" dataKey="pH" stroke="#10b981" fill="rgba(16,185,129,0.15)" strokeWidth={2} name="pH Value" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 border border-white/5 rounded-xl bg-black/20">
                      <Activity size={32} className="text-gray-600 mb-2 animate-pulse" />
                      <span className="text-sm font-mono tracking-widest text-gray-400">
                        {activeSim === "titration" ? "AWAITING_BASE_FLOW..." : "ANALYTICS_IN_TITRATION_ONLY"}
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
                        {activeSim === "titration" ? "Add base drops from the buret to render titration curve" : "Select Acid-Base Titration simulation mode to inspect graph charts"}
                      </p>
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
                    {activeSim === "bonding" && "Tracks valence electron hybridization state differences."}
                    {activeSim === "crystal" && "Calculates unit cells packing parameters for NaCl FCC lattice structure."}
                    {activeSim === "equilibrium" && "Le Chatelier pressure shifts on forward/backward ammonia equilibrium yields."}
                    {activeSim === "states" && "Models ideal gas collision vectors under temperature & pressure."}
                    {activeSim === "titration" && "Monitors sigmoidal pH curves and equivalent volume concentration endpoints."}
                    {activeSim === "phvisual" && "Quantifies logarithm density vectors of hydronium and hydroxide ions."}
                  </p>
                </div>

                {/* Parameters Panel */}
                <div className="p-5 rounded-2xl border border-white/5 bg-white/2 space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                    Molecular Parameters
                  </h4>
                  <div className="space-y-3 text-xs font-mono">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-gray-400">Simulation Identifier</span>
                      <span className="text-emerald-400 uppercase font-bold">{activeSim}</span>
                    </div>

                    {/* Chemistry Parameters Detail */}
                    {activeSim === "bonding" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Selected Bond Model</span>
                          <span className="text-white font-bold">{params.bondType}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-2 text-emerald-400">
                          <span>Bond Energy (est)</span>
                          <span className="font-bold">{params.bondType === "Covalent" ? "436 kJ/mol" : "787 kJ/mol"}</span>
                        </div>
                        <div className="flex justify-between text-cyan-400">
                          <span>Interatomic Distance</span>
                          <span className="font-bold">{params.bondType === "Covalent" ? "74 pm" : "282 pm"}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-normal leading-relaxed mt-2 border-t border-white/5 pt-2 font-mono">
                          {params.bondType === "Covalent" 
                            ? "Hydrogen covalent atoms share valence electrons to achieve stable duet outer shells."
                            : "Sodium transfers an electron to Chlorine, creating electrostatic attraction in an ionic bond."}
                        </p>
                      </>
                    )}

                    {activeSim === "crystal" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Lattice Type</span>
                          <span className="text-white font-bold">Face-Centered Cubic (FCC)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Zoom Dimension</span>
                          <span className="text-white font-bold">{(params.naclScale * 100).toFixed(0)}% Scale</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Na⁺/Cl⁻ Coordination</span>
                          <span className="text-white font-bold">6 : 6 octahedrals</span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-2 text-emerald-400">
                          <span>Sodium Radius</span>
                          <span className="font-bold">102 pm</span>
                        </div>
                        <div className="flex justify-between text-cyan-400">
                          <span>Chlorine Radius</span>
                          <span className="font-bold">181 pm</span>
                        </div>
                      </>
                    )}

                    {activeSim === "equilibrium" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Ammonia Synthesis Yield</span>
                          <span className="text-white font-bold">{(15 + params.eqShift * 10)}% conversion</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Active Shift Coeff</span>
                          <span className="text-amber-400 font-bold">{params.eqShift > 0 ? "Products (Right)" : params.eqShift < 0 ? "Reactants (Left)" : "Balanced"}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-normal leading-relaxed mt-2 border-t border-white/5 pt-2 font-mono">
                          According to Le Chatelier's Principle, increasing pressure drives the equilibrium toward the side with fewer gas molecules (the products, NH₃).
                        </p>
                      </>
                    )}

                    {activeSim === "states" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Chamber Temperature</span>
                          <span className="text-white font-bold">{params.temp} Kelvin (K)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Chamber Pressure</span>
                          <span className="text-white font-bold">{params.pressure} atm</span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-2 text-emerald-400">
                          <span>Avg Particle Velocity</span>
                          <span className="font-bold">{(Math.sqrt(3 * 8.314 * params.temp / 0.032)).toFixed(1)} m/s</span>
                        </div>
                        <div className="flex justify-between text-cyan-400">
                          <span>Calculated PV term</span>
                          <span className="font-bold">{(params.pressure * 22.4 * (params.temp/273)).toFixed(2)} L·atm</span>
                        </div>
                      </>
                    )}

                    {activeSim === "titration" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Acid Concentration (M_a)</span>
                          <span className="text-white font-bold">{params.acidConcentration} M</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Base Conc (M_b)</span>
                          <span className="text-white font-bold">0.10 M</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Buret Flow Rate</span>
                          <span className="text-white font-bold">{params.flowRate} mL/sec</span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-2 text-emerald-400">
                          <span>Equivalence Volume (V_eq)</span>
                          <span className="font-bold">{(25.0 * params.acidConcentration / 0.10).toFixed(2)} mL</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-normal leading-relaxed mt-2 border-t border-white/5 pt-2 font-mono">
                          Phenolphthalein indicator undergoes a structural color change, morphing from clear to vibrant pink between pH 8.2 and 10.0.
                        </p>
                      </>
                    )}

                    {activeSim === "phvisual" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">pH Concentration Index</span>
                          <span className="text-white font-bold">pH = {params.phLevel.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-2 text-emerald-400">
                          <span>[H₃O⁺] Hydronium density</span>
                          <span className="font-bold">{Math.pow(10, -params.phLevel).toExponential(2)} mol/L</span>
                        </div>
                        <div className="flex justify-between text-cyan-400">
                          <span>[OH⁻] Hydroxide density</span>
                          <span className="font-bold">{Math.pow(10, -(14 - params.phLevel)).toExponential(2)} mol/L</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-normal leading-relaxed mt-2 border-t border-white/5 pt-2 font-mono">
                          The ion product of water Kw = [H₃O⁺][OH⁻] remains constant at 1.0 × 10⁻¹⁴ mol²/L² at 25°C.
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
