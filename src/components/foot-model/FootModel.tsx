"use client";

import { FOOT_BLOCKS } from "@/lib/foot-regions";
import type { FootBlock, PainPoint } from "@/types";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface FootModelProps {
  onPointSelect: (point: PainPoint) => void;
  onLoad?: () => void;
  onHoverChange?: (regionName: string | null) => void;
  selectedRegionId?: string | null;
}

interface FootBlockMeshProps {
  block: FootBlock;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (blockId: string | null) => void;
  onClick: (block: FootBlock) => void;
}

// Colors for different states - module-level constants to avoid allocations
const COLORS = {
  default: new THREE.Color("#64748b"), // Slate-500
  hover: new THREE.Color("#3b82f6"), // Blue-500
  selected: new THREE.Color("#14b8a6"), // Teal-500
  edge: new THREE.Color("#334155"), // Slate-700
  black: new THREE.Color("#000000"), // Used for emissive reset
};

function FootBlockMesh({
  block,
  isSelected,
  isHovered,
  onHover,
  onClick,
}: FootBlockMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const targetScale = useRef(1);
  const currentScale = useRef(1);

  // Determine current color based on state
  function getColor(): THREE.Color {
    if (isSelected) return COLORS.selected;
    if (isHovered) return COLORS.hover;
    return COLORS.default;
  }

  // Animate scale and color
  useFrame(() => {
    if (!meshRef.current) return;

    // Target scale based on state
    targetScale.current = isHovered || isSelected ? 1.05 : 1;

    // Smooth scale interpolation
    currentScale.current = THREE.MathUtils.lerp(
      currentScale.current,
      targetScale.current,
      0.15,
    );
    meshRef.current.scale.setScalar(currentScale.current);

    // Update material color
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    material.color.lerp(getColor(), 0.2);

    // Update emissive for glow effect
    if (isSelected || isHovered) {
      material.emissive.lerp(getColor(), 0.15);
      material.emissiveIntensity = THREE.MathUtils.lerp(
        material.emissiveIntensity,
        0.3,
        0.1,
      );
    } else {
      material.emissive.lerp(COLORS.black, 0.15);
      material.emissiveIntensity = THREE.MathUtils.lerp(
        material.emissiveIntensity,
        0,
        0.1,
      );
    }

    // Sync edge scale
    if (edgesRef.current) {
      edgesRef.current.scale.setScalar(currentScale.current);
    }
  });

  function handlePointerOver(event: { stopPropagation: () => void }) {
    event.stopPropagation();
    onHover(block.id);
    document.body.style.cursor = "pointer";
  }

  function handlePointerOut(event: { stopPropagation: () => void }) {
    event.stopPropagation();
    onHover(null);
    // Cursor reset is handled in the debounced hover handler
  }

  function handleClick(event: { stopPropagation: () => void }) {
    event.stopPropagation();
    onClick(block);
  }

  return (
    <group position={[block.position.x, block.position.y, block.position.z]}>
      {/* Main block mesh */}
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        castShadow
        receiveShadow
      >
        <boxGeometry
          args={[block.size.width, block.size.height, block.size.depth]}
        />
        <meshStandardMaterial
          color={COLORS.default}
          roughness={0.4}
          metalness={0.1}
          emissive={COLORS.black}
          emissiveIntensity={0}
        />
      </mesh>

      {/* Edge lines for schematic look */}
      <lineSegments ref={edgesRef}>
        <edgesGeometry
          args={[
            new THREE.BoxGeometry(
              block.size.width,
              block.size.height,
              block.size.depth,
            ),
          ]}
        />
        <lineBasicMaterial color={COLORS.edge} linewidth={1} />
      </lineSegments>
    </group>
  );
}

export function FootModel({
  onPointSelect,
  onLoad,
  onHoverChange,
  selectedRegionId,
}: FootModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Notify when loaded
  useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Handle block selection
  function handleBlockClick(block: FootBlock) {
    const painPoint: PainPoint = {
      x: block.position.x,
      y: block.position.y,
      z: block.position.z,
      name: block.name,
      regionId: block.id,
    };
    onPointSelect(painPoint);
  }

  function handleHover(blockId: string | null) {
    // Clear any pending hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (blockId) {
      // Immediately set hover when entering a block
      setHoveredBlockId(blockId);
      const block = FOOT_BLOCKS.find((b) => b.id === blockId);
      onHoverChange?.(block?.name ?? null);
    } else {
      // Delay clearing hover to allow moving between adjacent blocks
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredBlockId(null);
        onHoverChange?.(null);
        document.body.style.cursor = "auto";
      }, 100);
    }
  }

  // Subtle idle animation
  useFrame((state) => {
    if (groupRef.current) {
      // Very subtle floating motion
      groupRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.005;
    }
  });

  return (
    <group ref={groupRef}>
      {FOOT_BLOCKS.map((block) => (
        <FootBlockMesh
          key={block.id}
          block={block}
          isSelected={selectedRegionId === block.id}
          isHovered={hoveredBlockId === block.id}
          onHover={handleHover}
          onClick={handleBlockClick}
        />
      ))}
    </group>
  );
}
