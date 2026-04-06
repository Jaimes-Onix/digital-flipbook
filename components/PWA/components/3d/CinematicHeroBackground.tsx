import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Floating 3D Book ──────────────────────────────────────────────
   Drifts from one side toward the vertical beam, opens & glows when
   passing through, then fades out on the opposite side and loops.   */
function FloatingBook({
  startX, startY, startZ, delay, speed, color, bookScale, idx,
}: {
  startX: number; startY: number; startZ: number;
  delay: number; speed: number; color: string; bookScale: number; idx: number;
}) {
  const group = useRef<THREE.Group>(null);
  const frontPivot = useRef<THREE.Group>(null);
  const backPivot = useRef<THREE.Group>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const mats = useRef<THREE.MeshStandardMaterial[]>([]);

  const anim = useRef({ t: -delay, open: 0, glow: 0, afterGlow: 0, peaked: false });
  const emissiveOrange = useMemo(() => new THREE.Color('#ff7700'), []);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const s = anim.current;
    const time = clock.getElapsedTime();
    s.t += delta;

    if (s.t < 0) { group.current.visible = false; return; }
    group.current.visible = true;

    // Animation cycle
    const cycle = 18 / speed;
    const raw = ((s.t % cycle) + cycle) % cycle / cycle;
    if (raw < 0.015) s.peaked = false;

    // Position – drift from start side across to the opposite
    const x = THREE.MathUtils.lerp(startX, -startX * 0.65, raw);
    const y = startY + Math.sin(time * 0.35 + idx * 1.7) * 0.25;
    const z = startZ + Math.sin(time * 0.25 + idx * 2.3) * 0.15;
    group.current.position.set(x, y, z);

    // Slow tumble rotation
    group.current.rotation.x = Math.sin(time * 0.15 + idx * 0.9) * 0.1;
    group.current.rotation.y = time * 0.07 + idx * Math.PI / 3.5;
    group.current.rotation.z = Math.cos(time * 0.11 + idx * 1.1) * 0.05;

    // Beam proximity (beam is at x ≈ 0)
    const dist = Math.abs(x);
    const zone = 1.8;
    const prox = dist < zone ? 1 - dist / zone : 0;
    if (prox > 0.3) s.peaked = true;

    // Smooth interpolation for opening & glow
    s.open += (prox * 0.6 - s.open) * 0.04;
    s.glow += (prox - s.glow) * 0.06;

    // Lingering after-glow once the book has passed through
    if (s.peaked && prox < 0.05) {
      s.afterGlow = Math.max(s.afterGlow - delta * 0.12, 0);
    } else if (prox > 0) {
      s.afterGlow = Math.max(s.afterGlow, s.glow * 0.4);
    }

    const totalGlow = Math.max(s.glow, s.afterGlow);
    const flash = dist < 0.3 ? (1 - dist / 0.3) * 0.35 : 0;

    // Open covers
    if (frontPivot.current) frontPivot.current.rotation.y = -s.open * Math.PI * 0.4;
    if (backPivot.current) backPivot.current.rotation.y = s.open * Math.PI * 0.4;

    // Emissive glow on all book materials
    for (const m of mats.current) {
      if (m) { m.emissiveIntensity = totalGlow * 0.5; m.emissive.copy(emissiveOrange); }
    }
    if (glowMat.current) glowMat.current.opacity = totalGlow * 0.18 + flash;

    // Fade at edges & cycle boundaries
    const edgeFade = Math.abs(x) > 5.5 ? Math.max(0.01, 1 - (Math.abs(x) - 5.5) / 3) : 1;
    const cycleFade = raw < 0.05 ? raw / 0.05 : raw > 0.95 ? (1 - raw) / 0.05 : 1;
    group.current.scale.setScalar(bookScale * Math.min(edgeFade, cycleFade));
  });

  const storeMat = (i: number) => (r: THREE.MeshStandardMaterial | null) => {
    if (r) mats.current[i] = r;
  };

  return (
    <group ref={group}>
      {/* Spine */}
      <mesh>
        <boxGeometry args={[0.05, 0.5, 0.28]} />
        <meshStandardMaterial
          ref={storeMat(0)}
          color={color} roughness={0.3} metalness={0.5}
          emissive="#000" emissiveIntensity={0}
        />
      </mesh>

      {/* Front cover – pivots at spine edge */}
      <group ref={frontPivot} position={[0.025, 0, 0.14]}>
        <mesh position={[0.13, 0, 0]}>
          <boxGeometry args={[0.26, 0.5, 0.018]} />
          <meshStandardMaterial
            ref={storeMat(1)}
            color={color} roughness={0.35} metalness={0.4}
            emissive="#000" emissiveIntensity={0}
          />
        </mesh>
      </group>

      {/* Back cover – pivots at spine edge */}
      <group ref={backPivot} position={[0.025, 0, -0.14]}>
        <mesh position={[0.13, 0, 0]}>
          <boxGeometry args={[0.26, 0.5, 0.018]} />
          <meshStandardMaterial
            ref={storeMat(2)}
            color={color} roughness={0.35} metalness={0.4}
            emissive="#000" emissiveIntensity={0}
          />
        </mesh>
      </group>

      {/* Pages */}
      <mesh position={[0.13, 0, 0]}>
        <boxGeometry args={[0.2, 0.44, 0.2]} />
        <meshStandardMaterial
          ref={storeMat(3)}
          color="#ddd8c4" roughness={0.9} metalness={0}
          emissive="#000" emissiveIntensity={0}
        />
      </mesh>

      {/* Transformation glow aura */}
      <mesh>
        <sphereGeometry args={[0.42, 12, 12]} />
        <meshBasicMaterial
          ref={glowMat}
          color="#ff8c00" transparent opacity={0}
          depthWrite={false} blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ─── Vertical Orange Light Beam ────────────────────────────────── */
function LightBeam() {
  const outer = useRef<THREE.Mesh>(null);
  const mid = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (outer.current) { const s = 1 + Math.sin(t * 1.5) * 0.1; outer.current.scale.set(s, 1, s); }
    if (mid.current)   { const s = 1 + Math.sin(t * 1.2 + 0.5) * 0.07; mid.current.scale.set(s, 1, s); }
    if (core.current)  { const s = 1 + Math.sin(t * 2) * 0.15; core.current.scale.set(s, 1, s); }
  });

  return (
    <group position={[0, 0, -0.5]}>
      {/* Outer glow cylinder */}
      <mesh ref={outer} position={[0, 2, 0]}>
        <cylinderGeometry args={[1.0, 1.3, 16, 32, 1, true]} />
        <meshBasicMaterial color="#ff6a00" transparent opacity={0.03} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Mid beam */}
      <mesh ref={mid} position={[0, 2, 0]}>
        <cylinderGeometry args={[0.3, 0.45, 16, 32, 1, true]} />
        <meshBasicMaterial color="#ff8c00" transparent opacity={0.06} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Core line */}
      <mesh ref={core} position={[0, 2, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 16, 16, 1, true]} />
        <meshBasicMaterial color="#ffbb44" transparent opacity={0.25} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Warm point lights */}
      <pointLight position={[0, 0, 0]}  color="#ff8c00" intensity={3}   distance={7} decay={2} />
      <pointLight position={[0, 3, 0]}  color="#ff6a00" intensity={1.5} distance={5} decay={2} />
      <pointLight position={[0, -3, 0]} color="#ffaa44" intensity={1.5} distance={5} decay={2} />

      {/* Ground glow disc */}
      <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2, 32]} />
        <meshBasicMaterial color="#ff6a00" transparent opacity={0.08} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/* ─── Warm Floating Particles ───────────────────────────────────── */
