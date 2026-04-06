import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

export function WireframeGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <group>
      <Sphere ref={meshRef} args={[2, 32, 32]}>
        <meshBasicMaterial
          color="#8338ec"
          wireframe
          transparent
          opacity={0.3}
        />
      </Sphere>
      <Sphere args={[1.95, 32, 32]}>
        <meshStandardMaterial
          color="#3a86ff"
          emissive="#3a86ff"
          emissiveIntensity={0.5}
          transparent
          opacity={0.1}
        />
      </Sphere>
      <pointLight position={[0, 0, 0]} intensity={1} color="#ffffff" />
    </group>
  );
}
