export interface MonthlyEnergy {
  month: string;
  cooling: number;
  equipment: number;
  lighting: number;
  total: number;
}

export interface BuildingEnergy {
  annualTotal: number;
  monthlyBreakdown: MonthlyEnergy[];
}

export interface MonthlySolarYield {
  month: string;
  generationKwh: number;
  irradianceKwhM2: number;
}

export interface SolarPvPotential {
  roofAreaM2: number;
  usableAreaM2: number;
  annualIrradianceKwhM2: number;
  peakCapacityKwp: number;
  annualGenerationMwh: number;
  gridOffsetPercentage: number;
  co2AbatementTonnes: number;
  treesEquivalent: number;
  monthlyBreakdown: MonthlySolarYield[];
}

export interface CampusBuilding {
  id: string;
  name: string;
  address: string;
  postal: string;
  latitude: number;
  longitude: number;
  height: number;
  floorCount: number;
  category: 'academic' | 'residential' | 'recreation' | 'admin';
  eui: BuildingEnergy;
  solarPv?: SolarPvPotential;
  footprint?: [number, number][];
}

export interface OccupancyInfo {
  ridership: number | null;
  capacity: number | null;
}

export interface ActiveBus {
  id: string;
  route: string;
  plate: string;
  tripStart: string;
  status: 'IN_SERVICE' | 'AT_TERMINAL';
  lat: number;
  lng: number;
  bearing: number;
  speedKmh: number;
  arcM: number;
  routeLengthM: number;
  prevStop: string;
  anchorStop: string;
  anchorEtaMin: number;
  segmentFraction: number;
  errorBoundM: number;
  occupancy: OccupancyInfo;
}

export interface BusStop {
  code: string;
  caption: string;
  LongName: string;
  ShortName: string;
  latitude: number;
  longitude: number;
}

export interface RouteStop {
  code: string;
  arc_m: number;
  seq: number;
}

export interface CampusRoute {
  route: string;
  length_m: number;
  closed: boolean;
  stops: RouteStop[];
  coordinates?: [number, number][];
}

export interface TransitState {
  asOf: string;
  upstreamLastUpdated: string;
  stale: boolean;
  estimated: boolean;
  buses: ActiveBus[];
  isOffService: boolean;
}

export interface ShuttleEta {
  route: string;
  etaMin: number;
  plate?: string;
  vehicleStatus?: string;
}

export interface CameraTarget {
  center: [number, number];
  pitch?: number;
  bearing?: number;
  zoom?: number;
}

