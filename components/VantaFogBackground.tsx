import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// @ts-ignore - vanta source modules, no types
import FOG from 'vanta/src/vanta.fog.js';

interface VantaFogProps {
  darkMode?: boolean;
  variant?: 'default' | 'reader';
}

const CONFIGS = {
  default: {
    highlightColor: 0x365314, // lime-900
    midtoneColor: 0x18181b,   // zinc-900
    lowlightColor: 0x09090b,  // zinc-950
    baseColor: 0x09090b,      // zinc-950
    blurFactor: 0.7,
    speed: 0.8,
    zoom: 1.2,
  },
  light: {
    highlightColor: 0xf8f9fa,
    midtoneColor: 0xe5e7eb,
    lowlightColor: 0xd1d5db,
    baseColor: 0xf3f4f6,
    blurFactor: 0.6,
    speed: 0.6,
    zoom: 1.0,
  },
  reader: {
    highlightColor: 0x0,
    midtoneColor: 0xffffff,
    lowlightColor: 0xffffff,
    baseColor: 0x0,
    blurFactor: 0.6,
    speed: 0.8,
    zoom: 1.0,
  },
};

export default function VantaFogBackground({ darkMode, variant = 'default' }: VantaFogProps) {
  const vantaRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<any>(null);

  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.destroy();
      effectRef.current = null;
    }
    if (vantaRef.current) {
      const configKey = variant === 'reader' ? 'reader' : (darkMode ? 'default' : 'light');
      const config = CONFIGS[configKey];
      effectRef.current = FOG({
        el: vantaRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        ...config,
      });
    }
    return () => {
      if (effectRef.current) {
        effectRef.current.destroy();
        effectRef.current = null;
      }
    };
  }, [variant, darkMode]);

  const isReader = variant === 'reader';

  return (
    <div
      ref={vantaRef}
      style={{
        position: isReader ? 'absolute' : 'fixed',
        top: 0,
        left: 0,
        width: isReader ? '100%' : '100vw',
        height: isReader ? '100%' : '100vh',
        zIndex: 0,
      }}
    />
  );
}
