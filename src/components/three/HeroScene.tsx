'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * "Vektor Core" — the Vektor Lab 3D signature.
 *
 * A helix of thin glass layers (products, systems, components) stacked around
 * a vertical vector beam, with small modules orbiting on a precision ring and
 * a quiet particle field for depth.
 *
 * Engineering notes
 *  - Loaded with next/dynamic (client only); WebGL is created only on pages that render it.
 *  - Pixel ratio capped; simplified geometry and fewer particles on small/low-power devices.
 *  - Animation pauses when the canvas is off-screen or the tab is hidden.
 *  - prefers-reduced-motion: no animation loop, a single static frame.
 *  - Pointer parallax listens on the hero section only (no global listeners).
 *  - Every geometry, material, observer and listener is disposed on unmount.
 */

interface Palette {
  primary: THREE.Color;
  secondary: THREE.Color;
  ink: THREE.Color;
  background: THREE.Color;
}

function readPalette(): Palette {
  const styles = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
  return {
    primary: new THREE.Color(get('--three-primary', '#8b9cff')),
    secondary: new THREE.Color(get('--three-secondary', '#62d6e8')),
    ink: new THREE.Color(get('--three-ink', '#dfe4ff')),
    background: new THREE.Color(get('--bg', '#07080a')),
  };
}