function WarmParticles() {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 120;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const near = Math.random() < 0.3;
      arr[i * 3]     = near ? (Math.random() - 0.5) * 3.5 : (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = near ? (Math.random() - 0.5) * 3.5 : (Math.random() - 0.5) * 7;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.01;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length / 3; i++) {
      const dx = pos[i * 3], dz = pos[i * 3 + 2];
      pos[i * 3 + 1] += (Math.sqrt(dx * dx + dz * dz) < 2 ? 0.005 : 0.0012);
      if (pos[i * 3 + 1] > 5) pos[i * 3 + 1] = -5;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffaa55" size={0.035} transparent opacity={0.45}
        sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ─── Scene Composition ─────────────────────────────────────────── */
function CinematicScene() {
  const books = useMemo(() => [
    { startX: -7,   startY:  0.6,  startZ: -0.3, delay: 0,   speed: 0.65, color: '#2a1a3e', bookScale: 1,    idx: 0 },
    { startX:  7.5, startY: -0.6,  startZ:  0.4, delay: 2.5, speed: 0.55, color: '#1a2a3e', bookScale: 0.9,  idx: 1 },
    { startX: -6,   startY: -1.3,  startZ:  0.8, delay: 5,   speed: 0.7,  color: '#3e1a1a', bookScale: 1.1,  idx: 2 },
    { startX:  8,   startY:  1.5,  startZ: -0.2, delay: 1.2, speed: 0.6,  color: '#1a3e2a', bookScale: 0.95, idx: 3 },
    { startX: -8.5, startY:  0,    startZ:  0.1, delay: 3.5, speed: 0.68, color: '#2e2a1a', bookScale: 1.05, idx: 4 },
    { startX:  6.5, startY: -0.8,  startZ:  1.0, delay: 7,   speed: 0.5,  color: '#1a1a3e', bookScale: 0.85, idx: 5 },
    { startX: -5.5, startY:  2,    startZ: -1,   delay: 8.5, speed: 0.62, color: '#3e2a1a', bookScale: 0.92, idx: 6 },
    { startX:  9,   startY:  1,    startZ:  0.3, delay: 4.2, speed: 0.58, color: '#2a1a2e', bookScale: 1,    idx: 7 },
  ], []);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.3, 7]} fov={50} />

      {/* Minimal ambient – keeps it cinematic dark */}
      <ambientLight intensity={0.05} color="#1a1a2e" />
      <directionalLight position={[5, 5, 3]}  intensity={0.15} color="#4466aa" />
      <directionalLight position={[-5, 3, 2]} intensity={0.08} color="#334488" />

      {/* Fog fades distant objects into the dark background */}
      <fog attach="fog" args={['#0a0a12', 5, 16]} />

      <LightBeam />
      {books.map((b) => <FloatingBook key={b.idx} {...b} />)}
      <WarmParticles />
    </>
  );
}

/* ─── Exported Background Component ─────────────────────────────── */
export default function CinematicHeroBackground() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <CinematicScene />
      </Suspense>
    </Canvas>
  );
}
