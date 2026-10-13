'use client';

import React, { useEffect, useRef } from 'react';
import {
  Map as MapLibreMap,
  NavigationControl,
  setWorkerUrl,
  type MapMouseEvent,
  type MapGeoJSONFeature,
  type GeoJSONSource,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ActiveBus, CampusBuilding, CameraTarget } from '@/lib/types';
import { ThreeBusLayer } from '@/lib/threeBusLayer';

// Explicitly configure MapLibre Web Worker for Next.js / Turbopack / Webpack bundlers
if (typeof window !== 'undefined') {
  setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
}

interface MapCanvasProps {
  buildings: CampusBuilding[];
  buildingsGeoJson: GeoJSON.FeatureCollection | null;
  routesGeoJson: GeoJSON.FeatureCollection | null;
  stopsGeoJson: GeoJSON.FeatureCollection | null;
  activeBuses: ActiveBus[];
  selectedBuilding: CampusBuilding | null;
  cameraTarget: CameraTarget | null;
  showSolarPv?: boolean;
  onSelectBuilding: (building: CampusBuilding) => void;
}

const KENT_RIDGE_CENTER: [number, number] = [103.7745, 1.2970];

export default function MapCanvas({
  buildings,
  buildingsGeoJson,
  routesGeoJson,
  stopsGeoJson,
  activeBuses,
  selectedBuilding: _selectedBuilding,
  cameraTarget,
  showSolarPv = true,
  onSelectBuilding,
}: MapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const threeLayerRef = useRef<ThreeBusLayer | null>(null);

  // Store latest props in refs to prevent style loading race conditions
  const buildingsGeoJsonRef = useRef<GeoJSON.FeatureCollection | null>(buildingsGeoJson);
  buildingsGeoJsonRef.current = buildingsGeoJson;

  const routesGeoJsonRef = useRef<GeoJSON.FeatureCollection | null>(routesGeoJson);
  routesGeoJsonRef.current = routesGeoJson;

  const stopsGeoJsonRef = useRef<GeoJSON.FeatureCollection | null>(stopsGeoJson);
  stopsGeoJsonRef.current = stopsGeoJson;

  const activeBusesRef = useRef<ActiveBus[]>(activeBuses);
  activeBusesRef.current = activeBuses;

  const buildingsListRef = useRef<CampusBuilding[]>(buildings);
  buildingsListRef.current = buildings;

  const onSelectBuildingRef = useRef(onSelectBuilding);
  onSelectBuildingRef.current = onSelectBuilding;

  const showSolarPvRef = useRef<boolean>(showSolarPv);
  showSolarPvRef.current = showSolarPv;

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    if (typeof window !== 'undefined') {
      try {
        setWorkerUrl(`${window.location.origin}/maplibre/maplibre-gl-worker.mjs`);
      } catch {
        setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
      }
    }

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/dark',
      center: KENT_RIDGE_CENTER,
      zoom: 16.2,
      pitch: 60,
      bearing: -20,
      maxPitch: 85,
    });

    map.addControl(new NavigationControl({ visualizePitch: true }), 'top-left');

    const threeLayer = new ThreeBusLayer();
    threeLayerRef.current = threeLayer;

    map.on('load', () => {
      // 1. Campus Transit Routes - Cyberpunk Neon Polylines (Glow + Core)
      map.addSource('campus-routes', {
        type: 'geojson',
        data: routesGeoJsonRef.current || { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'campus-routes-glow',
        type: 'line',
        source: 'campus-routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#06B6D4'],
          'line-width': 8.0,
          'line-opacity': 0.35,
          'line-blur': 3.0,
        },
      });

      map.addLayer({
        id: 'campus-routes-layer',
        type: 'line',
        source: 'campus-routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#22D3EE'],
          'line-width': 4.0,
          'line-opacity': 0.95,
        },
      });

      // 2. Three.js 3D Shuttle Bus Layer - strictly AFTER routes
      if (!map.getLayer('nus-shuttle-bus-3d')) {
        map.addLayer(threeLayer);
      }

      // 3. Campus Bus Stops - Neon Radar Nodes
      map.addSource('campus-stops', {
        type: 'geojson',
        data: stopsGeoJsonRef.current || { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'campus-stops-glow',
        type: 'circle',
        source: 'campus-stops',
        paint: {
          'circle-radius': 9,
          'circle-color': '#06B6D4',
          'circle-opacity': 0.45,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#22D3EE',
          'circle-stroke-opacity': 0.6,
        },
      });

      map.addLayer({
        id: 'campus-stops-core',
        type: 'circle',
        source: 'campus-stops',
        paint: {
          'circle-radius': 4,
          'circle-color': '#FFFFFF',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#0891B2',
        },
      });

      // 4. Campus 3D Buildings & 3D Energy Pillars
      map.addSource('campus-buildings', {
        type: 'geojson',
        data: buildingsGeoJsonRef.current || { type: 'FeatureCollection', features: [] },
      });

      // Base 3D building extrusions
      map.addLayer({
        id: 'campus-3d-buildings',
        type: 'fill-extrusion',
        source: 'campus-buildings',
        filter: ['==', ['get', 'featureType'], 'building'],
        paint: {
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-color': [
            'match',
            ['get', 'category'],
            'academic', '#06B6D4',   // Electric Cyan
            'residential', '#A855F7',// Cyberpunk Violet
            'recreation', '#10B981', // Emerald
            'admin', '#F59E0B',      // Tactical Amber
            '#475569',
          ],
          'fill-extrusion-opacity': 0.88,
        },
      });

      // 3D Energy Pillars rising from rooftops - Thermal Sensor Gradient
      map.addLayer({
        id: 'campus-energy-pillars',
        type: 'fill-extrusion',
        source: 'campus-buildings',
        filter: ['==', ['get', 'featureType'], 'pillar'],
        paint: {
          'fill-extrusion-base': ['get', 'baseHeight'],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-color': [
            'step',
            ['get', 'eui'],
            '#10B981', // Emerald High Efficiency (< 160 kWh/m²)
            160,
            '#F59E0B', // Golden Amber Moderate (160 - 200 kWh/m²)
            200,
            '#EF4444', // Vivid Crimson Intensive (> 200 kWh/m²)
          ],
          'fill-extrusion-opacity': 0.98,
        },
      });

      // 3D Rooftop Solar PV Panels (Photovoltaic arrays resting on building rooftops)
      map.addLayer({
        id: 'campus-solar-pv',
        type: 'fill-extrusion',
        source: 'campus-buildings',
        filter: ['==', ['get', 'featureType'], 'solar-pv'],
        layout: {
          visibility: showSolarPvRef.current ? 'visible' : 'none',
        },
        paint: {
          'fill-extrusion-base': ['get', 'baseHeight'],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['get', 'gridOffsetPercentage'],
            5, '#0284C7',   // Photovoltaic deep cyan/blue
            15, '#F59E0B',  // High solar yield amber
            25, '#FACC15',  // Maximum solar yield solar gold
          ],
          'fill-extrusion-opacity': 0.95,
        },
      });

      // Initial active buses sync
      if (activeBusesRef.current.length > 0) {
        threeLayer.updateBuses(activeBusesRef.current);
      }
    });

    // Handle clicks on buildings, pillars, or solar PV arrays
    const handleBuildingClick = (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
      if (!e.features || e.features.length === 0) return;
      const feat = e.features[0];
      const targetId = feat.properties?.buildingId || feat.properties?.id;

      const found = buildingsListRef.current.find(
        (b) => b.id === targetId || feat.properties?.name?.includes(b.name)
      );

      if (found) {
        onSelectBuildingRef.current(found);
      }
    };

    map.on('click', 'campus-3d-buildings', handleBuildingClick);
    map.on('click', 'campus-energy-pillars', handleBuildingClick);
    map.on('click', 'campus-solar-pv', handleBuildingClick);

    // Pointer cursor on hover
    map.on('mouseenter', 'campus-3d-buildings', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'campus-3d-buildings', () => {
      map.getCanvas().style.cursor = '';
    });
    map.on('mouseenter', 'campus-energy-pillars', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'campus-energy-pillars', () => {
      map.getCanvas().style.cursor = '';
    });
    map.on('mouseenter', 'campus-solar-pv', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'campus-solar-pv', () => {
      map.getCanvas().style.cursor = '';
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update dynamic GeoJSON data and 3D buses safely
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const syncData = () => {
      if (!map.isStyleLoaded()) return;

      const buildingSrc = map.getSource('campus-buildings') as GeoJSONSource | undefined;
      if (buildingSrc && buildingsGeoJson) {
        buildingSrc.setData(buildingsGeoJson);
      }

      const routeSrc = map.getSource('campus-routes') as GeoJSONSource | undefined;
      if (routeSrc && routesGeoJson) {
        routeSrc.setData(routesGeoJson);
      }

      const stopSrc = map.getSource('campus-stops') as GeoJSONSource | undefined;
      if (stopSrc && stopsGeoJson) {
        stopSrc.setData(stopsGeoJson);
      }

      if (threeLayerRef.current) {
        threeLayerRef.current.updateBuses(activeBuses);
      }
    };

    if (map.isStyleLoaded()) {
      syncData();
    } else {
      map.once('load', syncData);
    }
  }, [buildingsGeoJson, routesGeoJson, stopsGeoJson, activeBuses]);

  // Handle Camera Fly-To navigation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !cameraTarget) return;

    map.flyTo({
      center: cameraTarget.center,
      pitch: cameraTarget.pitch ?? 62,
      bearing: cameraTarget.bearing ?? -20,
      zoom: cameraTarget.zoom ?? 17.2,
      essential: true,
      duration: 2000,
      easing: (t) => 1 - Math.pow(1 - t, 3), // Cinematic Spring deceleration curve
    });
  }, [cameraTarget]);

  // Synchronize dynamic visibility of Solar PV layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const toggleLayer = () => {
      if (map.getLayer('campus-solar-pv')) {
        map.setLayoutProperty(
          'campus-solar-pv',
          'visibility',
          showSolarPv ? 'visible' : 'none'
        );
      }
    };
    if (map.isStyleLoaded()) {
      toggleLayer();
    } else {
      map.once('load', toggleLayer);
    }
  }, [showSolarPv]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
