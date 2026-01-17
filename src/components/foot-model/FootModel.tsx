"use client";

import { useRef, useEffect, useMemo } from "react";
import { useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { PainPoint } from "@/types";
import { getPainPointName } from "@/lib/foot-regions";

interface FootModelProps {
  onPointSelect: (point: PainPoint) => void;
  onLoad?: () => void;
}

// Foot part definitions - each part is a scaled/positioned sphere or capsule
// This creates a smooth, anatomically-suggestive foot shape
const FOOT_PARTS = [
  // === MAIN BODY ===
  // Heel - rounded back of foot
  { type: "sphere", pos: [0, 0.06, -0.22], scale: [0.11, 0.09, 0.12], segments: 32 },
  
  // Mid-foot body - elongated ellipsoid
  { type: "sphere", pos: [0, 0.055, 0], scale: [0.1, 0.065, 0.25], segments: 32 },
  
  // Ball of foot - wider area under toes
  { type: "sphere", pos: [0, 0.045, 0.2], scale: [0.13, 0.055, 0.1], segments: 32 },
  
  // Inner arch area (medial side) - slightly raised
  { type: "sphere", pos: [0.05, 0.06, -0.05], scale: [0.06, 0.05, 0.18], segments: 24 },
  
  // Outer edge (lateral side) - flatter, contacts ground
  { type: "sphere", pos: [-0.06, 0.04, 0], scale: [0.05, 0.04, 0.22], segments: 24 },
  
  // Top of foot (dorsum) - slight dome
  { type: "sphere", pos: [0, 0.09, 0.05], scale: [0.08, 0.04, 0.2], segments: 24 },
  
  // === ANKLE AREA ===
  // Ankle - tapers up from heel
  { type: "sphere", pos: [0, 0.14, -0.2], scale: [0.07, 0.06, 0.07], segments: 24 },
  
  // Inner ankle bone (medial malleolus)
  { type: "sphere", pos: [0.06, 0.13, -0.18], scale: [0.025, 0.03, 0.025], segments: 16 },
  
  // Outer ankle bone (lateral malleolus) - slightly lower
  { type: "sphere", pos: [-0.065, 0.11, -0.18], scale: [0.025, 0.03, 0.025], segments: 16 },
  
  // === METATARSAL AREA (connects to toes) ===
  // Big toe metatarsal head
  { type: "sphere", pos: [0.055, 0.04, 0.26], scale: [0.04, 0.035, 0.04], segments: 20 },
  
  // Second metatarsal area
  { type: "sphere", pos: [0.02, 0.04, 0.27], scale: [0.03, 0.03, 0.035], segments: 16 },
  
  // Middle metatarsals
  { type: "sphere", pos: [-0.02, 0.04, 0.26], scale: [0.028, 0.028, 0.033], segments: 16 },
  
  // Fourth metatarsal
  { type: "sphere", pos: [-0.055, 0.038, 0.24], scale: [0.026, 0.026, 0.03], segments: 16 },
  
  // Fifth metatarsal (pinky side)
  { type: "sphere", pos: [-0.085, 0.035, 0.2], scale: [0.024, 0.024, 0.03], segments: 16 },
] as const;

// Toe definitions - each toe has multiple segments for realism
const TOES = [
  // Big toe (hallux) - 2 visible segments
  { name: "big-1", pos: [0.055, 0.038, 0.32], scale: [0.032, 0.028, 0.04], segments: 20 },
  { name: "big-2", pos: [0.055, 0.035, 0.38], scale: [0.028, 0.024, 0.035], segments: 20 },
  
  // Second toe - longest, 3 segments visible
  { name: "second-1", pos: [0.02, 0.035, 0.32], scale: [0.02, 0.018, 0.028], segments: 16 },
  { name: "second-2", pos: [0.02, 0.033, 0.36], scale: [0.018, 0.016, 0.024], segments: 16 },
  { name: "second-3", pos: [0.02, 0.03, 0.395], scale: [0.015, 0.014, 0.02], segments: 12 },
  
  // Third toe (middle)
  { name: "third-1", pos: [-0.02, 0.034, 0.31], scale: [0.019, 0.017, 0.026], segments: 16 },
  { name: "third-2", pos: [-0.02, 0.032, 0.345], scale: [0.017, 0.015, 0.022], segments: 16 },
  { name: "third-3", pos: [-0.02, 0.029, 0.375], scale: [0.014, 0.013, 0.018], segments: 12 },
  
  // Fourth toe
  { name: "fourth-1", pos: [-0.055, 0.032, 0.29], scale: [0.017, 0.015, 0.024], segments: 16 },
  { name: "fourth-2", pos: [-0.055, 0.03, 0.32], scale: [0.015, 0.014, 0.02], segments: 12 },
  { name: "fourth-3", pos: [-0.055, 0.028, 0.345], scale: [0.013, 0.012, 0.016], segments: 12 },
  
  // Pinky toe (smallest, curled slightly)
  { name: "pinky-1", pos: [-0.085, 0.03, 0.25], scale: [0.015, 0.014, 0.02], segments: 12 },
  { name: "pinky-2", pos: [-0.085, 0.028, 0.275], scale: [0.013, 0.012, 0.016], segments: 12 },
] as const;

// Material with subtle skin-like appearance
function createFootMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color("#d4b896"), // Warm natural skin tone
    roughness: 0.8,
    metalness: 0.0,
  });
}

export function FootModel({ onPointSelect, onLoad }: FootModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { raycaster, camera, pointer } = useThree();
  
  // Shared material
  const material = useMemo(() => createFootMaterial(), []);
  
  // Notify when loaded
  useEffect(() => {
    onLoad?.();
  }, [onLoad]);
  
  // Handle click/tap on any part of the foot
  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    
    if (!groupRef.current) return;
    
    // Get intersection point from all meshes in the group
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(groupRef.current.children, true);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const painPoint: PainPoint = {
        x: point.x,
        y: point.y,
        z: point.z,
        name: getPainPointName({ x: point.x, y: point.y, z: point.z, name: "" }),
      };
      onPointSelect(painPoint);
    }
  }
  
  // Subtle idle animation
  useFrame((state) => {
    if (groupRef.current) {
      // Very subtle breathing motion
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.003;
    }
  });

  return (
    <group ref={groupRef} onPointerDown={handlePointerDown}>
      {/* Main foot body parts */}
      {FOOT_PARTS.map((part, index) => (
        <mesh
          key={`part-${index}`}
          position={part.pos as [number, number, number]}
          scale={part.scale as [number, number, number]}
          material={material}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[1, part.segments, part.segments / 2]} />
        </mesh>
      ))}
      
      {/* Toes */}
      {TOES.map((toe) => (
        <mesh
          key={toe.name}
          position={toe.pos as [number, number, number]}
          scale={toe.scale as [number, number, number]}
          material={material}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[1, toe.segments, toe.segments / 2]} />
        </mesh>
      ))}
    </group>
  );
}
