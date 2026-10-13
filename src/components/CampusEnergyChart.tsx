'use client';

import React, { useState, useMemo } from 'react';
import { CampusBuilding } from '@/lib/types';
import { Zap, Award, ChevronRight, SlidersHorizontal } from 'lucide-react';

interface CampusEnergyChartProps {
  buildings: CampusBuilding[];
  selectedBuilding: CampusBuilding | null;
  onSelectBuilding: (building: CampusBuilding) => void;
}

export default function CampusEnergyChart({
  buildings,
  selectedBuilding,
  onSelectBuilding,
}: CampusEnergyChartProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Sort ascending by annual EUI: Rank #1 = most efficient (lowest EUI)
  const rankedBuildings = useMemo(() => {
    return [...buildings].sort((a, b) => a.eui.annualTotal - b.eui.annualTotal);
  }, [buildings]);

  const filteredBuildings = useMemo(() => {
    if (categoryFilter === 'all') return rankedBuildings;
    return rankedBuildings.filter((b) => b.category === categoryFilter);
  }, [rankedBuildings, categoryFilter]);

  // High-contrast Thermal Sensor Gradient palette
  const getEuiStyle = (eui: number) => {
    if (eui < 160) {
      return {
        bar: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
        text: 'text-emerald-400',
        badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        glow: 'shadow-[0_0_8px_rgba(16,185,129,0.2)]',
      };
    }
    if (eui <= 200) {
      return {
        bar: 'bg-gradient-to-r from-amber-600 to-amber-400',
        text: 'text-amber-400',
        badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        glow: 'shadow-[0_0_8px_rgba(245,158,11,0.2)]',
      };
    }
    return {
      bar: 'bg-gradient-to-r from-rose-600 to-rose-400',
      text: 'text-rose-400',
      badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      glow: 'shadow-[0_0_8px_rgba(239,68,68,0.2)]',
    };
  };

  return (
    <div className="flex flex-col w-88 max-h-[82vh] bg-zinc-950/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_40px_rgba(0,0,0,0.6)] text-zinc-100 overflow-hidden transition-all">
      {/* Header */}
      <div className="p-3.5 border-b border-zinc-800/80 bg-zinc-900/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-mono font-bold tracking-wider text-zinc-100 uppercase">
                  THERMAL SENSOR // EUI
                </h3>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] font-mono text-zinc-400 tracking-tight">
                [RANK #01 = HIGHEST EFFICIENCY]
              </p>
            </div>
          </div>
          <Award className="w-4 h-4 text-amber-400" />
        </div>

        {/* Tactical Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pt-1 pb-0.5 text-[10px] font-mono scrollbar-none">
          <SlidersHorizontal className="w-3 h-3 text-cyan-400 shrink-0 mr-1" />
          {['all', 'academic', 'residential', 'recreation', 'admin'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2 py-0.5 rounded-md uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                categoryFilter === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                  : 'bg-zinc-900/70 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              {cat === 'all' ? '[ALL]' : cat.slice(0, 4)}
            </button>
          ))}
        </div>
      </div>

      {/* Buildings Ranking List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-700">
        {filteredBuildings.map((bldg) => {
          const rank = rankedBuildings.findIndex((b) => b.id === bldg.id) + 1;
          const isSelected = selectedBuilding?.id === bldg.id;
          const style = getEuiStyle(bldg.eui.annualTotal);

          // Normalized width: scale between 100 to 240 kWh/m²
          const percentage = Math.min(
            100,
            Math.max(20, ((bldg.eui.annualTotal - 100) / 140) * 100)
          );

          return (
            <div
              key={bldg.id}
              onClick={() => onSelectBuilding(bldg)}
              className={`group p-2 rounded-xl cursor-pointer transition-all border active:scale-[0.98] ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_16px_rgba(6,182,212,0.12)]'
                  : 'hover:bg-zinc-900/60 border-zinc-800/50 hover:border-zinc-700/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-6 h-5 flex items-center justify-center rounded text-[10px] font-mono font-bold shrink-0 border ${
                      rank === 1
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                        : rank === 2
                        ? 'bg-zinc-300/20 text-zinc-200 border-zinc-400/50'
                        : rank === 3
                        ? 'bg-orange-700/20 text-orange-300 border-orange-600/50'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    #{rank < 10 ? `0${rank}` : rank}
                  </span>
                  <span className="text-xs font-medium text-zinc-200 truncate group-hover:text-cyan-300 transition-colors">
                    {bldg.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className={`text-xs font-mono font-bold ${style.text}`}>
                    {bldg.eui.annualTotal}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">KWH/M²</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              {/* Progress bar with Thermal Sensor Glow */}
              <div className="w-full bg-zinc-900/90 rounded-full h-1.5 overflow-hidden p-[1px] border border-zinc-800/60">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${style.bar} ${style.glow}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Aviation Legend Footer */}
      <div className="p-2.5 border-t border-zinc-800/80 bg-zinc-950/70 flex items-center justify-between text-[10px] font-mono px-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          <span className="text-zinc-400">&lt;160 EFFICIENT</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
          <span className="text-zinc-400">160–200 MOD</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
          <span className="text-zinc-400">&gt;200 INTENSIVE</span>
        </div>
      </div>
    </div>
  );
}
