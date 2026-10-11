import { Canvas } from '@react-three/fiber'
import { CoreMesh, type CoreProps } from './CoreMesh'
import type { Effects3D } from './effects'

export interface SceneProps extends Omit<CoreProps, 'particleCount' | 'animate' | 'rotationSpeed'> {
  fx: Effects3D
  onContextLost: () => void
  accent2: string
}

/** Lazy-loaded WebGL scene for the dashboard/status core. */
export default function SystemCoreScene({ fx, onContextLost, accent2, ...core }: SceneProps) {
  return (
    <Canvas
      dpr={fx.dpr}
      frameloop={fx.animate ? 'always' : 'demand'}
      camera={{ position: [0, 0, 5.2], fov: 42 }}
      gl={{ antialias: fx.antialias, alpha: true, powerPreference: 'default' }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onContextLost()
        })
      }}
      aria-hidden
    >
      <ambientLight intensity={0.35} />
      <pointLight position={[3, 3, 4]} intensity={40} color={core.color} />
      <pointLight position={[-4, -2, 2]} intensity={25} color={accent2} />
      <CoreMesh {...core} particleCount={fx.particleCount} animate={fx.animate} rotationSpeed={fx.rotationSpeed} />
    </Canvas>
  )
}
