"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PainMarkerProps {
  position: [number, number, number];
  size?: number;
  color?: string;
  intensity?: number; // 0-1, used for heatmap coloring
  pulse?: boolean;
}

// Color gradient for pain intensity
function getIntensityColor(intensity: number): THREE.Color {
  // Green (low) -> Yellow (medium) -> Red (high)
  if (intensity <= 0.33) {
    // Green to Yellow
    const t = intensity / 0.33;
    return new THREE.Color().lerpColors(
      new THREE.Color("#10b981"), // Emerald
      new THREE.Color("#f59e0b"), // Amber
      t
    );
  } else if (intensity <= 0.66) {
    // Yellow to Orange
    const t = (intensity - 0.33) / 0.33;
    return new THREE.Color().lerpColors(
      new THREE.Color("#f59e0b"), // Amber
      new THREE.Color("#f97316"), // Orange
      t
    );
  } else {
    // Orange to Red
    const t = (intensity - 0.66) / 0.34;
    return new THREE.Color().lerpColors(
      new THREE.Color("#f97316"), // Orange
      new THREE.Color("#ef4444"), // Red
      t
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
  
  // Determine color based on intensity or explicit color
  const markerColor = intensity !== undefined
    ? getIntensityColor(intensity)
    : new THREE.Color(color ?? "#14b8a6");

  // Pulsing animation
  useFrame((state) => {
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
      {/* Main marker sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={markerColor}
          emissive={markerColor}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* Glow effect */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 1.5, 16, 16]} />
        <meshBasicMaterial
          color={markerColor}
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Point light for local illumination */}
      <pointLight
        color={markerColor}
        intensity={0.5}
        distance={0.2}
        decay={2}
      />
    </group>
  );
}
