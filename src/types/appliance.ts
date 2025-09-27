export interface Appliance {
  id: string;
  name: string;
  brand: string;
  model: string;
  type: 'bulb' | 'tube_light' | 'fan' | 'ac' | 'refrigerator' | 'microwave' | 'washing_machine' | 'fridge';
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
  {
    id: 'samsung-microwave',
    name: 'Microwave Oven 1000W',
    brand: 'Samsung',
    model: 'MG23K3515AK',
    type: 'microwave',
    powerRating: 1000,
    voltage: 230,
    current: 4.5,
    powerFactor: 0.95,
    isOn: false,
    startupPower: 1200,
    efficiency: 70,
  },
  {
    id: 'whirlpool-washing-machine',
    name: 'Washing Machine 2000W',
    brand: 'Whirlpool',
    model: '7.5kg Front Load',
    type: 'washing_machine',
    powerRating: 2000,
    voltage: 230,
    current: 9.0,
    powerFactor: 0.9,
    isOn: false,
    startupPower: 2500,
    efficiency: 80,
  },
  {
    id: 'lg-refrigerator',
    name: 'Refrigerator 150W',
    brand: 'LG',
    model: '285L Double Door',
    type: 'fridge',
    powerRating: 150,
    voltage: 230,
    current: 0.7,
    powerFactor: 0.8,
    isOn: false,
    startupPower: 300,
    efficiency: 85,
  },
];