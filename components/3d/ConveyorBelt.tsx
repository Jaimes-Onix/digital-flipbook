import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// Single animated box on conveyor
function ConveyorBox({ 
  startPosition, 
  speed, 
  color, 
  size = [0.8, 0.8, 0.8] 
}: { 
  startPosition: number; 
  speed: number; 
  color: string;
  size?: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startX = startPosition;

  useFrame((state) => {
    if (meshRef.current) {
      // Move from right to left, then loop back
      const time = state.clock.getElapsedTime() * speed;
      const x = ((startX - time) % 12) + 6; // Loop every 12 units
      meshRef.current.position.x = x > 6 ? x - 12 : x;
      
      // Subtle bounce
      meshRef.current.position.y = Math.sin(time * 2) * 0.05 + size[1] / 2 + 0.1;
      
      // Slight rotation
      meshRef.current.rotation.y = time * 0.1;
    }
  });

  return (
    <RoundedBox
      ref={meshRef}
      args={size}
      radius={0.08}
      smoothness={4}
      position={[startX, size[1] / 2 + 0.1, 0]}
    >
      <meshStandardMaterial 
        color={color} 
        roughness={0.3}
        metalness={0.1}
      />
    </RoundedBox>
  );
}

// Conveyor belt surface
function Belt() {
  const beltRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (beltRef.current) {
      // Animate belt texture offset to simulate movement
      const material = beltRef.current.material as THREE.MeshStandardMaterial;
      if (material.map) {
        material.map.offset.x = state.clock.getElapsedTime() * 0.2;
      }
    }
  });

  return (
    <mesh ref={beltRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[14, 2]} />
      <meshStandardMaterial 
        color="#2a2a2d"
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
}

// Conveyor frame/rails
function ConveyorFrame() {
  return (
    <group>
      {/* Left rail */}
      <RoundedBox args={[14, 0.15, 0.2]} radius={0.05} position={[0, 0.075, -1]} smoothness={4}>
        <meshStandardMaterial color="#e5e5e5" roughness={0.3} metalness={0.5} />
      </RoundedBox>
      {/* Right rail */}
      <RoundedBox args={[14, 0.15, 0.2]} radius={0.05} position={[0, 0.075, 1]} smoothness={4}>
        <meshStandardMaterial color="#e5e5e5" roughness={0.3} metalness={0.5} />
      </RoundedBox>
      {/* Support legs */}
      {[-5, -2, 1, 4].map((x) => (
        <group key={x}>
          <RoundedBox args={[0.15, 0.8, 0.15]} radius={0.03} position={[x, -0.4, -0.9]} smoothness={4}>
            <meshStandardMaterial color="#d4d4d4" roughness={0.4} metalness={0.3} />
          </RoundedBox>
          <RoundedBox args={[0.15, 0.8, 0.15]} radius={0.03} position={[x, -0.4, 0.9]} smoothness={4}>
            <meshStandardMaterial color="#d4d4d4" roughness={0.4} metalness={0.3} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

// Mini store/building decoration
function MiniStore({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main building */}
      <RoundedBox args={[1.2, 1.5, 1]} radius={0.15} position={[0, 0.75, 0]} smoothness={4}>
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
      </RoundedBox>
      {/* Roof/awning */}
      <mesh position={[0, 1.6, 0.3]}>
        <boxGeometry args={[1.4, 0.1, 0.6]} />
        <meshStandardMaterial color="#ff6b9d" roughness={0.3} />
      </mesh>
      {/* Door */}
      <RoundedBox args={[0.4, 0.7, 0.05]} radius={0.05} position={[0, 0.35, 0.53]} smoothness={4}>
        <meshStandardMaterial color="#8b5cf6" roughness={0.3} />
      </RoundedBox>
      {/* Window */}
      <RoundedBox args={[0.35, 0.35, 0.05]} radius={0.05} position={[0, 1.1, 0.53]} smoothness={4}>
        <meshStandardMaterial color="#93c5fd" roughness={0.1} metalness={0.5} />
      </RoundedBox>
    </group>
  );
}

// Floating coin
function FloatingCoin({ position }: { position: [number, number, number] }) {
  const coinRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (coinRef.current) {
      coinRef.current.rotation.y = state.clock.getElapsedTime() * 2;
      coinRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.15;
    }
  });

  return (
    <mesh ref={coinRef} position={position}>
      <cylinderGeometry args={[0.4, 0.4, 0.08, 32]} />
      <meshStandardMaterial color="#fbbf24" roughness={0.2} metalness={0.8} />
    </mesh>
  );
}

export function ConveyorBelt({ darkMode }: { darkMode: boolean }) {
  // Box configurations - different colors and speeds
  const boxes = [
    { startPosition: -4, speed: 0.4, color: '#f472b6', size: [0.7, 0.7, 0.7] as [number, number, number] },
    { startPosition: -1, speed: 0.4, color: '#a78bfa', size: [0.9, 0.9, 0.9] as [number, number, number] },
    { startPosition: 2, speed: 0.4, color: '#60a5fa', size: [0.6, 0.6, 0.6] as [number, number, number] },
    { startPosition: 5, speed: 0.4, color: '#34d399', size: [0.8, 0.8, 0.8] as [number, number, number] },
    { startPosition: 8, speed: 0.4, color: '#fbbf24', size: [0.75, 0.75, 0.75] as [number, number, number] },
    { startPosition: 11, speed: 0.4, color: '#f87171', size: [0.65, 0.65, 0.65] as [number, number, number] },
  ];

  return (
    <group position={[0, -1.5, -2]} rotation={[0.2, 0.3, 0]}>
      {/* Conveyor structure */}
      <Belt />
      <ConveyorFrame />
      
      {/* Animated boxes */}
      {boxes.map((box, i) => (
        <ConveyorBox key={i} {...box} />
      ))}
      
      {/* Decorative elements */}
      <MiniStore position={[-5, 0, 2.5]} />
      <FloatingCoin position={[4, 1.5, 2]} />
      
      {/* Ambient lighting for the scene */}
      <pointLight position={[0, 3, 2]} intensity={0.5} color="#ffffff" />
    </group>
  );
}
