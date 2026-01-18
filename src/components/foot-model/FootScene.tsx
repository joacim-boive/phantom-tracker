"use client";

import { Suspense, useRef, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import { FootModel } from "./FootModel";
import { PainMarker } from "./PainMarker";
import type { PainPoint } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface FootSceneProps {
  selectedPoint: PainPoint | null;
  onPointSelect: (point: PainPoint) => void;
  showHeatmap?: boolean;
  heatmapData?: Array<{ point: PainPoint; intensity: number }>;
  autoRotate?: boolean;
  className?: string;
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.3, 0.8]} />
      <meshStandardMaterial color="#334155" wireframe />
    </mesh>
  );
}

export function FootScene({
  selectedPoint,
  onPointSelect,
  showHeatmap = false,
  heatmapData = [],
  autoRotate = false,
  className = "",
}: FootSceneProps) {
  const controlsRef = useRef<OrbitControlsType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const handleModelLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleHoverChange = useCallback((regionName: string | null) => {
    setHoveredRegion(regionName);
  }, []);

  return (
    <div className={`relative w-full aspect-square max-h-[400px] ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Skeleton className="w-32 h-32 rounded-full" />
        </div>
      )}
      <Canvas
        camera={{ position: [0.4, 0.55, -0.6], fov: 32 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        className="touch-none"
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize={1024}
        />
        <directionalLight position={[-5, 3, -5]} intensity={0.3} />

        {/* Environment for realistic reflections */}
        <Environment preset="studio" />

        {/* Foot model with selection */}
        <Suspense fallback={<LoadingFallback />}>
          <FootModel
            onPointSelect={onPointSelect}
            onLoad={handleModelLoad}
            onHoverChange={handleHoverChange}
            selectedRegionId={selectedPoint?.regionId}
          />

          {/* Selected point marker */}
          {selectedPoint && (
            <PainMarker
              position={[selectedPoint.x, selectedPoint.y, selectedPoint.z]}
              size={0.03}
              color="var(--primary)"
              pulse
            />
          )}

          {/* Heatmap markers */}
          {showHeatmap &&
            heatmapData.map((data, index) => (
              <PainMarker
                key={index}
                position={[data.point.x, data.point.y, data.point.z]}
                size={0.02 + data.intensity * 0.02}
                intensity={data.intensity}
              />
            ))}
        </Suspense>

        {/* Soft shadows under the foot */}
        <ContactShadows
          position={[0, -0.1, 0]}
          opacity={0.4}
          scale={1.5}
          blur={2}
          far={1}
        />

        {/* Camera controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          minDistance={0.5}
          maxDistance={2}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
          target={[0, 0, 0.05]}
        />
      </Canvas>

      {/* Tooltip showing hovered region */}
      {hoveredRegion && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-medium text-foreground bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-border animate-in fade-in-0 zoom-in-95 duration-150">
          {hoveredRegion}
        </div>
      )}

      {/* Instructions overlay */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
        Tap foot to select • Drag to rotate
      </div>
    </div>
  );
}
