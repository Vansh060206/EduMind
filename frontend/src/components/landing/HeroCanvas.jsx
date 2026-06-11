import { useEffect, useRef } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";

const FORMULAS = ["E=mc²", "F=ma", "τ=r×F", "∫f(x)dx", "PV=nRT", "λ=h/p", "ω=2πf", "ψ(x,t)"];

export default function HeroCanvas({ scrollY = 0 }) {
  const containerRef = useRef(null);
  const scrollRef = useRef(scrollY);

  useEffect(() => {
    scrollRef.current = scrollY;
  }, [scrollY]);

  useEffect(() => {
    if (!containerRef.current) return;

    const isMobile = window.innerWidth < 768;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030014, 0.045);

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      200
    );
    camera.position.set(0, 2, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Dynamic Cosmic Vortex Particle System
    const particleCount = isMobile ? 1200 : 2500;
    const posArr = new Float32Array(particleCount * 3);
    const initialPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const dynamics = new Float32Array(particleCount); // lerp speeds & phases

    for (let i = 0; i < particleCount; i++) {
      // Logarithmic Spiral math: 2 interlocking spiral arms
      const r = (i / particleCount) * 11 + 0.3; // radius
      const theta = r * 3.5 + (i % 2 === 0 ? 0 : Math.PI); // angle for double arm
      const spread = (1.0 - (i / particleCount)) * 0.9 + 0.05; // spread out from arm core

      const x = Math.cos(theta) * r + (Math.random() - 0.5) * spread;
      const y = (Math.random() - 0.5) * spread * 0.5;
      const z = Math.sin(theta) * r + (Math.random() - 0.5) * spread;

      posArr[i * 3] = x;
      posArr[i * 3 + 1] = y;
      posArr[i * 3 + 2] = z;

      initialPositions[i * 3] = x;
      initialPositions[i * 3 + 1] = y;
      initialPositions[i * 3 + 2] = z;

      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = 0;

      dynamics[i] = 0.015 + Math.random() * 0.035;

      // Color transition: Deep Purple in center, glowing Indigo, cyan edges
      const ratio = i / particleCount;
      if (ratio < 0.3) {
        colors[i * 3] = 0.65; // R
        colors[i * 3 + 1] = 0.2; // G
        colors[i * 3 + 2] = 1.0; // B
      } else if (ratio < 0.7) {
        colors[i * 3] = 0.3;
        colors[i * 3 + 1] = 0.5;
        colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3] = 0.05;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 0.95;
      }
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Custom star texture using simple canvas rendering
    const createCircleTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext("2d");
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(0.3, "rgba(255, 255, 255, 0.8)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 16, 16);
      return new THREE.CanvasTexture(canvas);
    };

    const pMat = new THREE.PointsMaterial({
      size: isMobile ? 0.075 : 0.09,
      map: createCircleTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const vortexPoints = new THREE.Points(pGeo, pMat);
    scene.add(vortexPoints);

    // Glowing Core mesh
    const coreGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(0, 0, 0);
    scene.add(coreMesh);

    // Lights
    scene.add(new THREE.AmbientLight(0x0a051d, 0.8));
    const pointLight1 = new THREE.PointLight(0x7c3aed, 3, 30);
    pointLight1.position.set(-3, 2, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x06b6d4, 2, 30);
    pointLight2.position.set(3, -2, 5);
    scene.add(pointLight2);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);

    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    let frameId;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Mouse smoothing / lerping
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      // Projected mouse coordinates in 3D space
      const mx = mouse.x * 6;
      const my = mouse.y * 3.5;

      const posAttribute = pGeo.getAttribute("position");
      const positions = posAttribute.array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const px = positions[i3];
        const py = positions[i3 + 1];
        const pz = positions[i3 + 2];

        const ix = initialPositions[i3];
        const iy = initialPositions[i3 + 1];
        const iz = initialPositions[i3 + 2];

        // Cosmic rotation over time around Y-axis (home orbital paths)
        const angle = t * 0.04 * (1.0 + dynamics[i] * 5);
        const rotX = ix * Math.cos(angle) - iz * Math.sin(angle);
        const rotZ = ix * Math.sin(angle) + iz * Math.cos(angle);

        // Distance in X-Y plane between particle and mouse cursor
        const dx = mx - px;
        const dy = my - py;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let fx = 0;
        let fy = 0;

        if (dist < 4.0) {
          // Responsive gravity sweep force
          const strength = (4.0 - dist) * 0.06;
          // Direct attraction component
          fx += (dx / dist) * strength * 0.2;
          fy += (dy / dist) * strength * 0.2;
          // Vortex swirl orthogonal component (creates beautiful galaxy swirl)
          fx += (-dy / dist) * strength * 0.45;
          fy += (dx / dist) * strength * 0.45;
        }

        // Target target (spinning home path)
        const hdx = rotX - px;
        const hdy = iy - py;
        const hdz = rotZ - pz;

        // Apply physical spring damping
        const spring = 0.025 + dynamics[i] * 0.045;
        const friction = 0.91; // Smooth friction deceleration

        velocities[i3] = (velocities[i3] + hdx * spring + fx) * friction;
        velocities[i3 + 1] = (velocities[i3 + 1] + hdy * spring + fy) * friction;
        velocities[i3 + 2] = (velocities[i3 + 2] + hdz * spring) * friction;

        positions[i3] += velocities[i3];
        positions[i3 + 1] += velocities[i3 + 1];
        positions[i3 + 2] += velocities[i3 + 2];
      }

      posAttribute.needsUpdate = true;

      // Parallax scroll warp camera movement
      const scrollOffset = scrollRef.current * 0.007;
      camera.position.z = 14.0 - scrollOffset * 8.5; // fly into the center of the vortex!
      camera.position.y = 2.0 - scrollOffset * 1.5 + mouse.y * 0.6;
      camera.position.x = mouse.x * 1.2;
      camera.lookAt(0, -scrollOffset * 0.5, -scrollOffset * 4);

      coreMesh.scale.setScalar(1 + Math.sin(t * 2) * 0.15);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      pGeo.dispose();
      pMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
    };
  }, []);

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 z-0" aria-hidden="true" />
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden" aria-hidden="true">
        {FORMULAS.map((f, i) => (
          <span
            key={f}
            className="absolute text-[10px] sm:text-xs font-mono text-purple-300/20 select-none pointer-events-none"
            style={{
              left: `${10 + (i * 12) % 80}%`,
              top: `${15 + (i * 19) % 70}%`,
              animation: `floatFormula ${8 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            {f}
          </span>
        ))}
      </div>
    </>
  );
}
