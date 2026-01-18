import type { FootRegion, PainPoint, FootBlock } from "@/types";

/**
 * Schematic foot block definitions
 * Layout (top view):
 * 
 *   [BALL-INNER] [BALL-CENTER] [BALL-OUTER]   <- Ball of Foot area
 *              [      ARCH      ]             <- Arch area
 *              [      HEEL      ]             <- Heel area
 */
export const FOOT_BLOCKS: FootBlock[] = [
  // === BALL OF FOOT - Three square blocks ===
  {
    id: "ball-inner",
    name: "Inner Ball",
    position: { x: 0.12, y: 0, z: 0.35 },
    size: { width: 0.11, height: 0.08, depth: 0.14 },
  },
  {
    id: "ball-center",
    name: "Center Ball",
    position: { x: 0, y: 0, z: 0.38 },
    size: { width: 0.11, height: 0.08, depth: 0.14 },
  },
  {
    id: "ball-outer",
    name: "Outer Ball",
    position: { x: -0.12, y: 0, z: 0.35 },
    size: { width: 0.11, height: 0.08, depth: 0.14 },
  },
  // === ARCH - Rectangular block ===
  {
    id: "arch",
    name: "Arch",
    position: { x: 0, y: 0, z: 0.08 },
    size: { width: 0.18, height: 0.08, depth: 0.28 },
  },
  // === HEEL - Square block (slightly wider) ===
  {
    id: "heel",
    name: "Heel",
    position: { x: 0, y: 0, z: -0.22 },
    size: { width: 0.22, height: 0.1, depth: 0.18 },
  },
];

// Legacy FOOT_REGIONS for backwards compatibility (maps to block centers)
export const FOOT_REGIONS: FootRegion[] = FOOT_BLOCKS.map((block) => ({
  id: block.id,
  name: block.name,
  center: block.position,
  radius: Math.max(block.size.width, block.size.depth) / 2,
}));

/**
 * Find the closest anatomical region to a given 3D point
 */
export function findClosestRegion(point: PainPoint): FootRegion | null {
  let closestRegion: FootRegion | null = null;
  let minDistance = Infinity;

  for (const region of FOOT_REGIONS) {
    const distance = Math.sqrt(
      Math.pow(point.x - region.center.x, 2) +
      Math.pow(point.y - region.center.y, 2) +
      Math.pow(point.z - region.center.z, 2)
    );

    if (distance < minDistance && distance <= region.radius * 2) {
      minDistance = distance;
      closestRegion = region;
    }
  }

  return closestRegion;
}

/**
 * Get the region name for a pain point
 */
export function getPainPointName(point: PainPoint): string {
  const region = findClosestRegion(point);
  return region?.name ?? "Unknown Area";
}

/**
 * Get pain color based on level (1-10)
 */
export function getPainColor(level: number): string {
  if (level <= 3) return "var(--pain-low)";
  if (level <= 6) return "var(--pain-medium)";
  return "var(--pain-high)";
}

/**
 * Get pain color class based on level (1-10)
 */
export function getPainColorClass(level: number): string {
  if (level <= 3) return "text-emerald-500";
  if (level <= 6) return "text-amber-500";
  return "text-rose-500";
}

/**
 * Get pain background color class based on level (1-10)
 */
export function getPainBgClass(level: number): string {
  if (level <= 3) return "bg-emerald-500/20";
  if (level <= 6) return "bg-amber-500/20";
  return "bg-rose-500/20";
}
