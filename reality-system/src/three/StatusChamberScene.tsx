/**
 * Optional 3D status chamber: the core at the centre, one crystal per
 * attribute (height follows its level), floor rings and subtle camera
 * parallax. Text is rendered as regular HTML around it for readability.
 */
import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CoreMesh } from './CoreMesh'
import type { Effects3D } from './effects'
import type { AvatarConfig } from '@/domain/settings'

export interface ChamberAttribute {
  id: string
  color: string
  level: number
}

function Rig({ animate }: { animate: boolean }) {
  useFrame((state) => {
    if (!animate) return
    const { camera, pointer } = state
    camera.position.x += (pointer.x * 1.2 - camera.position.x) * 0.04
    camera.position.y += (1.6 + pointer.y * 0.6 - camera.position.y) * 0.04
    camera.lookAt(0, 0.2, 0)
  })
  return null
}

function Crystals({ attributes, animate, highlight }: { attributes: ChamberAttribute[]; animate: boolean; highlight: string | null }) {
  const group = useRef<THREE.Group>(null)
  const geo = useMemo(() => new THREE.OctahedronGeometry(0.22, 0), [])
  useFrame((_, d) => {
    if (animate && group.current) group.current.rotation.y += d * 0.1
  })
  return (
    <group ref={group}>
      {attributes.map((a, i) => {
        const angle = (i / attributes.length) * Math.PI * 2
        const h = 0.4 + Math.min(10, a.level) * 0.12
        const lit = highlight === a.id
        return (
          <group key={a.id} position={[Math.cos(angle) * 3, -0.8, Math.sin(angle) * 3]}>
            <mesh geometry={geo} position={[0, h + 0.3, 0]} scale={lit ? 1.4 : 1}>
              <meshStandardMaterial color={a.color} emissive={a.color} emissiveIntensity={lit ? 2.2 : 0.9} flatShading />
            </mesh>
            <mesh position={[0, h / 2, 0]}>
              <cylinderGeometry args={[0.03, 0.03, h, 6]} />
              <meshBasicMaterial color={a.color} transparent opacity={0.6} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

export default function StatusChamberScene({
  fx,
  avatar,
  color,
  color2,
  attributes,
  highlight,
  onContextLost,
}: {
  fx: Effects3D
  avatar: AvatarConfig
  color: string
  color2: string
  attributes: ChamberAttribute[]
  highlight: string | null
  onContextLost: () => void
}) {
  return (
    <Canvas
      dpr={fx.dpr}
      frameloop={fx.animate ? 'always' : 'demand'}
      camera={{ position: [0, 1.6, 7.5], fov: 45 }}
      gl={{ antialias: fx.antialias, alpha: true }}
      onCreated={({ gl, camera }) => {
        camera.lookAt(0, 0.2, 0)
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onContextLost()
        })
      }}
      aria-hidden
    >
      <fog attach="fog" args={['#000000', 7, 16]} />
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 4, 3]} intensity={50} color={color} />
      <pointLight position={[-4, 1, -3]} intensity={30} color={color2} />
      <Rig animate={fx.animate} />
      <group position={[0, 0.4, 0]}>
        <CoreMesh shape={avatar.coreShape} particles={avatar.particles} color={color} color2={color2} emission={avatar.emission} rotationSpeed={fx.rotationSpeed} particleCount={fx.particleCount} animate={fx.animate} scale={0.9} />
      </group>
      <Crystals attributes={attributes} animate={fx.animate} highlight={highlight} />
      {[1.6, 3, 4.4].map((r, i) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.82, 0]}>
          <ringGeometry args={[r, r + 0.015, 96]} />
          <meshBasicMaterial color={i === 1 ? color : color2} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <gridHelper args={[16, 32, color2, '#1b2440']} position={[0, -0.84, 0]} />
    </Canvas>
  )
}
