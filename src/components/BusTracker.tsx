'use client';

import React from 'react';
import { TransitState, ActiveBus } from '@/lib/types';
import { ROUTE_COLORS } from '@/lib/transit';
import { Bus, Radio, AlertCircle, Gauge, ArrowRight, Activity } from 'lucide-react';

interface BusTrackerProps {
  transitState: TransitState | null;
  refreshCountdown: number;
  onSelectBus?: (bus: ActiveBus) => void;
}

export default function BusTracker({
  transitState,
  refreshCountdown,
  onSelectBus,
}: BusTrackerProps) {
  const buses = transitState?.buses || [];
  const isOffService = transitState?.isOffService || buses.length === 0;

  return (
    <div className="flex flex-col w-84 max-h-[82vh] bg-zinc-950/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_40px_rgba(0,0,0,0.6)] text-zinc-100 overflow-hidden transition-all duration-300">
      {/* Flight Radar Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-zinc-800/80 bg-zinc-900/40">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.15)]">
            <Bus className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-mono font-bold tracking-wider text-zinc-100 uppercase">
                TRANSIT RADAR // TELEMETRY
              </h3>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
              <span className="relative flex h-2 w-2">
                {!isOffService && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isOffService ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
              </span>
              <span>
                {isOffService
                  ? '[OFF-PEAK 23:00-07:00]'
                  : `[${buses.length} FLEET UNITS ONLINE]`}
              </span>
            </div>
          </div>
        </div>

        {/* Aviation Monospace Countdown Ticker */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.1)]">
          <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>T-0{refreshCountdown}S</span>
        </div>
      </div>

      {/* Off-Service Announcement Badge */}
      {isOffService && (
        <div className="p-3 mx-3 my-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-mono font-bold text-amber-300">
                [OFF-SERVICE NOTICE]
              </p>
              <p className="text-[11px] font-mono text-amber-200/80 mt-0.5 leading-snug">
                Operating window 07:00–23:00 SGT. Zero synthetic simulation mode enforced.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Fleet List - Aviation Monospace Badges */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/80 p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-700">
        {!isOffService && buses.length > 0 ? (
          buses.map((bus) => {
            const routeColor = ROUTE_COLORS[bus.route] || '#06B6D4';

            return (
              <div
                key={bus.id}
                onClick={() => onSelectBus?.(bus)}
                className="group p-2.5 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/60 hover:border-cyan-500/40 cursor-pointer transition-all active:scale-[0.98] active:-translate-y-[1px]"
              >
                {/* Route Flight Badge + Plate + Radar ETA */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 text-xs font-mono font-bold rounded text-white shadow-sm"
                      style={{ backgroundColor: routeColor }}
                    >
                      {bus.route}
                    </span>
                    <span className="text-xs font-mono font-semibold text-zinc-300 group-hover:text-cyan-300 transition-colors">
                      {bus.plate}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 shadow-[0_0_6px_rgba(16,185,129,0.15)]">
                    <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                    {bus.anchorEtaMin > 0 ? `ETA: ${bus.anchorEtaMin}M` : 'HOLDING'}
                  </span>
                </div>

                {/* Corridor Radar Track: Prev -> Anchor Stop */}
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-300 mb-2">
                  <span className="text-zinc-400 truncate max-w-[95px]">{bus.prevStop || 'TERMINAL'}</span>
                  <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="font-bold text-cyan-300 truncate max-w-[110px]">{bus.anchorStop}</span>
                </div>

                {/* Speed & Error Bounds Badge in Monospace */}
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1.5 border-t border-zinc-800/60">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Gauge className="w-3 h-3 text-cyan-400" />
                    {bus.speedKmh ? `${Math.round(bus.speedKmh)} KM/H` : '0 KM/H'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-950 text-amber-300/90 font-mono border border-amber-500/30 shadow-[0_0_6px_rgba(245,158,11,0.1)]">
                    [±{bus.errorBoundM}M EST]
                  </span>
                </div>
              </div>
            );
          })
        ) : !isOffService ? (
          <div className="py-8 text-center text-xs font-mono text-zinc-500">
            [RADAR IDLE // NO TRIPS IN PROGRESS]
          </div>
        ) : null}
      </div>

      {/* Telemetry Footer */}
      <div className="px-3 py-2 border-t border-zinc-800/80 bg-zinc-950/70 flex items-center justify-between text-[9px] font-mono text-zinc-500">
        <span>[DEAD RECKONING TELEMETRY]</span>
        <span className="text-cyan-400">[GCP RUN PROXY]</span>
      </div>
    </div>
  );
}
