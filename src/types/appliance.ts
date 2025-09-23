export interface Appliance {
  id: string;
  name: string;
  brand: string;
  model: string;
  type: 'bulb' | 'tube_light' | 'fan' | 'ac' | 'refrigerator';
  powerRating: number; // watts
  voltage: number; // volts
  current: number; // amperes
  powerFactor: number;
  isOn: boolean;
  startupPower?: number; // for inrush current
  efficiency?: number; // percentage
}

export interface PowerSignature {
  time: number;
  power: number;
  voltage: number;
  current: number;
  applianceId?: string;
}

export interface DisaggregationResult {
  appliance: Appliance;
  duration: number; // minutes
  energyConsumed: number; // wh
  confidence: number; // percentage
  detectedPeriods: Array<{
    startTime: number;
    endTime: number;
    confidence: number;
  }>;
}

export const DEFAULT_APPLIANCES: Appliance[] = [
  {
    id: 'philips-60w',
    name: 'Incandescent Bulb 60W',
    brand: 'Philips',
    model: 'Classic 60W',
    type: 'bulb',
    powerRating: 60,
    voltage: 230,
    current: 0.26,
    powerFactor: 1.0,
    isOn: false,
    efficiency: 5,
  },
  {
    id: 'osram-18w-tube',
    name: 'Fluorescent Tube 18W',
    brand: 'Osram',
    model: 'L 18W/640',
    type: 'tube_light',
    powerRating: 18,
    voltage: 230,
    current: 0.15,
    powerFactor: 0.5,
    isOn: false,
    startupPower: 40,
    efficiency: 25,
  },
  {
    id: 'bajaj-ceiling-fan',
    name: 'Ceiling Fan 75W',
    brand: 'Bajaj',
    model: 'Maxima 1200mm',
    type: 'fan',
    powerRating: 75,
    voltage: 230,
    current: 0.35,
    powerFactor: 0.85,
    isOn: false,
    startupPower: 150,
    efficiency: 85,
  },
  {
    id: 'lg-led-9w',
    name: 'LED Bulb 9W',
    brand: 'LG',
    model: 'EcoSmart 9W',
    type: 'bulb',
    powerRating: 9,
    voltage: 230,
    current: 0.08,
    powerFactor: 0.9,
    isOn: false,
    efficiency: 90,
  },
];