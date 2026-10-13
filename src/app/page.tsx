'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  CampusBuilding,
  ActiveBus,
  TransitState,
  CameraTarget,
} from '@/lib/types';
import BusTracker from '@/components/BusTracker';
import CampusEnergyChart from '@/components/CampusEnergyChart';
import BuildingEnergyModal from '@/components/BuildingEnergyModal';
import { Compass, Eye, Building2, Zap, Activity, Sun } from 'lucide-react';

// Zero-SSR WebGL rule: Dynamically import MapCanvas on client side only
const MapCanvas = dynamic(() => import('@/components/MapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-300">
      <div className="relative flex items-center justify-center w-12 h-12 mb-4">
        <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        <div className="absolute w-6 h-6 border-2 border-orange-500/20 border-b-orange-400 rounded-full animate-spin [animation-direction:reverse]" />
      </div>
      <p className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
        INITIALIZING DIGITAL TWIN // 3D WEBGL CORE
      </p>
      <p className="text-[10px] font-mono text-zinc-500 mt-1.5 tracking-wider">
        MOUNTING VECTOR BASEMAP &bull; COMPILING THREE.JS PROJECTIONS
      </p>
    </div>
  ),
});

interface LandmarkPreset {
  name: string;
  tag: string;
  coords: [number, number];
  pitch: number;
  bearing: number;
  zoom: number;
}

const LANDMARK_PRESETS: LandmarkPreset[] = [
  {
    name: 'University Town',
    tag: 'UTOWN',
    coords: [103.7738, 1.3040],
    pitch: 60,
    bearing: 45,
    zoom: 17.2,
  },
  {
    name: 'School of Computing',
    tag: 'COM3',
    coords: [103.7745, 1.2944],
    pitch: 65,
    bearing: -30,
    zoom: 17.5,
  },
  {
    name: 'Central Library',
    tag: 'CLB',
    coords: [103.7725, 1.2966],
    pitch: 55,
    bearing: 10,
    zoom: 17.0,
  },
  {
    name: 'Kent Ridge MRT',
    tag: 'KR-MRT',
    coords: [103.7844, 1.2932],
    pitch: 60,
    bearing: -60,
    zoom: 17.2,
  },
];

