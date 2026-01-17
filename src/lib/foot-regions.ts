import type { FootRegion, PainPoint } from "@/types";

// Anatomical regions of the foot for pain point labeling
export const FOOT_REGIONS: FootRegion[] = [
  {
    id: "heel",
    name: "Heel",
    center: { x: 0, y: 0.1, z: -0.4 },
    radius: 0.15,
  },
  {
    id: "arch",
    name: "Arch",
    center: { x: 0, y: 0.05, z: 0 },
    radius: 0.2,
  },
  {
    id: "ball",
    name: "Ball of Foot",
    center: { x: 0, y: 0.08, z: 0.35 },
    radius: 0.18,
  },
  {
    id: "big-toe",
    name: "Big Toe",
    center: { x: 0.08, y: 0.05, z: 0.55 },
    radius: 0.08,
  },
  {
    id: "second-toe",
    name: "Second Toe",
    center: { x: 0.02, y: 0.05, z: 0.6 },
    radius: 0.05,
  },
  {
    id: "third-toe",
    name: "Third Toe",
    center: { x: -0.03, y: 0.05, z: 0.58 },
    radius: 0.05,
  },
  {
    id: "fourth-toe",
    name: "Fourth Toe",
    center: { x: -0.08, y: 0.05, z: 0.55 },
    radius: 0.05,
  },
  {
    id: "little-toe",
    name: "Little Toe",
    center: { x: -0.12, y: 0.05, z: 0.5 },
    radius: 0.05,
  },
  {
    id: "inner-ankle",
    name: "Inner Ankle",
    center: { x: 0.12, y: 0.2, z: -0.3 },
    radius: 0.1,
  },
  {
    id: "outer-ankle",
    name: "Outer Ankle",
    center: { x: -0.12, y: 0.2, z: -0.3 },
    radius: 0.1,
  },
  {
    id: "top-of-foot",
    name: "Top of Foot",
    center: { x: 0, y: 0.15, z: 0.15 },
    radius: 0.2,
  },
  {
    id: "sole",
    name: "Sole",
    center: { x: 0, y: -0.02, z: 0 },
    radius: 0.25,
  },
];

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
