import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";

const LabSceneCanvas = forwardRef(function LabSceneCanvas(_, ref) {
  const containerRef = useRef(null);
  const progressRef = useRef(0);
  const cameraRef = useRef(null);
  const moleculeRef = useRef(null);

  useImperativeHandle(ref, () => ({
    setProgress: (p) => {
      progressRef.current = p;
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030014, 0.04);

    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Molecule group — CH4-like tetrahedral
    const molecule = new THREE.Group();
    const atomColors = [0x06b6d4, 0xa855f7, 0x34d399, 0xf59e0b, 0xec4899];
    const positions = [
      [0, 0, 0],
      [1.2, 1.2, 1.2],
      [-1.2, -1.2, 1.2],
      [-1.2, 1.2, -1.2],
      [1.2, -1.2, -1.2],
    ];
    const atomMeshes = [];
    positions.forEach((pos, i) => {
      const geo = new THREE.SphereGeometry(i === 0 ? 0.55 : 0.35, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: atomColors[i],
        emissive: atomColors[i],
        emissiveIntensity: 0.3,
        metalness: 0.7,
        roughness: 0.25,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      molecule.add(mesh);
      atomMeshes.push(mesh);
    });

    for (let i = 1; i < positions.length; i++) {
      const start = new THREE.Vector3(...positions[0]);
      const end = new THREE.Vector3(...positions[i]);
      const dir = end.clone().sub(start);
      const len = dir.length();
      const geo = new THREE.CylinderGeometry(0.04, 0.04, len, 8);
      const mat = new THREE.MeshStandardMaterial({ color: 0x6366f1, emissive: 0x312e81, emissiveIntensity: 0.2 });
      const bond = new THREE.Mesh(geo, mat);
      bond.position.copy(start.clone().add(end).multiplyScalar(0.5));
      bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      molecule.add(bond);
    }

    scene.add(molecule);
    moleculeRef.current = molecule;

    // Orbiting electrons
    const electronCount = 12;
    const electrons = [];
    for (let i = 0; i < electronCount; i++) {
      const geo = new THREE.SphereGeometry(0.06, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
      const e = new THREE.Mesh(geo, mat);
      e.userData = { angle: (i / electronCount) * Math.PI * 2, radius: 2.5 + (i % 3) * 0.5, speed: 0.02 + i * 0.003 };
      scene.add(e);
      electrons.push(e);
    }

    scene.add(new THREE.AmbientLight(0x4040a0, 0.5));
    const pl = new THREE.PointLight(0xa855f7, 2, 30);
    pl.position.set(3, 3, 5);
    scene.add(pl);

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
      const p = progressRef.current;

      camera.position.x = Math.sin(p * Math.PI * 2) * 4;
      camera.position.y = Math.cos(p * Math.PI) * 2;
      camera.position.z = 6 + p * 4;
      camera.lookAt(0, 0, 0);

      molecule.rotation.y = t * 0.3 + p * Math.PI;
      molecule.rotation.x = Math.sin(t * 0.2) * 0.3;

      electrons.forEach((e) => {
        e.userData.angle += e.userData.speed;
        e.position.x = Math.cos(e.userData.angle) * e.userData.radius;
        e.position.z = Math.sin(e.userData.angle) * e.userData.radius;
        e.position.y = Math.sin(e.userData.angle * 2) * 0.8;
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 rounded-3xl overflow-hidden" aria-hidden="true" />;
});

export default LabSceneCanvas;