export default function Home() {
  const [buildings, setBuildings] = useState<CampusBuilding[]>([]);
  const [buildingsGeoJson, setBuildingsGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [routesGeoJson, setRoutesGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [stopsGeoJson, setStopsGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);

  const [transitState, setTransitState] = useState<TransitState | null>(null);
  const [activeBuses, setActiveBuses] = useState<ActiveBus[]>([]);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(5);

  const [selectedBuilding, setSelectedBuilding] = useState<CampusBuilding | null>(null);
  const [cameraTarget, setCameraTarget] = useState<CameraTarget | null>(null);
  const [activeLandmarkTag, setActiveLandmarkTag] = useState<string | null>(null);

  const [showEnergyHud, setShowEnergyHud] = useState<boolean>(true);
  const [showTransitHud, setShowTransitHud] = useState<boolean>(true);
  const [showSolarPv, setShowSolarPv] = useState<boolean>(true);

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch campus buildings client-side (prevents SSR payload bloat > 128 kB)
  useEffect(() => {
    async function loadBuildings() {
      try {
        const res = await fetch('/api/buildings');
        if (res.ok) {
          const data = await res.json();
          setBuildings(data.buildings || []);
          setBuildingsGeoJson(data.buildingsGeoJson || null);
        }
      } catch (err) {
        console.error('Failed to load buildings:', err);
      }
    }
    loadBuildings();
  }, []);

  // 2. Fetch static campus stops and route polylines client-side
  useEffect(() => {
    async function loadStopsAndRoutes() {
      try {
        const res = await fetch('/api/transit/stops');
        if (res.ok) {
          const data = await res.json();
          setStopsGeoJson(data.stops || null);
          setRoutesGeoJson(data.routes || null);
        }
      } catch (err) {
        console.error('Failed to load transit stops and routes:', err);
      }
    }
    loadStopsAndRoutes();
  }, []);

  // 3. Poll live transit telemetry every 5 seconds
  const pollTransitBuses = useCallback(async () => {
    try {
      const res = await fetch('/api/transit/buses', { cache: 'no-store' });
      if (res.ok) {
        const data: TransitState = await res.json();
        setTransitState(data);
        setActiveBuses(data.buses || []);
      }
    } catch (err) {
      console.error('Failed to poll buses:', err);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    pollTransitBuses();

    // 5-second countdown & polling loop
    setRefreshCountdown(5);
    countdownTimerRef.current = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          pollTransitBuses();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [pollTransitBuses]);

  // Click on building: fly camera and select
  const handleSelectBuilding = useCallback((building: CampusBuilding) => {
    setSelectedBuilding(building);
    setActiveLandmarkTag(null);
    setCameraTarget({
      center: [building.longitude, building.latitude],
      pitch: 65,
      bearing: -20,
      zoom: 17.5,
    });
  }, []);

  // Landmark Fly-to button click
  const handleLandmarkClick = (landmark: LandmarkPreset) => {
    setActiveLandmarkTag(landmark.tag);
    setSelectedBuilding(null);
    setCameraTarget({
      center: landmark.coords,
      pitch: landmark.pitch,
      bearing: landmark.bearing,
      zoom: landmark.zoom,
    });
  };

  // Reset to default Kent Ridge campus overview
  const handleResetView = () => {
    setActiveLandmarkTag(null);
    setSelectedBuilding(null);
    setCameraTarget({
      center: [103.7745, 1.2970],
      pitch: 60,
      bearing: -20,
      zoom: 16.2,
    });
  };

  // Bus click: fly camera to bus position
  const handleSelectBus = (bus: ActiveBus) => {
    setActiveLandmarkTag(null);
    setCameraTarget({
      center: [bus.lng, bus.lat],
      pitch: 65,
      bearing: bus.bearing || -20,
      zoom: 18.0,
    });
  };

  return (
    <main className="relative w-screen min-h-[100dvh] h-[100dvh] overflow-hidden bg-zinc-950 font-sans select-none">
      {/* 3D Map Canvas */}
      <div className="absolute inset-0 z-0">
        <MapCanvas
          buildings={buildings}
          buildingsGeoJson={buildingsGeoJson}
          routesGeoJson={routesGeoJson}
          stopsGeoJson={stopsGeoJson}
          activeBuses={activeBuses}
          selectedBuilding={selectedBuilding}
          cameraTarget={cameraTarget}
          showSolarPv={showSolarPv}
          onSelectBuilding={handleSelectBuilding}
        />
      </div>

      {/* Top Floating Cyberpunk Mission Control Command Toolbar */}
      <header className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Brand Pill */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-cyan-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_40px_rgba(0,0,0,0.6)] pointer-events-auto">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-orange-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Building2 className="w-4 h-4 text-cyan-300" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs md:text-sm font-mono font-bold tracking-wider text-zinc-100 uppercase">
                NUS CAMPUS COMMAND <span className="text-cyan-400">//</span> DIGITAL TWIN
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                [ONLINE // RT-TELEMETRY]
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 mt-0.5">
              <span className="text-cyan-400 font-semibold">GRID:</span> 103.7745°E 1.2970°N
              <span className="text-zinc-600">//</span>
              <span className="text-orange-400 font-semibold">ZONE:</span> SG-KR-01
              <span className="text-zinc-600">//</span>
              <span className="text-zinc-400">EPSG:4326</span>
            </div>
          </div>
        </div>

        {/* Tactical Landmark Fly-To Buttons */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-cyan-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_40px_rgba(0,0,0,0.6)] pointer-events-auto">
          <div className="flex items-center gap-1.5 px-2 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">SECTOR:</span>
          </div>

          {LANDMARK_PRESETS.map((landmark) => {
            const isActive = activeLandmarkTag === landmark.tag;
            return (
              <button
                key={landmark.tag}
                onClick={() => handleLandmarkClick(landmark)}
                className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg transition-all duration-200 cursor-pointer active:scale-[0.98] active:-translate-y-[1px] shadow-[0_0_8px_rgba(0,0,0,0.4)] ${
                  isActive
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-zinc-900/60 hover:bg-cyan-500/10 border border-zinc-800 hover:border-cyan-500/40 text-zinc-300 hover:text-cyan-300'
                }`}
                title={landmark.name}
              >
                [{landmark.tag}]
              </button>
            );
          })}

          <div className="h-4 w-[1px] bg-zinc-800 mx-0.5" />

          <button
            onClick={handleResetView}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold text-zinc-400 hover:text-orange-300 bg-zinc-900/60 hover:bg-orange-500/10 border border-zinc-800 hover:border-orange-500/40 transition-all duration-200 cursor-pointer active:scale-[0.98] active:-translate-y-[1px]"
            title="Reset Campus View"
          >
            <Eye className="w-3 h-3 text-orange-400" />
            <span className="hidden sm:inline">[RESET VIEW]</span>
          </button>
        </div>
      </header>

      {/* Floating Bento HUD Sidebars */}
      {/* Left Wing: Campus Energy Leaderboard */}
      {showEnergyHud && (
        <div className="absolute top-20 left-4 z-20 pointer-events-auto hidden md:block">
          <CampusEnergyChart
            buildings={buildings}
            selectedBuilding={selectedBuilding}
            onSelectBuilding={handleSelectBuilding}
          />
        </div>
      )}

      {/* Right Wing: Live Transit Radar Telemetry */}
      {showTransitHud && (
        <div className="absolute top-20 right-4 z-20 pointer-events-auto">
          <BusTracker
            transitState={transitState}
            refreshCountdown={refreshCountdown}
            onSelectBus={handleSelectBus}
          />
        </div>
      )}

      {/* Bottom-Left Telemetry Diagnostics Pill */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-950/80 backdrop-blur-xl border border-cyan-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.5)] text-[11px] font-mono text-zinc-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-zinc-300 tracking-wider">
            [OPENFREEMAP VECTOR DARK // 60 FPS // {buildings.length > 0 ? buildings.length : 260} NODES]
          </span>
          <span className="text-cyan-400 hidden lg:inline">
            // THREE.JS GL-LAYER: ONLINE
          </span>
        </div>

        {/* Tactical HUD Layer Toggles */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-950/80 backdrop-blur-xl border border-cyan-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.5)] text-[10px] font-mono">
          <button
            onClick={() => setShowSolarPv(!showSolarPv)}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
              showSolarPv
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)] font-semibold'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
            title="Toggle 3D Rooftop Solar PV Layer"
          >
            <Sun className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">[SOLAR PV]</span>
          </button>
          <button
            onClick={() => setShowEnergyHud(!showEnergyHud)}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
              showEnergyHud
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)] font-semibold'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
            title="Toggle Energy HUD"
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">[ENERGY HUD]</span>
          </button>
          <button
            onClick={() => setShowTransitHud(!showTransitHud)}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
              showTransitHud
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.2)] font-semibold'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
            title="Toggle Transit HUD"
          >
            <Activity className="w-3 h-3 text-orange-400" />
            <span className="hidden sm:inline">[TRANSIT HUD]</span>
          </button>
        </div>
      </div>

      {/* 3D Energy Pillar Inspector Drawer */}
      <BuildingEnergyModal
        building={selectedBuilding}
        onClose={() => setSelectedBuilding(null)}
        onFlyTo={handleSelectBuilding}
      />
    </main>
  );
}
