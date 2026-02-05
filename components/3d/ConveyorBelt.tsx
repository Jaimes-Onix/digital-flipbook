import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// Single animated book on conveyor
function ConveyorBook({ 
  startPosition, 
  speed, 
  coverColor,
  pagesColor = '#f5f5f0',
  spineColor,
}: { 
  startPosition: number; 
  speed: number; 
  coverColor: string;
  pagesColor?: string;
  spineColor?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const startX = startPosition;

  useFrame((state) => {
    if (groupRef.current) {
      // Move from right to left, then loop back
      const time = state.clock.getElapsedTime() * speed;
      const x = ((startX - time) % 12) + 6; // Loop every 12 units
      groupRef.current.position.x = x > 6 ? x - 12 : x;
      
      // Subtle bounce
      groupRef.current.position.y = Math.sin(time * 2) * 0.03 + 0.5;
      
      // Slight wobble rotation
      groupRef.current.rotation.z = Math.sin(time * 1.5) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[startX, 0.5, 0]}>
      {/* Book cover - front */}
      <RoundedBox args={[0.7, 1, 0.08]} radius={0.02} position={[0, 0, 0.21]} smoothness={4}>
        <meshStandardMaterial color={coverColor} roughness={0.4} metalness={0.1} />
      </RoundedBox>
      
      {/* Book cover - back */}
      <RoundedBox args={[0.7, 1, 0.08]} radius={0.02} position={[0, 0, -0.21]} smoothness={4}>
        <meshStandardMaterial color={coverColor} roughness={0.4} metalness={0.1} />
      </RoundedBox>
      
      {/* Book pages (inside) */}
      <RoundedBox args={[0.65, 0.95, 0.35]} radius={0.01} position={[0.02, 0, 0]} smoothness={4}>
        <meshStandardMaterial color={pagesColor} roughness={0.8} metalness={0} />
      </RoundedBox>
      
      {/* Book spine */}
      <RoundedBox args={[0.08, 1, 0.5]} radius={0.02} position={[-0.35, 0, 0]} smoothness={4}>
        <meshStandardMaterial color={spineColor || coverColor} roughness={0.3} metalness={0.2} />
      </RoundedBox>
      
      {/* Decorative line on cover */}
      <mesh position={[0, 0.3, 0.26]}>
        <boxGeometry args={[0.4, 0.03, 0.01]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.2, 0.26]}>
        <boxGeometry args={[0.3, 0.02, 0.01]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} metalness={0.3} opacity={0.7} transparent />
      </mesh>
    </group>
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
  // Book configurations - different colors representing different genres/categories
  const books = [
    { startPosition: -4, speed: 0.4, coverColor: '#8b5cf6', spineColor: '#7c3aed' }, // Purple - Fantasy
    { startPosition: -1, speed: 0.4, coverColor: '#3b82f6', spineColor: '#2563eb' }, // Blue - Education
    { startPosition: 2, speed: 0.4, coverColor: '#10b981', spineColor: '#059669' },  // Green - Nature
    { startPosition: 5, speed: 0.4, coverColor: '#f472b6', spineColor: '#ec4899' },  // Pink - Romance
    { startPosition: 8, speed: 0.4, coverColor: '#f59e0b', spineColor: '#d97706' },  // Orange - Adventure
    { startPosition: 11, speed: 0.4, coverColor: '#ef4444', spineColor: '#dc2626' }, // Red - Action
  ];

  return (
    <group position={[0, -1.5, -2]} rotation={[0.2, 0.3, 0]}>
      {/* Conveyor structure */}
      <Belt />
      <ConveyorFrame />
      
      {/* Animated books */}
      {books.map((book, i) => (
        <ConveyorBook key={i} {...book} />
      ))}
      
      {/* Decorative elements */}
      <MiniStore position={[-5, 0, 2.5]} />
      <FloatingCoin position={[4, 1.5, 2]} />
      
      {/* Ambient lighting for the scene */}
      <pointLight position={[0, 3, 2]} intensity={0.5} color="#ffffff" />
    </group>
  );
}
