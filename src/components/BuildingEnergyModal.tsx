'use client';

import React, { useState } from 'react';
import { CampusBuilding } from '@/lib/types';
import {
  X,
  Building2,
  Layers,
  Snowflake,
  Cpu,
  Lightbulb,
  MapPin,
  Compass,
  Sun,
  Leaf,
  Zap,
  Gauge,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

interface BuildingEnergyModalProps {
  building: CampusBuilding | null;
  onClose: () => void;
  onFlyTo?: (building: CampusBuilding) => void;
}

export default function BuildingEnergyModal({
  building,
  onClose,
  onFlyTo,
}: BuildingEnergyModalProps) {
  const [activeTab, setActiveTab] = useState<'eui' | 'solar'>('eui');

  if (!building) return null;

  const { eui, solarPv } = building;
  const breakdown = eui?.monthlyBreakdown || [];
  const maxMonthVal = Math.max(...breakdown.map((m) => m.total), 25);

  const solarBreakdown = solarPv?.monthlyBreakdown || [];
  const maxSolarMonthVal = Math.max(...solarBreakdown.map((m) => m.generationKwh), 20000);

  const getEuiBadge = (val: number) => {
    if (val < 160) {
      return {
        label: '[TIER 1 // HIGH EFFICIENCY]',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]',
      };
    }
    if (val <= 200) {
      return {
        label: '[TIER 2 // NOMINAL CONSUMPTION]',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
      };
    }
    return {
      label: '[TIER 3 // HIGH INTENSITY]',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)]',
    };
  };

  const badge = getEuiBadge(eui.annualTotal);

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-zinc-950/90 backdrop-blur-2xl border-l border-cyan-500/20 shadow-[-12px_0_40px_rgba(0,0,0,0.8)] z-50 flex flex-col text-zinc-100 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-zinc-800/80 bg-zinc-900/40">
        <div className="space-y-2 pr-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.15)]">
              [{building.category}]
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider border ${badge.color}`}
            >
              {badge.label}
            </span>
          </div>
          <h2 className="text-xl font-bold font-sans text-white tracking-tight leading-snug">
            {building.name}
          </h2>
          <p className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{building.address}</span>
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer active:scale-95"
          aria-label="Close inspector"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tactical Subsystem Mode Switcher */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('eui')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
              activeTab === 'eui'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>[CONSUMPTION // EUI]</span>
          </button>
          <button
            onClick={() => setActiveTab('solar')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
              activeTab === 'solar'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>[SOLAR PV // BCA]</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 space-y-5 scrollbar-thin scrollbar-thumb-zinc-700">
        {activeTab === 'eui' ? (
          <>
            {/* Physical Building Telemetry Specs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>HEIGHT</span>
                </div>
                <p className="text-lg font-bold font-mono text-zinc-100">{building.height}m</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mb-1">
                  <Layers className="w-3.5 h-3.5 text-violet-400" />
                  <span>LEVELS</span>
                </div>
                <p className="text-lg font-bold font-mono text-zinc-100">{building.floorCount}F</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mb-1">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ANNUAL EUI</span>
                </div>
                <p className="text-lg font-bold font-mono text-emerald-400">
                  {eui.annualTotal}
                  <span className="text-[10px] font-mono text-zinc-500 font-normal ml-1">KWH/M²</span>
                </p>
              </div>
            </div>

            {/* Tropical Load Distribution Breakdown */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                  SUBSYSTEM LOAD DISTRIBUTION
                </h4>
                <span className="text-[10px] font-mono text-zinc-500">[TROPICAL PROFILE]</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-800/40">
                  <span className="flex items-center gap-1 text-cyan-400 font-mono font-medium text-[11px]">
                    <Snowflake className="w-3 h-3" /> COOLING
                  </span>
                  <span className="text-sm font-bold font-mono text-cyan-200">~55%</span>
                  <span className="text-[9px] font-mono text-zinc-400">CHILLED WATER</span>
                </div>

                <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-violet-950/20 border border-violet-800/40">
                  <span className="flex items-center gap-1 text-violet-400 font-mono font-medium text-[11px]">
                    <Cpu className="w-3 h-3" /> PLUG LOAD
                  </span>
                  <span className="text-sm font-bold font-mono text-violet-200">~30%</span>
                  <span className="text-[9px] font-mono text-zinc-400">IT & LAB GEAR</span>
                </div>

                <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40">
                  <span className="flex items-center gap-1 text-emerald-400 font-mono font-medium text-[11px]">
                    <Lightbulb className="w-3 h-3" /> LIGHTING
                  </span>
                  <span className="text-sm font-bold font-mono text-emerald-200">~15%</span>
                  <span className="text-[9px] font-mono text-zinc-400">LED FIXTURES</span>
                </div>
              </div>
            </div>

            {/* 12-Month Stacked Consumption Trend */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                  12-MONTH CONSUMPTION HISTOGRAM
                </h4>
                <span className="text-[10px] text-cyan-400 font-mono">[JAN–DEC]</span>
              </div>

              <div className="h-44 flex items-end gap-1.5 pt-6 pb-2 px-1">
                {breakdown.map((m) => {
                  const coolingHeight = (m.cooling / maxMonthVal) * 100;
                  const equipmentHeight = (m.equipment / maxMonthVal) * 100;
                  const lightingHeight = (m.lighting / maxMonthVal) * 100;

                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center h-full group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-[10px] font-mono text-zinc-200 px-2 py-1 rounded shadow-lg border border-cyan-500/40 pointer-events-none whitespace-nowrap z-20">
                        <span className="font-bold text-cyan-300">{m.month}:</span> {m.total} kWh/m²
                      </div>

                      {/* Stacked bar */}
                      <div className="w-full flex-1 flex flex-col justify-end rounded-t overflow-hidden bg-zinc-900 border border-zinc-800/40">
                        <div
                          className="w-full bg-emerald-500/80 group-hover:bg-emerald-400 transition-colors"
                          style={{ height: `${lightingHeight}%` }}
                        />
                        <div
                          className="w-full bg-violet-500/80 group-hover:bg-violet-400 transition-colors"
                          style={{ height: `${equipmentHeight}%` }}
                        />
                        <div
                          className="w-full bg-cyan-500/80 group-hover:bg-cyan-400 transition-colors"
                          style={{ height: `${coolingHeight}%` }}
                        />
                      </div>

                      <span className="text-[9px] font-mono text-zinc-400 mt-1.5">
                        {m.month.slice(0, 1)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 pt-2 border-t border-zinc-800/60 text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-cyan-500" />
                  <span className="text-zinc-300">COOLING (55%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-violet-500" />
                  <span className="text-zinc-300">PLUG (30%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-emerald-500" />
                  <span className="text-zinc-300">LIGHT (15%)</span>
                </div>
              </div>
            </div>

            {/* 3D Camera Focus Button */}
            {onFlyTo && (
              <button
                onClick={() => onFlyTo(building)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer active:scale-[0.98] active:-translate-y-[1px]"
              >
                <Compass className="w-4 h-4 text-cyan-200" />
                [FOCUS 3D ROOFTOP ENERGY PILLAR]
              </button>
            )}
          </>
        ) : (
          /* Solar PV Potential Tab */
          <>
            {/* Solar Physical Deck */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>PEAK CAPACITY</span>
                </div>
                <p className="text-lg font-bold font-mono text-amber-400">
                  {solarPv?.peakCapacityKwp || 172.6}
                  <span className="text-[10px] font-mono text-zinc-500 font-normal ml-1">KWP</span>
                </p>
                <p className="text-[9px] font-mono text-zinc-500">20.5% MONO-SI</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>USABLE ROOF</span>
                </div>
                <p className="text-lg font-bold font-mono text-zinc-100">
                  {solarPv?.usableAreaM2 || 842}
                  <span className="text-[10px] font-mono text-zinc-500 font-normal ml-1">M²</span>
                </p>
                <p className="text-[9px] font-mono text-zinc-500">65% OF ROOFTOP</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mb-1">
                  <Sun className="w-3.5 h-3.5 text-yellow-400" />
                  <span>IRRADIANCE</span>
                </div>
                <p className="text-lg font-bold font-mono text-yellow-400">
                  1,580
                  <span className="text-[10px] font-mono text-zinc-500 font-normal ml-1">KWH/M²</span>
                </p>
                <p className="text-[9px] font-mono text-zinc-500">SG BCA STANDARD</p>
              </div>
            </div>

            {/* Annual Generation & Building Grid Offset */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
                      CLEAN SOLAR GENERATION
                    </h4>
                    <p className="text-[10px] font-mono text-zinc-400">
                      EMA PERFORMANCE RATIO: PR = 0.75
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold font-mono text-amber-400">
                    {solarPv?.annualGenerationMwh || 204.8}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 ml-1">MWH/YR</span>
                </div>
              </div>

              {/* Offset Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">BUILDING DEMAND OFFSET:</span>
                  <span className="font-bold text-emerald-400">
                    {solarPv?.gridOffsetPercentage || 18.5}% NET OFFSET
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-500"
                    style={{ width: `${Math.min(100, solarPv?.gridOffsetPercentage || 18.5)}%` }}
                  />
                  <div className="h-full bg-zinc-800/60 flex-1" />
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
                  <span>SOLAR SELF-CONSUMPTION</span>
                  <span>GRID DRAW: {Math.max(0, 100 - (solarPv?.gridOffsetPercentage || 18.5)).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Environmental Impact & Carbon Abatement */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                  DECARBONIZATION & ESG IMPACT
                </h4>
                <span className="text-[10px] font-mono text-emerald-400">[EMA GEF 0.4057]</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-1">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-mono font-semibold text-[11px]">
                    <Leaf className="w-3.5 h-3.5" /> CO₂ ABATEMENT
                  </span>
                  <p className="text-lg font-bold font-mono text-emerald-300">
                    {solarPv?.co2AbatementTonnes || 83.1}
                    <span className="text-[10px] font-mono text-zinc-400 ml-1">TCO₂/YR</span>
                  </p>
                  <p className="text-[9px] font-mono text-zinc-400">AVOIDED GRID EMISSIONS</p>
                </div>

                <div className="p-3 rounded-lg bg-teal-950/20 border border-teal-800/40 space-y-1">
                  <span className="flex items-center gap-1.5 text-teal-400 font-mono font-semibold text-[11px]">
                    <Building2 className="w-3.5 h-3.5" /> TREE EQUIVALENCE
                  </span>
                  <p className="text-lg font-bold font-mono text-teal-300">
                    ~{(solarPv?.treesEquivalent || 3777).toLocaleString()}
                  </p>
                  <p className="text-[9px] font-mono text-zinc-400">MATURE URBAN TREES</p>
                </div>
              </div>
            </div>

            {/* 12-Month Solar Generation Trend */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                  12-MONTH SOLAR YIELD PROFILE
                </h4>
                <span className="text-[10px] text-amber-400 font-mono">[BCA IRRADIANCE]</span>
              </div>

              <div className="h-44 flex items-end gap-1.5 pt-6 pb-2 px-1">
                {solarBreakdown.map((m) => {
                  const barHeight = (m.generationKwh / maxSolarMonthVal) * 100;

                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center h-full group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-[10px] font-mono text-zinc-200 px-2 py-1 rounded shadow-lg border border-amber-500/40 pointer-events-none whitespace-nowrap z-20">
                        <span className="font-bold text-amber-300">{m.month}:</span> {m.generationKwh.toLocaleString()} kWh
                        <div className="text-[9px] text-zinc-400">GHI: {m.irradianceKwhM2} kWh/m²</div>
                      </div>

                      {/* Bar */}
                      <div className="w-full flex-1 flex flex-col justify-end rounded-t overflow-hidden bg-zinc-900 border border-zinc-800/40">
                        <div
                          className="w-full bg-gradient-to-t from-amber-600 to-yellow-400 group-hover:from-amber-500 group-hover:to-yellow-300 transition-colors shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                          style={{ height: `${barHeight}%` }}
                        />
                      </div>

                      <span className="text-[9px] font-mono text-zinc-400 mt-1.5">
                        {m.month.slice(0, 1)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-gradient-to-r from-amber-500 to-yellow-400" />
                  MONTHLY PHOTOVOLTAIC YIELD (KWH)
                </span>
                <span className="text-zinc-500">MAX: {Math.round(maxSolarMonthVal).toLocaleString()} KWH</span>
              </div>
            </div>

            {/* 3D Camera Focus Button */}
            {onFlyTo && (
              <button
                onClick={() => onFlyTo(building)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-zinc-950 font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer active:scale-[0.98] active:-translate-y-[1px]"
              >
                <Sun className="w-4 h-4 text-zinc-950" />
                [FOCUS 3D ROOFTOP SOLAR PV ARRAY]
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
