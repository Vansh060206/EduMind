import { useEffect, useRef } from "react";
import * as THREE from "three";

const FORMULAS = ["E=mc²", "F=ma", "τ=r×F", "∫f(x)dx", "PV=nRT", "λ=h/p", "ω=2πf"];

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
    scene.fog = new THREE.FogExp2(0x030014, 0.035);

    const camera = new THREE.PerspectiveCamera(
      55,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      200
    );
    camera.position.set(0, 2, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Planet
    const planetGeo = new THREE.SphereGeometry(2.2, 32, 32);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      emissive: 0x312e81,
      emissiveIntensity: 0.4,
      metalness: 0.6,
      roughness: 0.35,
    });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    planet.position.set(6, -1, -8);
    scene.add(planet);

    const ringGeo = new THREE.TorusGeometry(3.2, 0.04, 8, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.35 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.5;
    ring.position.copy(planet.position);
    scene.add(ring);

    // Atoms (icosahedrons)
    const atoms = [];
    const atomCount = isMobile ? 8 : 16;
    for (let i = 0; i < atomCount; i++) {
      const geo = new THREE.IcosahedronGeometry(0.15 + Math.random() * 0.2, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xa855f7 : 0x06b6d4,
        emissive: i % 2 === 0 ? 0x581c87 : 0x0e7490,
        emissiveIntensity: 0.6,
        metalness: 0.8,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 12 - 4
      );
      mesh.userData = {
        speed: 0.003 + Math.random() * 0.008,
        axis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
      };
      scene.add(mesh);
      atoms.push(mesh);
    }

    // Neural network nodes
    const nodeCount = isMobile ? 40 : 80;
    const nodePositions = new Float32Array(nodeCount * 3);
    const nodeColors = new Float32Array(nodeCount * 3);
    for (let i = 0; i < nodeCount; i++) {
      nodePositions[i * 3] = (Math.random() - 0.5) * 24;
      nodePositions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      nodePositions[i * 3 + 2] = (Math.random() - 0.5) * 16 - 6;
      nodeColors[i * 3] = 0.4 + Math.random() * 0.6;
      nodeColors[i * 3 + 1] = 0.6 + Math.random() * 0.4;
      nodeColors[i * 3 + 2] = 1;
    }
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
    nodeGeo.setAttribute("color", new THREE.BufferAttribute(nodeColors, 3));
    const nodes = new THREE.Points(
      nodeGeo,
      new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.85 })
    );
    scene.add(nodes);

    // Neural connections
    const linePositions = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = nodePositions[i * 3] - nodePositions[j * 3];
        const dy = nodePositions[i * 3 + 1] - nodePositions[j * 3 + 1];
        const dz = nodePositions[i * 3 + 2] - nodePositions[j * 3 + 2];
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 4.5 && Math.random() > 0.55) {
          linePositions.push(
            nodePositions[i * 3], nodePositions[i * 3 + 1], nodePositions[i * 3 + 2],
            nodePositions[j * 3], nodePositions[j * 3 + 1], nodePositions[j * 3 + 2]
          );
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.15 })
    );
    scene.add(lines);

    // Ambient particles
    const particleCount = isMobile ? 600 : 1200;
    const pPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 30;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ size: 0.04, color: 0xc084fc, transparent: true, opacity: 0.5 })
    );
    scene.add(particles);

    // Lights
    scene.add(new THREE.AmbientLight(0x404080, 0.6));
    const keyLight = new THREE.PointLight(0xa855f7, 2, 50);
    keyLight.position.set(-5, 8, 10);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0x06b6d4, 1.5, 50);
    fillLight.position.set(8, -3, 5);
    scene.add(fillLight);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
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

      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      const scrollOffset = scrollRef.current * 0.002;
      camera.position.z = 14 - scrollOffset * 3;
      camera.position.y = 2 - scrollOffset + mouse.y * 0.8;
      camera.position.x = mouse.x * 1.5;
      camera.lookAt(0, 0, -2);

      planet.rotation.y = t * 0.08;
      ring.rotation.z = t * 0.05;

      atoms.forEach((atom) => {
        atom.rotateOnAxis(atom.userData.axis, atom.userData.speed);
        atom.position.y += Math.sin(t + atom.position.x) * 0.002;
      });

      particles.rotation.y = t * 0.02;
      nodes.rotation.y = t * 0.015;
      lines.rotation.y = t * 0.015;

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
      planetGeo.dispose();
      planetMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      nodeGeo.dispose();
      lineGeo.dispose();
      pGeo.dispose();
    };
  }, []);

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 z-0" aria-hidden="true" />
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden" aria-hidden="true">
        {FORMULAS.map((f, i) => (
          <span
            key={f}
            className="absolute text-[10px] sm:text-xs font-mono text-purple-300/20 select-none"
            style={{
              left: `${8 + (i * 13) % 84}%`,
              top: `${12 + (i * 17) % 76}%`,
              animation: `floatFormula ${6 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.7}s`,
            }}
          >
            {f}
          </span>
        ))}
      </div>
    </>
  );
}
