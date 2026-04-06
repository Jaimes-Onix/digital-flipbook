import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// Conveyor object that moves in stepped intervals towards the light
function ConveyorObject({ 
  index, 
  type,
  color,
  secondaryColor,
}: { 
  index: number;
  type: 'cube' | 'gem' | 'platform' | 'book' | 'sphere';
  color: string;
  secondaryColor?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 8; // Total positions on the belt
  const stepDistance = 2.5; // Distance per step
  
  // Each object starts at a different position offset
  const baseOffset = index * 2;
  
  useEffect(() => {
    // Move every 1 second with step animation
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % (totalSteps + 4));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      // Calculate target position with stepped movement towards right (light)
      const actualStep = (currentStep + baseOffset) % (totalSteps + 4);
      const targetX = -8 + actualStep * stepDistance;
      
      // Smooth interpolation for the step movement
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        targetX,
        0.1
      );
      
      // Fade out as it approaches the light (right side)
      const fadeStart = 6;
      const opacity = targetX > fadeStart ? Math.max(0, 1 - (targetX - fadeStart) / 4) : 1;
      
      // Apply to all child materials
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat.opacity !== undefined) {
            mat.transparent = true;
            mat.opacity = opacity;
          }
        }
      });
      
      // Subtle float animation
      groupRef.current.position.y = 0.3 + Math.sin(state.clock.getElapsedTime() * 2 + index) * 0.05;
      
      // Gentle rotation
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.5 + index) * 0.1;
    }
  });

  const renderObject = () => {
    switch (type) {
      case 'cube':
        return (
          <group>
            <RoundedBox args={[0.6, 0.6, 0.6]} radius={0.08} smoothness={4}>
              <meshStandardMaterial color={color} roughness={0.2} metalness={0.6} />
            </RoundedBox>
            {/* Edge glow */}
            <mesh scale={1.02}>
              <boxGeometry args={[0.62, 0.62, 0.62]} />
              <meshBasicMaterial color={secondaryColor || color} transparent opacity={0.3} />
            </mesh>
          </group>
        );
      
      case 'gem':
        return (
          <group rotation={[0, Math.PI / 4, 0]}>
            <mesh>
              <octahedronGeometry args={[0.4]} />
              <meshStandardMaterial 
                color={color} 
                roughness={0.1} 
                metalness={0.8}
                emissive={color}
                emissiveIntensity={0.2}
              />
            </mesh>
          </group>
        );
      
      case 'platform':
        return (
          <group>
            {/* Base platform */}
            <RoundedBox args={[1.2, 0.2, 1.2]} radius={0.05} position={[0, -0.1, 0]} smoothness={4}>
              <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.7} />
            </RoundedBox>
            {/* Inner ring */}
            <mesh position={[0, 0.05, 0]}>
              <torusGeometry args={[0.35, 0.08, 16, 32]} />
              <meshStandardMaterial 
                color={color}
                roughness={0.2} 
                metalness={0.9}
                emissive={color}
                emissiveIntensity={0.5}
              />
            </mesh>
            {/* Center dome */}
            <mesh position={[0, 0.15, 0]}>
              <sphereGeometry args={[0.25, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial 
                color="#2a2a4a" 
                roughness={0.2} 
                metalness={0.8}
              />
            </mesh>
          </group>
        );
      
      case 'book':
        return (
          <group rotation={[0, 0.3, 0]}>
            {/* Book cover */}
            <RoundedBox args={[0.5, 0.7, 0.1]} radius={0.02} position={[0, 0, 0.15]} smoothness={4}>
              <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
            </RoundedBox>
            <RoundedBox args={[0.5, 0.7, 0.1]} radius={0.02} position={[0, 0, -0.15]} smoothness={4}>
              <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
            </RoundedBox>
            {/* Pages */}
            <RoundedBox args={[0.45, 0.65, 0.25]} radius={0.01} position={[0.02, 0, 0]} smoothness={4}>
              <meshStandardMaterial color="#f0f0e8" roughness={0.9} metalness={0} />
            </RoundedBox>
            {/* Spine */}
            <RoundedBox args={[0.08, 0.7, 0.35]} radius={0.02} position={[-0.25, 0, 0]} smoothness={4}>
              <meshStandardMaterial color={secondaryColor || color} roughness={0.3} metalness={0.4} />
            </RoundedBox>
          </group>
        );
      
      case 'sphere':
        return (
          <group>
            <mesh>
              <sphereGeometry args={[0.35, 32, 32]} />
              <meshStandardMaterial 
                color={color} 
                roughness={0.2} 
                metalness={0.7}
                emissive={color}
                emissiveIntensity={0.1}
              />
            </mesh>
            {/* Ring around sphere */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.5, 0.03, 16, 32]} />
              <meshStandardMaterial 
                color={secondaryColor || '#ffffff'}
                roughness={0.3} 
                metalness={0.8}
              />
            </mesh>
          </group>
        );
      
      default:
        return null;
    }
  };

  return (
    <group ref={groupRef} position={[-8 + baseOffset * stepDistance, 0.3, 0]}>
      {renderObject()}
    </group>
  );
}

