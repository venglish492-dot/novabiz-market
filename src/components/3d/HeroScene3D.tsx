'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';

export default function HeroScene3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Color palettes based on theme
    const isNeon = theme === 'neon';
    const isLight = theme === 'light';

    const primaryColor = isNeon
      ? 0x00f5ff // Bright Cyan
      : isLight
      ? 0x4f46e5 // Indigo
      : 0x6366f1; // Vibrant Violet

    const secondaryColor = isNeon
      ? 0xff007f // Neon Magenta
      : isLight
      ? 0x06b6d4 // Cyan
      : 0x8b5cf6; // Purple

    const wireColor = isNeon
      ? 0x00ffcc
      : isLight
      ? 0x64748b
      : 0x38bdf8;

    // Groups
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Geometry 1: Central Icosahedron Crystal
    const icoGeo = new THREE.IcosahedronGeometry(1.6, 0);
    const icoMat = new THREE.MeshPhysicalMaterial({
      color: primaryColor,
      emissive: isNeon ? 0x003344 : 0x110e24,
      metalness: 0.2,
      roughness: 0.1,
      transmission: 0.6,
      thickness: 1.2,
      transparent: true,
      opacity: 0.88,
      wireframe: false
    });
    const icosahedron = new THREE.Mesh(icoGeo, icoMat);
    mainGroup.add(icosahedron);

    // Wireframe overlay for the central crystal
    const wireGeo = new THREE.IcosahedronGeometry(1.62, 0);
    const wireMat = new THREE.MeshBasicMaterial({
      color: wireColor,
      wireframe: true,
      transparent: true,
      opacity: isNeon ? 0.75 : 0.35
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    mainGroup.add(wireMesh);

    // Geometry 2: Orbiting Torus Ring
    const torusGeo = new THREE.TorusGeometry(2.5, 0.05, 16, 100);
    const torusMat = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      emissive: isNeon ? 0x330022 : 0x000000,
      metalness: 0.9,
      roughness: 0.1
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.rotation.x = Math.PI / 3;
    torus.rotation.y = Math.PI / 6;
    mainGroup.add(torus);

    // Geometry 3: Floating Satellites (Dodecahedron & Octahedron)
    const sat1Geo = new THREE.DodecahedronGeometry(0.4);
    const sat1Mat = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      metalness: 0.8,
      roughness: 0.2,
      wireframe: true
    });
    const sat1 = new THREE.Mesh(sat1Geo, sat1Mat);
    sat1.position.set(2.8, 1.2, -0.5);
    mainGroup.add(sat1);

    const sat2Geo = new THREE.OctahedronGeometry(0.45);
    const sat2Mat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.8,
      roughness: 0.2,
      wireframe: true
    });
    const sat2 = new THREE.Mesh(sat2Geo, sat2Mat);
    sat2.position.set(-2.6, -1.4, 0.4);
    mainGroup.add(sat2);

    // Particle Cloud / Starfield
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 16;
      particlePositions[i + 1] = (Math.random() - 0.5) * 16;
      particlePositions[i + 2] = (Math.random() - 0.5) * 12;
    }

    particleGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      color: isNeon ? 0x00ffff : isLight ? 0x6366f1 : 0xa5b4fc,
      transparent: true,
      opacity: 0.7
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isLight ? 1.4 : 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(primaryColor, isNeon ? 3.0 : 2.0);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(secondaryColor, isNeon ? 2.5 : 1.5);
    dirLight2.position.set(-5, -5, -2);
    scene.add(dirLight2);

    // Mouse & Scroll Interactivity
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.7;
      targetY = y * 0.7;
    };

    let scrollY = 0;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth Lerp Mouse Movement
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      // Rotate Main Group
      mainGroup.rotation.y = elapsedTime * 0.25 + currentX;
      mainGroup.rotation.x = Math.sin(elapsedTime * 0.2) * 0.15 + currentY;

      // Orbit Torus
      torus.rotation.z = elapsedTime * 0.4;

      // Floating Satellites
      sat1.position.y = 1.2 + Math.sin(elapsedTime * 1.5) * 0.2;
      sat1.rotation.y = elapsedTime * 0.8;
      sat1.rotation.x = elapsedTime * 0.5;

      sat2.position.y = -1.4 + Math.cos(elapsedTime * 1.2) * 0.2;
      sat2.rotation.y = -elapsedTime * 0.7;

      // Subtle Particle Drift
      particles.rotation.y = elapsedTime * 0.03;

      // Subtle Scroll Parallax
      const scrollFactor = Math.min(scrollY * 0.0015, 1.5);
      camera.position.y = -scrollFactor * 0.8;
      camera.position.z = 7 + scrollFactor * 0.5;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      icoGeo.dispose();
      icoMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      torusGeo.dispose();
      torusMat.dispose();
      sat1Geo.dispose();
      sat1Mat.dispose();
      sat2Geo.dispose();
      sat2Mat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}
