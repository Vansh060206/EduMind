import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeCanvas() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    
    // --- Camera Setup ---
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    // Position camera looking down towards the grid
    camera.position.set(0, 10, 35);

    // --- Renderer Setup ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.domElement.style.pointerEvents = "none";
    containerRef.current.appendChild(renderer.domElement);

        // --- Cyberpunk 3D Infinite Grid ---
    const gridSize = 200;
    const gridDivisions = 40;
    const gridColor1 = new THREE.Color(0x06b6d4); // Glowing Neon Cyan
    const gridColor2 = new THREE.Color(0x083344); // Dark Cyan lines

    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, gridColor1, gridColor2);
    gridHelper.position.y = -10;
    scene.add(gridHelper);

    // Add a secondary grid slightly offset for a double-layer cyber effect
    const gridHelper2 = new THREE.GridHelper(gridSize, gridDivisions, 0xa855f7, 0x1e152e); // Neon Purple
    gridHelper2.position.y = -9.9;
    gridHelper2.position.z = 2; // Offset
    scene.add(gridHelper2);

    // --- Matrix Rain Particles ---
    const rainCount = 1500;
    const positions = new Float32Array(rainCount * 3);
    const colors = new Float32Array(rainCount * 3);
    const speeds = new Float32Array(rainCount);

    const colorPurple = new THREE.Color(0xa855f7);
    const colorCyan = new THREE.Color(0x00f6ff);
    const colorDeepPurple = new THREE.Color(0x4c1d95);

    for (let i = 0; i < rainCount; i++) {
      const idx = i * 3;
      // Spread across a 3D box
      positions[idx] = (Math.random() - 0.5) * 80;     // X: left to right
      positions[idx + 1] = Math.random() * 60 - 15;     // Y: height
      positions[idx + 2] = (Math.random() - 0.5) * 60;   // Z: depth

      // Set speeds for falling effect
      speeds[i] = 0.15 + Math.random() * 0.25;

      // Color distribution (70% purple, 15% cyan, 15% deep purple)
      const rand = Math.random();
      let pColor = colorPurple;
      if (rand < 0.15) {
        pColor = colorCyan;
      } else if (rand > 0.85) {
        pColor = colorDeepPurple;
      }

      colors[idx] = pColor.r;
      colors[idx + 1] = pColor.g;
      colors[idx + 2] = pColor.b;
    }

    const rainGeometry = new THREE.BufferGeometry();
    rainGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    rainGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Custom glowing particle texture/material
    const rainMaterial = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    const rainParticles = new THREE.Points(rainGeometry, rainMaterial);
    scene.add(rainParticles);

    // --- Fog ---
    // Make the grid and rain fade out in the distance
    scene.fog = new THREE.FogExp2(0x05001a, 0.02);

    // --- Mouse Parallax Tracker ---
    const mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
    };

    const handleMouseMove = (event) => {
      mouse.targetX = (event.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      mouse.targetY = (event.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    };

    window.addEventListener("mousemove", handleMouseMove);

    // --- Window Resize ---
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // --- Animation Loop ---
    let animationFrameId;
    const gridStep = gridSize / gridDivisions;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // 1. Endless Scrolling Grid Animation
      // Move the grids along the z-axis to look like moving forward
      gridHelper.position.z += 0.12;
      gridHelper2.position.z += 0.12;

      // Wrap grids when they exceed division boundary
      if (gridHelper.position.z > gridStep) {
        gridHelper.position.z = 0;
      }
      if (gridHelper2.position.z > gridStep) {
        gridHelper2.position.z = 0;
      }

      // 2. Falling Matrix Code Rain Animation
      const posArr = rainGeometry.attributes.position.array;
      for (let i = 0; i < rainCount; i++) {
        const yIdx = i * 3 + 1;
        // Fall down
        posArr[yIdx] -= speeds[i];

        // Wrap around when hitting the bottom floor
        if (posArr[yIdx] < -10) {
          posArr[yIdx] = 45; // reset to top height
          // randomize X and Z slightly on reset for variety
          posArr[i * 3] = (Math.random() - 0.5) * 80;
          posArr[i * 3 + 2] = (Math.random() - 0.5) * 60;
        }
      }
      rainGeometry.attributes.position.needsUpdate = true;

      // 3. Smooth Camera Parallax based on Mouse
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Move camera slightly
      camera.position.x = mouse.x * 12;
      camera.position.y = 8 - mouse.y * 6; // height look angles
      
      // Rotate grid helpers slightly to augment depth illusion
      gridHelper.rotation.y = mouse.x * 0.06;
      gridHelper2.rotation.y = mouse.x * 0.06;

      // Camera looks at center point of grid runway
      camera.lookAt(new THREE.Vector3(0, -3, -10));

      renderer.render(scene, camera);
    };

    animate();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }

      gridHelper.geometry.dispose();
      gridHelper.material.dispose();
      gridHelper2.geometry.dispose();
      gridHelper2.material.dispose();
      rainGeometry.dispose();
      rainMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden"
    />
  );
}