// Industrial conveyor belt with ridges
function ConveyorBeltSurface() {
  const beltRef = useRef<THREE.Group>(null);
  const ridgeCount = 30;

  return (
    <group ref={beltRef}>
      {/* Main belt surface - dark metallic */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 3]} />
        <meshStandardMaterial 
          color="#0a0a12"
          roughness={0.6}
          metalness={0.4}
        />
      </mesh>
      
      {/* Belt ridges/grooves for industrial look */}
      {Array.from({ length: ridgeCount }).map((_, i) => (
        <mesh 
          key={i} 
          position={[-10 + i * 0.7, 0.02, 0]} 
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.15, 2.8]} />
          <meshStandardMaterial 
            color="#15152a"
            roughness={0.4}
            metalness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

// Red metallic side rails with glow
function ConveyorRails() {
  const railGlowRef = useRef<THREE.PointLight[]>([]);
  
  return (
    <group>
      {/* Front rail (closer to camera) */}
      <group position={[0, 0.1, 1.6]}>
        {/* Main rail */}
        <RoundedBox args={[22, 0.15, 0.25]} radius={0.05} smoothness={4}>
          <meshStandardMaterial 
            color="#8b1a1a"
            roughness={0.2}
            metalness={0.9}
            emissive="#ff2a2a"
            emissiveIntensity={0.3}
          />
        </RoundedBox>
        {/* Rail glow lights */}
        {Array.from({ length: 8 }).map((_, i) => (
          <pointLight
            key={i}
            position={[-8 + i * 2.5, 0.1, 0]}
            color="#ff3333"
            intensity={0.3}
            distance={1.5}
          />
        ))}
      </group>
      
      {/* Back rail */}
      <group position={[0, 0.1, -1.6]}>
        <RoundedBox args={[22, 0.15, 0.25]} radius={0.05} smoothness={4}>
          <meshStandardMaterial 
            color="#8b1a1a"
            roughness={0.2}
            metalness={0.9}
            emissive="#ff2a2a"
            emissiveIntensity={0.2}
          />
        </RoundedBox>
      </group>
    </group>
  );
}

// Glowing light destination on the right
function DestinationLight() {
  const lightRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (pulseRef.current) {
      // Pulsing glow effect
      const pulse = Math.sin(state.clock.getElapsedTime() * 2) * 0.2 + 1;
      pulseRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={lightRef} position={[10, 0.5, 0]}>
      {/* Main glow sphere */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial 
          color="#4466ff"
          transparent
          opacity={0.15}
        />
      </mesh>
      
      {/* Inner bright core */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial 
          color="#88aaff"
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Light rays */}
      <pointLight
        position={[0, 0, 0]}
        color="#4488ff"
        intensity={3}
        distance={15}
      />
      <pointLight
        position={[-2, 0, 0]}
        color="#6644ff"
        intensity={2}
        distance={10}
      />
      
      {/* Volumetric light cone effect */}
      <mesh position={[-3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[3, 6, 32, 1, true]} />
        <meshBasicMaterial 
          color="#4466ff"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Ambient floating particles
function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(100 * 3);
    for (let i = 0; i < 100; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={100}
          array={particlePositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#6688ff"
        size={0.05}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

export function ConveyorBelt({ darkMode }: { darkMode: boolean }) {
  // Object configurations - various 3D shapes with different colors
  const objects = [
    { type: 'cube' as const, color: '#4a1a5e', secondaryColor: '#8b5cf6' },
    { type: 'gem' as const, color: '#5a1a2a', secondaryColor: '#ef4444' },
    { type: 'platform' as const, color: '#ff6644', secondaryColor: '#ffaa88' },
    { type: 'book' as const, color: '#2a4a6a', secondaryColor: '#3b82f6' },
    { type: 'sphere' as const, color: '#1a4a4a', secondaryColor: '#22d3d3' },
    { type: 'cube' as const, color: '#3a2a1a', secondaryColor: '#f59e0b' },
  ];

  return (
    <group position={[0, -1, -1]} rotation={[0.25, -0.4, 0]}>
      {/* Main conveyor structure */}
      <ConveyorBeltSurface />
      <ConveyorRails />
      
      {/* Animated objects moving towards the light */}
      {objects.map((obj, i) => (
        <ConveyorObject
          key={i}
          index={i}
          type={obj.type}
          color={obj.color}
          secondaryColor={obj.secondaryColor}
        />
      ))}
      
      {/* Glowing destination light */}
      <DestinationLight />
      
      {/* Floating ambient particles */}
      <FloatingParticles />
      
      {/* Scene lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[-5, 3, 2]} intensity={0.8} color="#ffffff" />
      <pointLight position={[5, 2, -2]} intensity={0.5} color="#8888ff" />
      
      {/* Ground reflection plane */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[25, 8]} />
        <meshStandardMaterial 
          color="#050510"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
}
