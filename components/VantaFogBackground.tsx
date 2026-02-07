import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// @ts-ignore - vanta source modules, no types
import FOG from 'vanta/src/vanta.fog.js';

export default function VantaFogBackground({ darkMode }: { darkMode?: boolean }) {
  const vantaRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<any>(null);

  useEffect(() => {
    if (!effectRef.current && vantaRef.current) {
      effectRef.current = FOG({
        el: vantaRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        highlightColor: 0x0,
        midtoneColor: 0x0,
        lowlightColor: 0xffffff,
        baseColor: 0xffffff,
        blurFactor: 0.6,
        speed: 1.0,
        zoom: 1.0,
      });
    }
    return () => {
      if (effectRef.current) {
        effectRef.current.destroy();
        effectRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={vantaRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
      }}
    />
  );
}
