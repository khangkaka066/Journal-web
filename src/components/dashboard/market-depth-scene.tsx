"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function MarketDepthScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const targetCanvas = canvas;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({
      canvas: targetCanvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(6.2, 5.2, 8.4);
    camera.lookAt(0, 0.2, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.78);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0x9fffd1, 1.35);
    keyLight.position.set(4, 7, 5);
    scene.add(keyLight);

    const grid = new THREE.GridHelper(12, 24, 0x2dd4bf, 0x334155);
    grid.position.y = -0.65;
    const gridMaterial = grid.material as THREE.Material;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.28;
    scene.add(grid);

    const group = new THREE.Group();
    scene.add(group);

    const upMaterial = new THREE.MeshStandardMaterial({
      color: 0x2ee59d,
      emissive: 0x0f6f4f,
      emissiveIntensity: 0.18,
      roughness: 0.42,
      metalness: 0.22,
    });
    const downMaterial = new THREE.MeshStandardMaterial({
      color: 0xff5b6e,
      emissive: 0x7f1d2d,
      emissiveIntensity: 0.14,
      roughness: 0.46,
      metalness: 0.18,
    });
    const railMaterial = new THREE.LineBasicMaterial({
      color: 0x8fffd1,
      transparent: true,
      opacity: 0.5,
    });
    const mutedRailMaterial = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.28,
    });

    const heights = [0.9, 1.25, 0.75, 1.8, 1.2, 2.55, 1.45, 2.15, 1.05, 1.55, 0.95, 1.35];
    const bars: THREE.Mesh[] = [];
    heights.forEach((height, index) => {
      const geometry = new THREE.BoxGeometry(0.34, height, 0.34);
      const mesh = new THREE.Mesh(geometry, index % 4 === 2 ? downMaterial : upMaterial);
      mesh.position.set(index * 0.56 - 3.1, height / 2 - 0.65, Math.sin(index * 0.75) * 0.72);
      mesh.rotation.y = index % 2 === 0 ? 0.18 : -0.1;
      group.add(mesh);
      bars.push(mesh);
    });

    for (let i = 0; i < 5; i += 1) {
      const y = -0.2 + i * 0.56;
      const points = [
        new THREE.Vector3(-3.7, y, -1.5 + i * 0.18),
        new THREE.Vector3(3.9, y + Math.sin(i) * 0.18, -1.15 + i * 0.14),
      ];
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        i === 3 ? railMaterial : mutedRailMaterial
      );
      group.add(line);
    }

    const sweepPoints = Array.from({ length: 80 }, (_, index) => {
      const t = index / 79;
      return new THREE.Vector3(
        -3.6 + t * 7.2,
        0.15 + Math.sin(t * Math.PI * 3) * 0.32,
        1.2 + Math.cos(t * Math.PI * 2) * 0.22
      );
    });
    const sweep = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(sweepPoints),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.62 })
    );
    group.add(sweep);

    let width = 0;
    let height = 0;
    let frame = 0;
    let animationId = 0;

    function resize() {
      const parent = targetCanvas.parentElement;
      if (!parent) return;

      const nextWidth = parent.clientWidth;
      const nextHeight = parent.clientHeight;
      if (nextWidth === width && nextHeight === height) return;

      width = nextWidth;
      height = nextHeight;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function render() {
      resize();
      if (!prefersReducedMotion) {
        frame += 0.012;
        group.rotation.y = Math.sin(frame * 0.55) * 0.08 - 0.28;
        group.rotation.x = Math.sin(frame * 0.35) * 0.025;
        bars.forEach((bar, index) => {
          bar.position.y += Math.sin(frame + index * 0.8) * 0.0018;
        });
      } else {
        group.rotation.y = -0.28;
      }
      renderer.render(scene, camera);

      if (!prefersReducedMotion) {
        animationId = requestAnimationFrame(render);
      }
    }

    const resizeObserver = new ResizeObserver(() => resize());
    if (targetCanvas.parentElement) resizeObserver.observe(targetCanvas.parentElement);
    render();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      renderer.dispose();
      grid.geometry.dispose();
      gridMaterial.dispose();
      upMaterial.dispose();
      downMaterial.dispose();
      railMaterial.dispose();
      mutedRailMaterial.dispose();
      bars.forEach((bar) => bar.geometry.dispose());
      sweep.geometry.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-market-depth-scene
      className="absolute inset-0 h-full w-full"
    />
  );
}
