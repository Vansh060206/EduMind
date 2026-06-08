import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, Brain, Target, Compass, ArrowRight } from "lucide-react";

export default function AuthSlider() {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  // Floating text details for auto-rotating features
  const SLIDES = [
    {
      title: "AI-Powered Adaptive Mock Tests",
      desc: "Our XGBoost engine dynamically scales test difficulty based on your performance history to optimize cognitive memory retention.",
      icon: <Target className="w-5 h-5 text-purple-400" />
    },
    {
      title: "24/7 AI Doubt Solver (ARIA)",
      desc: "Get instant step-by-step solutions for complex Class 11-12 Physics and Chemistry concepts, powered by the Gemini API.",
      icon: <Brain className="w-5 h-5 text-cyan-400" />
    },
    {
      title: "3D Virtual Physics Simulations",
      desc: "Visualize complex electrostatic forces, rotational motion, and magnetic fields in real-time interactively.",
      icon: <Compass className="w-5 h-5 text-emerald-400" />
    }
  ];

  // Rotate features on the left overlay every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [SLIDES.length]);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();

    // --- Camera Setup ---
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 45);

    // --- Renderer Setup ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.domElement.style.pointerEvents = "none";
    containerRef.current.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xa855f7, 2, 80); // Purple light
    pointLight1.position.set(10, 10, 15);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x06b6d4, 2, 80); // Cyan light
    pointLight2.position.set(-10, -10, 15);
    scene.add(pointLight2);

    // --- 3D Holographic Bohr Atom Model ---
    const atomGroup = new THREE.Group();
    scene.add(atomGroup);

    // 1. Central Nucleus (Clustered Spheres)
    const nucleusGroup = new THREE.Group();
    const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const protonMaterial = new THREE.MeshPhongMaterial({
      color: 0xa855f7,
      emissive: 0x4c1d95,
      shininess: 100,
      flatShading: true
    });
    const neutronMaterial = new THREE.MeshPhongMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      shininess: 100,
      flatShading: true
    });

    const particlesCount = 14;
    for (let i = 0; i < particlesCount; i++) {
      const isProton = i % 2 === 0;
      const mesh = new THREE.Mesh(
        sphereGeometry,
        isProton ? protonMaterial : neutronMaterial
      );
      
      // Random position in a tight sphere cluster
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const dist = Math.random() * 1.1; // tight cluster radius
      
      mesh.position.set(
        dist * Math.sin(phi) * Math.cos(theta),
        dist * Math.sin(phi) * Math.sin(theta),
        dist * Math.cos(phi)
      );
      nucleusGroup.add(mesh);
    }
    atomGroup.add(nucleusGroup);

    // 2. Electron Orbits & Glowing Electrons
    const orbitsCount = 3;
    const orbitRadii = [6, 9, 12];
    const orbitAngles = [
      { x: 0.8, y: 0.5, z: 0.2 },
      { x: -0.6, y: 0.8, z: -0.4 },
      { x: 0.2, y: -0.3, z: 0.9 }
    ];

    const electronMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f6ff,
      transparent: true,
      opacity: 0.9
    });
    const electronGeom = new THREE.SphereGeometry(0.3, 16, 16);

    const orbitLines = [];
    const electrons = [];

    for (let i = 0; i < orbitsCount; i++) {
      // Draw Orbit Rings
      const ringGeometry = new THREE.RingGeometry(orbitRadii[i] - 0.05, orbitRadii[i] + 0.05, 64);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xa855f7 : 0x06b6d4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.15
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      
      // Apply custom orientation
      ringMesh.rotation.set(orbitAngles[i].x, orbitAngles[i].y, orbitAngles[i].z);
      atomGroup.add(ringMesh);
      orbitLines.push(ringMesh);

      // Create Electron Point Sphere
      const electronMesh = new THREE.Mesh(electronGeom, electronMaterial);
      atomGroup.add(electronMesh);
      electrons.push({
        mesh: electronMesh,
        radius: orbitRadii[i],
        angles: orbitAngles[i],
        speed: 1.5 + i * 0.8,
        offset: Math.random() * Math.PI * 2
      });
    }

    // --- Molecular Knowledge Graph Mesh ---
    const nodeCount = 45;
    const nodesGeom = new THREE.BufferGeometry();
    const nodePositions = new Float32Array(nodeCount * 3);
    const nodeVelocities = [];

    // Spread nodes in a large boundary box
    for (let i = 0; i < nodeCount; i++) {
      const idx = i * 3;
      nodePositions[idx] = (Math.random() - 0.5) * 35;     // X
      nodePositions[idx + 1] = (Math.random() - 0.5) * 35; // Y
      nodePositions[idx + 2] = (Math.random() - 0.5) * 20; // Z

      nodeVelocities.push({
        x: (Math.random() - 0.5) * 0.03,
        y: (Math.random() - 0.5) * 0.03,
        z: (Math.random() - 0.5) * 0.02
      });
    }

    nodesGeom.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));

    // Particle material for node points
    const nodesMaterial = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 0.4,
      transparent: true,
      opacity: 0.6
    });
    const nodesPoints = new THREE.Points(nodesGeom, nodesMaterial);
    scene.add(nodesPoints);

    // Setup lines to connect neighboring nodes dynamically
    const maxDistance = 7.5;
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.12
    });

    let networkLines = new THREE.LineSegments(new THREE.BufferGeometry(), lineMaterial);
    scene.add(networkLines);

    // --- Mouse Tracker for Parallax ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e) => {
      mouse.targetX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      mouse.targetY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    };
    window.addEventListener("mousemove", handleMouseMove);

    // --- Window Resize ---
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // --- Animation Loop ---
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // 1. Rotate entire Atom structure
      atomGroup.rotation.y = elapsed * 0.12;
      atomGroup.rotation.x = elapsed * 0.05;

      // Spin central nucleus locally
      nucleusGroup.rotation.y = -elapsed * 0.3;
      nucleusGroup.rotation.z = elapsed * 0.15;

      // 2. Animate electrons along orbits using parametric trig equations
      electrons.forEach((el) => {
        const time = elapsed * el.speed + el.offset;
        
        // Base coordinate in flat x-y space
        const localPos = new THREE.Vector3(
          Math.cos(time) * el.radius,
          Math.sin(time) * el.radius,
          0
        );

        // Apply orbit rotations manually to match ring meshes
        const euler = new THREE.Euler(el.angles.x, el.angles.y, el.angles.z);
        localPos.applyEuler(euler);

        el.mesh.position.copy(localPos);
      });

      // 3. Move and connect molecular mesh points
      const posArr = nodesGeom.attributes.position.array;
      const linePositions = [];

      for (let i = 0; i < nodeCount; i++) {
        const idx = i * 3;
        
        // Update coordinates
        posArr[idx] += nodeVelocities[i].x;
        posArr[idx + 1] += nodeVelocities[i].y;
        posArr[idx + 2] += nodeVelocities[i].z;

        // Boundary bounce check
        if (Math.abs(posArr[idx]) > 22) nodeVelocities[i].x *= -1;
        if (Math.abs(posArr[idx + 1]) > 22) nodeVelocities[i].y *= -1;
        if (Math.abs(posArr[idx + 2]) > 15) nodeVelocities[i].z *= -1;

        // Compare distance with other nodes to draw link lines
        for (let j = i + 1; j < nodeCount; j++) {
          const jdx = j * 3;
          const dx = posArr[idx] - posArr[jdx];
          const dy = posArr[idx + 1] - posArr[jdx + 1];
          const dz = posArr[idx + 2] - posArr[jdx + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < maxDistance) {
            linePositions.push(posArr[idx], posArr[idx + 1], posArr[idx + 2]);
            linePositions.push(posArr[jdx], posArr[jdx + 1], posArr[jdx + 2]);
          }
        }
      }
      nodesGeom.attributes.position.needsUpdate = true;

      // Update linked lines geometry
      networkLines.geometry.dispose();
      const lineGeom = new THREE.BufferGeometry();
      lineGeom.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
      networkLines.geometry = lineGeom;

      // 4. Parallax effect with mouse input
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      camera.position.x = mouse.x * 10;
      camera.position.y = -mouse.y * 10;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }

      // Dispose resources
      sphereGeometry.dispose();
      protonMaterial.dispose();
      neutronMaterial.dispose();
      electronGeom.dispose();
      electronMaterial.dispose();
      nodesGeom.dispose();
      nodesMaterial.dispose();
      lineMaterial.dispose();
      networkLines.geometry.dispose();
      renderer.dispose();
    };
  }, []);

  const handleStartLearning = () => {
    // Scroll or direct users: since the form is on the right pane, we can focus the email field
    const emailField = document.querySelector('input[type="email"]');
    if (emailField) {
      emailField.focus();
      // Add a subtle border glow pulse animation to guide user
      const card = emailField.closest(".relative");
      if (card) {
        card.style.boxShadow = "0 0 25px rgba(168,85,247,0.4)";
        setTimeout(() => {
          card.style.boxShadow = "none";
        }, 1500);
      }
    }
  };

  return (
    <div className="w-full h-full relative flex items-center justify-center p-12 bg-gradient-to-br from-[#04011d] to-[#010008]">
      
      {/* 3D Lab Canvas Container */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none select-none"
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03] z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_1.5px,transparent_1.5px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Floating glassmorphic card overlay */}
      <div className="relative z-20 w-full max-w-xl p-8 rounded-3xl border border-white/5 flex flex-col justify-between"
        style={{
          background: "rgba(255, 255, 255, 0.02)",
          backdropFilter: "blur(20px)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02), 0 30px 60px rgba(0,0,0,0.4)"
        }}
      >
        
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm bg-gradient-to-r from-purple-500 to-cyan-400">⚡</div>
          <span className="text-xl font-black tracking-wider text-white" style={{ fontFamily: "Poppins" }}>
            EduMind
          </span>
        </div>

        {/* Feature Carousel Section */}
        <div className="h-64 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex-1 flex flex-col justify-center"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  {SLIDES[activeTab].icon}
                </div>
                <span className="text-[10px] tracking-widest font-black uppercase text-purple-400 font-mono">
                  PLATFORM CORE SYSTEM
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight text-white mb-4" style={{ fontFamily: "Poppins" }}>
                {SLIDES[activeTab].title}
              </h1>

              <p className="text-sm text-gray-400 leading-relaxed max-w-lg">
                {SLIDES[activeTab].desc}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Indicator dots */}
          <div className="flex gap-2 mt-4">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: activeTab === i ? "24px" : "8px",
                  background: activeTab === i ? "linear-gradient(90deg,#a855f7,#06b6d4)" : "rgba(255,255,255,0.15)"
                }}
              />
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 pt-6 border-t border-white/5">
          <button
            onClick={handleStartLearning}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold tracking-widest uppercase text-black bg-gradient-to-r from-cyan-400 to-purple-500 shadow-md shadow-cyan-500/10 hover:scale-105 hover:shadow-cyan-500/20 transition-all duration-300 flex items-center justify-center gap-2"
          >
            Start Learning <ArrowRight size={14} />
          </button>
          
          <button
            onClick={() => navigate("/features")}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold tracking-widest uppercase text-white border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300"
          >
            Explore Features
          </button>
        </div>

      </div>

    </div>
  );
}