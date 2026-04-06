import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

export function FloatingSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.getElapsedTime() * 0.15;
    }
  });

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.5}
      floatIntensity={1.5}
    >
      <Sphere ref={meshRef} args={[1.5, 64, 64]} scale={1.5}>
        <MeshDistortMaterial
          color="#ff006e"
          attach="material"
          distort={0.4}
          speed={1.5}
          roughness={0.1}
          metalness={0.9}
        />
      </Sphere>
    </Float>
  );
}