function roundedRectShape(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

export default function HeroScene({ onError }: { onError?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowPower =
      window.matchMedia('(max-width: 767px)').matches ||
      (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4) ||
      (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !lowPower, powerPreference: 'high-performance' });
    } catch {
      onErrorRef.current?.();
      return;
    }

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(item: T) => {
      disposables.push(item);
      return item;
    };

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
    camera.position.set(0, 0.15, 9.2);

    let palette = readPalette();
    scene.fog = new THREE.Fog(palette.background, 8.5, 16);

    const root = new THREE.Group();
    root.rotation.set(-0.12, -0.5, 0.08);
    scene.add(root);

    /* Layers — the product stack ------------------------------------- */
    const layerCount = lowPower ? 7 : 11;
    const layerGeometry = track(
      new THREE.ExtrudeGeometry(roundedRectShape(2.5, 1.55, 0.16), {
        depth: 0.035,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.012,
        bevelSegments: 2,
        curveSegments: 8,
      }),
    );
    layerGeometry.center();
    layerGeometry.rotateX(-Math.PI / 2);
    const edgeGeometry = track(new THREE.EdgesGeometry(layerGeometry, 30));

    const layerMaterial = track(
      new THREE.MeshPhysicalMaterial({
        color: palette.ink,
        metalness: 0.1,
        roughness: 0.32,
        clearcoat: 0.8,
        clearcoatRoughness: 0.3,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    const edgeMaterial = track(new THREE.LineBasicMaterial({ color: palette.primary, transparent: true, opacity: 0.55 }));
    const accentEdgeMaterial = track(new THREE.LineBasicMaterial({ color: palette.secondary, transparent: true, opacity: 0.95 }));

    // Tiny "content" strips on each layer, suggesting interface and documents.
    const stripGeometry = track(new THREE.PlaneGeometry(1, 0.045));
    stripGeometry.rotateX(-Math.PI / 2);
    const stripMaterial = track(new THREE.MeshBasicMaterial({ color: palette.ink, transparent: true, opacity: 0.22, depthWrite: false }));
    const stripAccentMaterial = track(new THREE.MeshBasicMaterial({ color: palette.primary, transparent: true, opacity: 0.85, depthWrite: false }));

    const layers: THREE.Group[] = [];
    const span = 3.3;
    for (let i = 0; i < layerCount; i++) {
      const t = i / (layerCount - 1);
      const layer = new THREE.Group();
      layer.position.y = -span / 2 + t * span;
      layer.rotation.y = t * Math.PI * 1.15;
      const isAccent = i === Math.floor(layerCount * 0.62);

      layer.add(new THREE.Mesh(layerGeometry, layerMaterial));
      layer.add(new THREE.LineSegments(edgeGeometry, isAccent ? accentEdgeMaterial : edgeMaterial));

      const strips = [
        { w: 0.7, x: -0.62, z: -0.48, accent: true },
        { w: 1.5, x: -0.25, z: -0.26, accent: false },
        { w: 1.1, x: -0.45, z: -0.08, accent: false },
        { w: 1.7, x: -0.15, z: 0.12, accent: false },
        { w: 0.9, x: -0.55, z: 0.3, accent: false },
      ];
      for (const strip of strips.slice(0, lowPower ? 3 : strips.length)) {
        const mesh = new THREE.Mesh(stripGeometry, strip.accent || isAccent ? stripAccentMaterial : stripMaterial);
        mesh.scale.x = strip.w;
        mesh.position.set(strip.x + strip.w / 2 - 0.5, 0.03, strip.z);
        layer.add(mesh);
      }
      root.add(layer);
      layers.push(layer);
    }

    /* Vector beam ----------------------------------------------------- */
    const beamGeometry = track(new THREE.CylinderGeometry(0.008, 0.008, span + 1.6, 6, 1, true));
    const beamMaterial = track(new THREE.MeshBasicMaterial({ color: palette.primary, transparent: true, opacity: 0.55 }));
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    root.add(beam);

    const pulseGeometry = track(new THREE.SphereGeometry(0.055, 16, 16));
    const pulseMaterial = track(new THREE.MeshBasicMaterial({ color: palette.secondary }));
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    root.add(pulse);

    const tipGeometry = track(new THREE.ConeGeometry(0.07, 0.2, 12));
    const tip = new THREE.Mesh(tipGeometry, beamMaterial);
    tip.position.y = span / 2 + 0.9;
    root.add(tip);

    /* Orbit ring with modules ------------------------------------------ */
    const ring = new THREE.Group();
    ring.rotation.set(Math.PI / 2.35, 0, 0.18);
    root.add(ring);

    const ringRadius = 2.75;
    const ringGeometry = track(new THREE.TorusGeometry(ringRadius, 0.0045, 6, 160));
    const ringMaterial = track(new THREE.MeshBasicMaterial({ color: palette.ink, transparent: true, opacity: 0.28 }));
    ring.add(new THREE.Mesh(ringGeometry, ringMaterial));

    const outerRingGeometry = track(new THREE.TorusGeometry(ringRadius * 1.22, 0.003, 6, 180));
    const outerRing = new THREE.Mesh(outerRingGeometry, ringMaterial);
    outerRing.rotation.x = 0.35;
    ring.add(outerRing);

    const moduleCount = lowPower ? 14 : 26;
    const moduleGeometry = track(new THREE.BoxGeometry(0.075, 0.075, 0.075));
    const moduleMaterial = track(new THREE.MeshStandardMaterial({ color: palette.ink, metalness: 0.6, roughness: 0.3 }));
    const modules = new THREE.InstancedMesh(moduleGeometry, moduleMaterial, moduleCount);
    ring.add(modules);
    const moduleOffsets = Array.from({ length: moduleCount }, (_, i) => (i / moduleCount) * Math.PI * 2 + (i % 3) * 0.05);
    const dummy = new THREE.Object3D();
    const placeModules = (time: number) => {
      for (let i = 0; i < moduleCount; i++) {
        const angle = moduleOffsets[i] + time * 0.09;
        dummy.position.set(Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius, 0);
        dummy.rotation.set(angle, angle * 0.7, 0);
        const s = i % 5 === 0 ? 1.6 : 1;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        modules.setMatrixAt(i, dummy.matrix);
      }
      modules.instanceMatrix.needsUpdate = true;
    };

    /* Particle field --------------------------------------------------- */
    const particleCount = reducedMotionQuery.matches ? 90 : lowPower ? 160 : 520;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 3.6 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.cos(phi) * 0.7;
      particlePositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    const particleGeometry = track(new THREE.BufferGeometry());
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = track(
      new THREE.PointsMaterial({ color: palette.ink, size: 0.022, sizeAttenuation: true, transparent: true, opacity: 0.55, depthWrite: false }),
    );
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    /* Lights ------------------------------------------------------------ */
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(4, 6, 6);
    const rim = new THREE.PointLight(palette.primary, 18, 14, 2);
    rim.position.set(-3.5, 1.5, -2);
    const fill = new THREE.PointLight(palette.secondary, 8, 12, 2);
    fill.position.set(3, -2.5, 2.5);
    scene.add(ambient, key, rim, fill);

    /* Theme ------------------------------------------------------------- */
    const applyPalette = () => {
      palette = readPalette();
      (scene.fog as THREE.Fog).color.copy(palette.background);
      layerMaterial.color.copy(palette.ink);
      edgeMaterial.color.copy(palette.primary);
      accentEdgeMaterial.color.copy(palette.secondary);
      stripMaterial.color.copy(palette.ink);
      stripAccentMaterial.color.copy(palette.primary);
      beamMaterial.color.copy(palette.primary);
      pulseMaterial.color.copy(palette.secondary);
      ringMaterial.color.copy(palette.ink);
      moduleMaterial.color.copy(palette.ink);
      particleMaterial.color.copy(palette.ink);
      rim.color.copy(palette.primary);
      fill.color.copy(palette.secondary);
      const light = document.documentElement.getAttribute('data-theme') === 'light';
      layerMaterial.opacity = light ? 0.1 : 0.14;
      particleMaterial.opacity = light ? 0.35 : 0.55;
      requestRender();
    };
    const themeObserver = new MutationObserver(applyPalette);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    /* Sizing ------------------------------------------------------------ */
    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      // Keep the composition framed on narrow viewports.
      camera.position.z = width / height < 0.9 ? 11.5 : 9.2;
      camera.updateProjectionMatrix();
      requestRender();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    /* Interaction (scoped to the hero section) --------------------------- */
    const interactionTarget = (container.closest('[data-hero]') as HTMLElement | null) ?? container;
    const pointer = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const rect = interactionTarget.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    };
    const onPointerLeave = () => {
      pointer.x = 0;
      pointer.y = 0;
    };
    interactionTarget.addEventListener('pointermove', onPointerMove, { passive: true });
    interactionTarget.addEventListener('pointerleave', onPointerLeave);

    /* Loop ---------------------------------------------------------------- */
    const timer = new THREE.Timer();
    let frame = 0;
    let visible = true;
    let reduced = reducedMotionQuery.matches;
    let elapsed = 0;

    const pose = (time: number, delta: number) => {
      const ease = 1 - Math.pow(0.0015, delta);
      eased.x += (pointer.x - eased.x) * ease;
      eased.y += (pointer.y - eased.y) * ease;

      // Section-based parallax: gentle lift as the hero scrolls away (no scroll hijacking).
      const rect = interactionTarget.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));

      root.rotation.y = -0.5 + time * 0.06 + eased.x * 0.28;
      root.rotation.x = -0.12 + eased.y * 0.12 + progress * 0.15;
      root.position.y = Math.sin(time * 0.5) * 0.06 + progress * 0.9;

      layers.forEach((layer, index) => {
        layer.position.x = Math.sin(time * 0.6 + index * 0.55) * 0.035;
      });

      const travel = (time * 0.32) % 1;
      pulse.position.y = -span / 2 - 0.6 + travel * (span + 1.4);
      pulse.scale.setScalar(0.7 + Math.sin(travel * Math.PI) * 0.6);

      ring.rotation.z = 0.18 + time * 0.03;
      placeModules(time);
      particles.rotation.y = time * 0.012;
    };

    const renderFrame = () => {
      frame = 0;
      if (!visible || document.hidden) return;
      timer.update();
      const delta = Math.min(timer.getDelta(), 0.05);
      if (!reduced) elapsed += delta;
      pose(elapsed, reduced ? 1 : delta);
      renderer.render(scene, camera);
      if (!reduced) frame = requestAnimationFrame(renderFrame);
    };

    function requestRender() {
      if (frame) return;
      frame = requestAnimationFrame(renderFrame);
    }

    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          timer.update();
          requestRender();
        }
      },
      { threshold: 0.01 },
    );
    intersection.observe(container);

    const onVisibility = () => {
      if (!document.hidden) {
        timer.update();
        requestRender();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onReducedMotionChange = () => {
      reduced = reducedMotionQuery.matches;
      requestRender();
    };
    reducedMotionQuery.addEventListener('change', onReducedMotionChange);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      onErrorRef.current?.();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    placeModules(0);
    resize();
    renderer.domElement.style.opacity = '0';
    renderer.domElement.style.transition = 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
    requestAnimationFrame(() => {
      renderer.domElement.style.opacity = '1';
      container.dataset.ready = 'true';
    });

    return () => {
      cancelAnimationFrame(frame);
      intersection.disconnect();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMotionQuery.removeEventListener('change', onReducedMotionChange);
      interactionTarget.removeEventListener('pointermove', onPointerMove);
      interactionTarget.removeEventListener('pointerleave', onPointerLeave);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      timer.dispose();
      modules.dispose();
      disposables.forEach((item) => item.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" />;
}
