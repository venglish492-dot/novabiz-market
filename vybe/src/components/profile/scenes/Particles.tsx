'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from '@/lib/client/hooks';
import { CoverSvg, Layer, range } from './shared';
import { seeded } from '@/lib/client/hooks';

/**
 * A slowly rotating 3D particle vortex rendered with three.js. Loaded on demand;
 * falls back to a static SVG star swirl when WebGL is unavailable or motion is off.
 */
export function ParticlesScene({ animate, accent = '#8b9dff', secondary = '#b65cff' }: { animate: boolean; accent?: string; secondary?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const inView = useInView(mountRef);
  const [webgl, setWebgl] = useState<'pending' | 'ok' | 'off'>('pending');

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !animate) {
      setWebgl('off');
      return;
    }
    if (!inView) return;
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      const THREE = await import('three');
      if (disposed) return;
      let renderer: import('three').WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
      } catch {
        setWebgl('off');
        return;
      }
      setWebgl('ok');
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      mount.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
      camera.position.set(0, 2.2, 7.5);
      camera.lookAt(0, 0, 0);

      const count = window.innerWidth < 700 ? 6000 : 14000;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const a = new THREE.Color(accent);
      const b = new THREE.Color(secondary);
      const white = new THREE.Color('#ffffff');
      for (let i = 0; i < count; i++) {
        const arm = i % 3;
        const radius = Math.pow(Math.random(), 0.7) * 7 + 0.4;
        const angle = radius * 0.9 + (arm / 3) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
        positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.4;
        positions[i * 3 + 1] = (Math.random() - 0.5) * (0.6 + radius * 0.08);
        positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.4;
        const c = a.clone().lerp(b, Math.min(1, radius / 7)).lerp(white, Math.random() < 0.08 ? 0.7 : 0);
        colors.set([c.r, c.g, c.b], i * 3);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const material = new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
      const points = new THREE.Points(geometry, material);
      points.rotation.x = 0.35;
      scene.add(points);

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = mount;
        renderer.setSize(w, h, false);
        camera.aspect = w / Math.max(h, 1);
        camera.position.z = w < 600 ? 10 : 7.5;
        camera.updateProjectionMatrix();
      };
      resize();
      const observer = new ResizeObserver(resize);
      observer.observe(mount);
      let frame = 0;
      const tick = () => {
        if (!document.hidden) {
          points.rotation.y += 0.0009;
          renderer.render(scene, camera);
        }
        frame = requestAnimationFrame(tick);
      };
      tick();
      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();
    return () => {
      disposed = true;
      cleanup();
    };
    // inView toggles mount/unmount of the GL loop to save GPU when scrolled away.
  }, [animate, accent, secondary, inView]);

  const fallback = webgl !== 'ok';
  return (
    <>
      <Layer depth={0.03} style={{ background: 'radial-gradient(ellipse at 50% 45%, #0d1030 0%, #05060f 60%, #020208 100%)' }} />
      <Layer depth={0.12}>
        <div ref={mountRef} className="absolute inset-0" />
        {fallback && <StaticSwirl accent={accent} secondary={secondary} />}
      </Layer>
    </>
  );
}

function StaticSwirl({ accent, secondary }: { accent: string; secondary: string }) {
  const r = seeded(99);
  const dots = range(900).map((i) => {
    const radius = Math.pow(r(), 0.7) * 520 + 30;
    const angle = radius * 0.012 + ((i % 3) / 3) * Math.PI * 2 + (r() - 0.5) * 0.5;
    return { x: 800 + Math.cos(angle) * radius, y: 450 + Math.sin(angle) * radius * 0.42, s: 0.6 + r() * 1.6, c: r() < 0.5 ? accent : secondary, o: 0.3 + r() * 0.7 };
  });
  return (
    <CoverSvg>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.s} fill={d.c} opacity={d.o} />
      ))}
    </CoverSvg>
  );
}
