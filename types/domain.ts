export type LatLng = {
  latitude: number;
  longitude: number;
};

export type TransportMode = 'WALK' | 'BUS' | 'METRO' | 'RAIL' | 'BIKE' | 'RIDE_HAIL';

export type Leg = {
  id: string;
  mode: TransportMode;
  from: LatLng;
  to: LatLng;
  startTime: number; // epoch ms
  endTime: number; // epoch ms
  costCents: number;
  comfortScore: number; // 0-1
  providerId?: string;
  description?: string;
};

export type Itinerary = {
  id: string;
  legs: Leg[];
  totalTimeMin: number;
  totalCostCents: number;
  averageComfortScore: number;
};

export type Preferences = {
  weightTime: number; // 0-1
  weightCost: number; // 0-1
  weightComfort: number; // 0-1
  avoidModes?: TransportMode[];
  maxTransfers?: number;
};

export type Place = {
  name: string;
  location: LatLng;
};

