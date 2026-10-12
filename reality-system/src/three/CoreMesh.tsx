/**
 * The central system core: a programmatically generated, multi-layered
 * crystalline object with orbit rings and particles. No imported models.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { AvatarConfig } from '@/domain/settings'

export interface CoreProps {
  shape: AvatarConfig['coreShape']
  particles: AvatarConfig['particles']
  color: string
  color2: string
  emission: number
  rotationSpeed: number
  particleCount: number
  animate: boolean
  /** change this value to trigger a pulse (e.g. on level-up) */
  pulseKey?: number
  onActivate?: () => void
  scale?: number
}

function geometryFor(shape: AvatarConfig['coreShape']): THREE.BufferGeometry {
  switch (shape) {
    case 'octahedron':
      return new THREE.OctahedronGeometry(1, 0)
    case 'dodecahedron':
      return new THREE.DodecahedronGeometry(1, 0)
    case 'torus-knot':
      return new THREE.TorusKnotGeometry(0.62, 0.2, 140, 18)
    case 'prism':
      return new THREE.CylinderGeometry(0.85, 0.85, 1.5, 6, 1)
    default:
      return new THREE.IcosahedronGeometry(1, 0)
  }
}

function particlePositions(count: number, mode: AvatarConfig['particles']): Float32Array {
  const arr = new Float32Array(count * 3)
  let seed = 1234
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  for (let i = 0; i < count; i++) {
    let x: number, y: number, z: number
    if (mode === 'halo') {
      const a = rand() * Math.PI * 2
      const r = 1.9 + rand() * 0.35
      x = Math.cos(a) * r
      y = (rand() - 0.5) * 0.18
      z = Math.sin(a) * r
    } else {
      const u = rand() * 2 - 1
      const t = rand() * Math.PI * 2
      const r = (mode === 'sparks' ? 1.4 : 1.8) + rand() * 1.1
      const s = Math.sqrt(1 - u * u)
      x = s * Math.cos(t) * r
      y = u * r * 0.8
      z = s * Math.sin(t) * r
    }
    arr.set([x, y, z], i * 3)
  }
  return arr
}

export function CoreMesh({ shape, particles, color, color2, emission, rotationSpeed, particleCount, animate, pulseKey = 0, onActivate, scale = 1 }: CoreProps) {
  const group = useRef<THREE.Group>(null)
  const ringA = useRef<THREE.Mesh>(null)
  const ringB = useRef<THREE.Mesh>(null)
  const points = useRef<THREE.Points>(null)
  const coreMat = useRef<THREE.MeshStandardMaterial>(null)
  const invalidate = useThree((s) => s.invalidate)
  const [hover, setHover] = useState(false)
  const drag = useRef({ active: false, moved: 0, x: 0, y: 0 })
  const pulse = useRef(0)
  const firstPulse = useRef(true)

  const geometry = useMemo(() => geometryFor(shape), [shape])
  const shell = useMemo(() => new THREE.EdgesGeometry(geometryFor(shape === 'torus-knot' ? 'icosahedron' : shape)), [shape])
  const positions = useMemo(() => particlePositions(particleCount, particles), [particleCount, particles])

  // Dispose GPU resources created outside JSX when they change or unmount.
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => shell.dispose(), [shell])

  useEffect(() => {
    if (firstPulse.current) {
      firstPulse.current = false
      return
    }
    pulse.current = 1
    invalidate()
  }, [pulseKey, invalidate])

  useEffect(() => {
    document.body.style.cursor = hover ? 'pointer' : ''
    return () => {
      document.body.style.cursor = ''
    }
  }, [hover])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    if (!drag.current.active) {
      if (animate) g.rotation.y += dt * rotationSpeed
      // return smoothly to the resting tilt
      const restX = animate ? Math.sin(t * 0.35) * 0.12 : 0
      g.rotation.x += (restX - g.rotation.x) * Math.min(1, dt * 2.5)
      g.rotation.z += (0 - g.rotation.z) * Math.min(1, dt * 2.5)
    }
    g.position.y = animate ? Math.sin(t * 0.8) * 0.08 : 0
    pulse.current = Math.max(0, pulse.current - dt * 0.9)
    const s = scale * (1 + pulse.current * 0.22 + (hover ? 0.04 : 0))
    g.scale.setScalar(g.scale.x + (s - g.scale.x) * Math.min(1, dt * 8))
    if (coreMat.current) coreMat.current.emissiveIntensity = emission * (hover ? 1.7 : 1) + pulse.current * 2.5
    if (animate) {
      if (ringA.current) ringA.current.rotation.z += dt * 0.5
      if (ringB.current) ringB.current.rotation.x += dt * 0.35
      if (points.current) points.current.rotation.y -= dt * (particles === 'sparks' ? 0.25 : 0.08)
    }
    if (!animate && (pulse.current > 0 || drag.current.active)) invalidate()
  })

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    drag.current = { active: true, moved: 0, x: e.clientX, y: e.clientY }
  }
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!drag.current.active || !group.current) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    drag.current.x = e.clientX
    drag.current.y = e.clientY
    drag.current.moved += Math.abs(dx) + Math.abs(dy)
    group.current.rotation.y += dx * 0.01
    group.current.rotation.x += dy * 0.01
    invalidate()
  }
  const onUp = (e: ThreeEvent<PointerEvent>) => {
    ;(e.target as Element).releasePointerCapture?.(e.pointerId)
    const wasClick = drag.current.moved < 5
    drag.current.active = false
    invalidate()
    if (wasClick) onActivate?.()
  }

  return (
    <group ref={group}>
      <mesh
        geometry={geometry}
        onPointerOver={() => {
          setHover(true)
          invalidate()
        }}
        onPointerOut={() => {
          setHover(false)
          invalidate()
        }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
      >
        <meshStandardMaterial ref={coreMat} color={color} emissive={color} emissiveIntensity={emission} metalness={0.35} roughness={0.25} flatShading transparent opacity={0.92} />
      </mesh>
      <mesh geometry={geometry} scale={0.55}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
      </mesh>
      <lineSegments geometry={shell} scale={1.42}>
        <lineBasicMaterial color={color2} transparent opacity={0.45} />
      </lineSegments>
      <mesh ref={ringA} rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[1.75, 0.012, 8, 128]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
      <mesh ref={ringB} rotation={[0, Math.PI / 3, Math.PI / 4]}>
        <torusGeometry args={[2.05, 0.008, 8, 128]} />
        <meshBasicMaterial color={color2} transparent opacity={0.5} />
      </mesh>
      {particleCount > 0 && (
        <points ref={points} key={`${particles}-${particleCount}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          </bufferGeometry>
          <pointsMaterial color={color} size={0.035} sizeAttenuation transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
      )}
    </group>
  )
}
