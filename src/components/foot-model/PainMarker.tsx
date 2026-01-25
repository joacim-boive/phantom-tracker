"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface PainMarkerProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  intensity?: number; // 0-1, used for heatmap coloring
  pulse?: boolean;
}

// Module-level color constants to avoid allocations in render loop
const INTENSITY_COLORS = {
  emerald: new THREE.Color("#10b981"),
  amber: new THREE.Color("#f59e0b"),
  orange: new THREE.Color("#f97316"),
  red: new THREE.Color("#ef4444"),
  teal: new THREE.Color("#14b8a6"),
};

// Reusable color for calculations (avoids creating new objects)
const tempColor = new THREE.Color();

// Color gradient for pain intensity - uses cached colors
function getIntensityColor(intensity: number): THREE.Color {
  // Green (low) -> Yellow (medium) -> Red (high)
  if (intensity <= 0.33) {
    const t = intensity / 0.33;
    return tempColor.lerpColors(
      INTENSITY_COLORS.emerald,
      INTENSITY_COLORS.amber,
      t,
    );
  } else if (intensity <= 0.66) {
    const t = (intensity - 0.33) / 0.33;
    return tempColor.lerpColors(
      INTENSITY_COLORS.amber,
      INTENSITY_COLORS.orange,
      t,
    );
  } else {
    const t = (intensity - 0.66) / 0.34;
    return tempColor.lerpColors(
      INTENSITY_COLORS.orange,
      INTENSITY_COLORS.red,
      t,
    );
  }
}

export function PainMarker({
  position,
  size = 0.03,
  color,
  intensity,
  pulse = false,
}: PainMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Memoize color to avoid recalculating every render
  // Clone the result since getIntensityColor uses a shared temp object
  const markerColor = useMemo(() => {
    if (intensity !== undefined) {
      return getIntensityColor(intensity).clone();
    }
    return new THREE.Color(color ?? "#14b8a6");
  }, [intensity, color]);

  // Pulsing animation
  useFrame(function animatePainMarker(state) {
    if (pulse && meshRef.current && glowRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      meshRef.current.scale.setScalar(scale);

      // Glow effect
      const glowScale = 1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
      glowRef.current.scale.setScalar(glowScale);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
    }
  });

  return (
    <group position={position}>
      {/* Main marker sphere - reduced segments (8x8) for small markers */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 8, 8]} />
        <meshStandardMaterial
          color={markerColor}
          emissive={markerColor}
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* Glow effect - reduced segments */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 1.5, 8, 8]} />
        <meshBasicMaterial
          color={markerColor}
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Point light removed - emissive material provides sufficient glow effect
          without the performance cost of multiple dynamic lights */}
    </group>
  );
}
