import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { ReactNode, Suspense } from 'react';

interface Scene3DProps {
  children: ReactNode;
  enableControls?: boolean;
}

export function Scene3D({ children, enableControls = false }: Scene3DProps) {
  return (
    <Canvas
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: enableControls ? 'auto' : 'none',
      }}
      dpr={[1, 2]}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <spotLight position={[-10, 10, 10]} angle={0.3} penumbra={1} intensity={1} />
      
      <Suspense fallback={null}>
        {children}
      </Suspense>

      {enableControls && <OrbitControls enableZoom={false} enablePan={false} />}
    </Canvas>
  );
}
