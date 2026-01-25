"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { PainPoint } from "@/types";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import type { WebGLRenderer } from "three";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import { FootModel } from "./FootModel";
import { PainMarker } from "./PainMarker";

// Debug logging - only enabled in development
const DEBUG_ENDPOINT =
  "http://127.0.0.1:7242/ingest/e341db58-6e00-4988-9b30-182f7e67fa87";
const IS_DEV = process.env.NODE_ENV === "development";

function debugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
) {
  if (!IS_DEV) return;
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location,
      message,
      data,
      timestamp: Date.now(),
      sessionId: "debug-session",
    }),
  }).catch(() => {});
}

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
      <meshStandardMaterial color='#334155' wireframe />
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
  const t = useTranslations("foot");
  const controlsRef = useRef<OrbitControlsType>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const listenersCleanupRef = useRef<(() => void) | null>(null);
  const retryCountRef = useRef(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [remountKey, setRemountKey] = useState(0);

  // Max auto-retry attempts before showing error UI
  const MAX_RETRIES = 3;

  // Generate a stable instance ID for keying the Canvas
  const instanceId = useId();

  // Memoize canvas props to prevent unnecessary re-renders
  const canvasProps = useMemo(
    () => ({
      camera: {
        position: [0.4, 0.55, -0.6] as [number, number, number],
        fov: 32,
      },
      dpr: [1, 2] as [number, number],
      gl: {
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance" as const,
        failIfMajorPerformanceCaveat: false,
      },
    }),
    [],
  );

  // Debug: log component mount (intentionally only on mount, not on state changes)
  useEffect(() => {
    debugLog("FootScene.tsx:component-mount", "FootScene component mounted", {
      remountKey,
      contextLost,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleModelLoad() {
    setIsLoading(false);
  }

  function handleHoverChange(regionName: string | null) {
    setHoveredRegion(regionName);
  }

  // Handle WebGL context loss and restoration
  function handleCanvasCreated({ gl }: { gl: WebGLRenderer }) {
    debugLog("FootScene.tsx:handleCanvasCreated", "Canvas created", {
      hasCanvas: !!gl.domElement,
      canvasId: gl.domElement?.id,
    });

    const canvas = gl.domElement;
    canvasRef.current = canvas;

    // Attach context loss/restore listeners immediately when canvas is created
    function handleContextLost(event: Event) {
      debugLog(
        "FootScene.tsx:handleContextLost",
        "WebGL context lost event fired",
        {
          remountKey,
          eventType: event.type,
        },
      );

      event.preventDefault();
      console.warn("WebGL context lost");

      // Check if context is actually lost by trying to get the context
      const glContext =
        canvas.getContext("webgl2") || canvas.getContext("webgl");
      const isActuallyLost = !glContext || glContext.isContextLost();

      debugLog(
        "FootScene.tsx:handleContextLost-check",
        "Checking if context is actually lost",
        {
          remountKey,
          isActuallyLost,
          hasGL: !!glContext,
        },
      );

      // Only show error if context is actually lost, and wait a bit for auto-restore
      if (isActuallyLost) {
        // Give the browser a chance to auto-restore (usually happens within 100-200ms)
        setTimeout(() => {
          const glAfter =
            canvas.getContext("webgl2") || canvas.getContext("webgl");
          const stillLost = !glAfter || glAfter.isContextLost();

          debugLog(
            "FootScene.tsx:handleContextLost-delayed-check",
            "Delayed check after context loss",
            {
              remountKey,
              stillLost,
              hasGLAfter: !!glAfter,
              retryCount: retryCountRef.current,
            },
          );

          if (stillLost) {
            // Auto-retry up to MAX_RETRIES times
            if (retryCountRef.current < MAX_RETRIES) {
              retryCountRef.current += 1;
              debugLog(
                "FootScene.tsx:handleContextLost-auto-retry",
                "Auto-retrying after context loss",
                { retryCount: retryCountRef.current, maxRetries: MAX_RETRIES },
              );
              // Trigger remount to recover
              setRemountKey((prev) => prev + 1);
            } else {
              // Max retries exceeded, show error UI
              setContextLost(true);
            }
          }
        }, 300);
      }
    }

    function handleContextRestored() {
      debugLog(
        "FootScene.tsx:handleContextRestored",
        "WebGL context restored event fired",
        { remountKey },
      );

      console.log("WebGL context restored");
      // Reset retry counter on successful restore
      retryCountRef.current = 0;
      setContextLost(false);
      // Force remount to restore the scene
      setRemountKey((prev) => prev + 1);
    }

    debugLog(
      "FootScene.tsx:handleCanvasCreated-listeners",
      "Adding context loss/restore listeners",
      {
        remountKey,
        hasCanvas: !!canvas,
      },
    );

    // Clean up previous listeners if they exist
    if (listenersCleanupRef.current) {
      listenersCleanupRef.current();
    }

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);

    // Store cleanup function
    listenersCleanupRef.current = () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
    };
  }

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      if (listenersCleanupRef.current) {
        listenersCleanupRef.current();
        listenersCleanupRef.current = null;
      }
    };
  }, []);

  // Note: Context loss/restore listeners are now attached directly in handleCanvasCreated
  // to avoid race conditions with useEffect running before canvas is created

  // Debug: log context lost state changes
  useEffect(() => {
    if (contextLost) {
      debugLog(
        "FootScene.tsx:contextLost-render",
        "Rendering context lost UI",
        { remountKey, contextLost },
      );
    }
  }, [contextLost, remountKey]);

  // Show error message if context is lost
  if (contextLost) {
    return (
      <div
        className={`relative w-full aspect-square max-h-[400px] ${className} flex items-center justify-center bg-card rounded-lg border`}
      >
        <div className='text-center p-4'>
          <p className='text-sm text-muted-foreground mb-2'>
            {t("contextLostError", {
              defaultValue: "3D view failed to load after multiple attempts.",
            })}
          </p>
          <button
            onClick={function handleTryAgainClick() {
              debugLog(
                "FootScene.tsx:try-again-click",
                "Try again button clicked",
                { remountKey, contextLost, retryCount: retryCountRef.current },
              );
              // Reset retry counter for manual retry
              retryCountRef.current = 0;
              setContextLost(false);
              setRemountKey((prev) => prev + 1);
            }}
            className='text-sm text-primary hover:underline'
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full aspect-square max-h-[400px] ${className}`}>
      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center z-10'>
          <Skeleton className='w-32 h-32 rounded-full' />
        </div>
      )}
      {!contextLost && (
        <Canvas
          key={`foot-scene-${instanceId}-${remountKey}`}
          {...canvasProps}
          onCreated={handleCanvasCreated}
          className='touch-none'
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
          <Environment preset='studio' />

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
                color='var(--primary)'
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
      )}

      {/* Foot label */}
      <div className='absolute top-3 left-3 text-sm font-semibold text-foreground bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md border border-border'>
        {t("right")}
      </div>

      {/* Tooltip showing hovered region */}
      {hoveredRegion && (
        <div className='absolute top-3 left-1/2 -translate-x-1/2 text-sm font-medium text-foreground bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-border animate-in fade-in-0 zoom-in-95 duration-150'>
          {hoveredRegion}
        </div>
      )}

      {/* Instructions overlay */}
      <div className='absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full'>
        Tap foot to select • Drag to rotate
      </div>
    </div>
  );
}
