import { Appliance, PowerSignature } from '@/types/appliance';

export class WaveformGenerator {
  private time = 0;
  private readonly sampleRate = 50; // Hz
  
  generateApplianceSignature(appliance: Appliance, duration: number = 1000): PowerSignature[] {
    const samples: PowerSignature[] = [];
    const samplesCount = Math.floor(duration * this.sampleRate / 1000);
    
    for (let i = 0; i < samplesCount; i++) {
      const timeMs = i * (1000 / this.sampleRate);
      let power = 0;
      let voltage = appliance.voltage;
      let current = 0;
      
      if (appliance.isOn) {
        switch (appliance.type) {
          case 'bulb':
            power = this.generateBulbSignature(appliance, timeMs);
            break;
          case 'tube_light':
            power = this.generateTubeLightSignature(appliance, timeMs);
            break;
          case 'fan':
            power = this.generateFanSignature(appliance, timeMs);
            break;
          default:
            power = appliance.powerRating;
        }
        
        // Add realistic voltage fluctuations
        voltage += Math.sin(timeMs * 0.02) * 2 + Math.random() * 1.5 - 0.75;
        current = power / (voltage * (appliance.powerFactor || 1));
      }
      
      samples.push({
        time: timeMs,
        power,
        voltage,
        current,
        applianceId: appliance.id,
      });
    }
    
    return samples;
  }
  
  private generateBulbSignature(appliance: Appliance, time: number): number {
    // Incandescent bulbs have steady power with slight thermal variations
    const basePower = appliance.powerRating;
    const thermalVariation = Math.sin(time * 0.001) * 1.5; // Slow thermal changes
    const noise = (Math.random() - 0.5) * 0.5; // Small noise
    
    return Math.max(0, basePower + thermalVariation + noise);
  }
  
  private generateTubeLightSignature(appliance: Appliance, time: number): number {
    const basePower = appliance.powerRating;
    
    // Startup transient for first 100ms
    if (time < 100) {
      const startupPower = appliance.startupPower || basePower * 2;
      const transientDecay = Math.exp(-time / 30);
      return startupPower * transientDecay + basePower * (1 - transientDecay);
    }
    
    // Ballast harmonics and flicker
    const flicker = Math.sin(time * 0.628) * 0.5; // 100Hz flicker
    const harmonics = Math.sin(time * 1.884) * 0.3; // 300Hz harmonics
    const noise = (Math.random() - 0.5) * 0.8;
    
    return Math.max(0, basePower + flicker + harmonics + noise);
  }
  
  private generateFanSignature(appliance: Appliance, time: number): number {
    const basePower = appliance.powerRating;
    
    // Motor startup characteristics
    if (time < 500) {
      const startupPower = appliance.startupPower || basePower * 2;
      const rampUp = 1 - Math.exp(-time / 150);
      return startupPower * (1 - rampUp) + basePower * rampUp;
    }
    
    // Motor speed variations and load changes
    const speedVariation = Math.sin(time * 0.005) * 3; // Load variations
    const motorNoise = Math.sin(time * 0.1) * 1.2; // Motor harmonics
    const randomLoad = (Math.random() - 0.5) * 2;
    
    return Math.max(basePower * 0.3, basePower + speedVariation + motorNoise + randomLoad);
  }
  
  aggregateSignatures(signatures: PowerSignature[][], activeAppliances: Appliance[]): PowerSignature[] {
    if (signatures.length === 0) {
      // Return baseline consumption even when no appliances are on
      return this.generateBaselineSignature();
    }
    
    const maxLength = Math.max(...signatures.map(s => s.length));
    const aggregated: PowerSignature[] = [];
    
    for (let i = 0; i < maxLength; i++) {
      let totalPower = 10; // Base household consumption
      let avgVoltage = 220;
      let totalCurrent = 0.05; // Base current
      let validSamples = 0;
      let time = i * (1000 / this.sampleRate);
      
      // Only add power from currently active appliances
      signatures.forEach((signature, index) => {
        const appliance = activeAppliances[index];
        if (signature[i] && appliance && appliance.isOn) {
          totalPower += signature[i].power;
          avgVoltage += signature[i].voltage;
          totalCurrent += signature[i].current;
          validSamples++;
        }
      });
      
      if (validSamples > 0) {
        avgVoltage = avgVoltage / (validSamples + 1); // +1 for base voltage
      }
      
      // Add realistic grid variations
      totalPower += Math.sin(time * 0.01) * 2 + (Math.random() - 0.5) * 1;
      
      aggregated.push({
        time,
        power: Math.max(0, totalPower),
        voltage: avgVoltage,
        current: totalCurrent,
      });
    }
    
    return aggregated;
  }
  
  private generateBaselineSignature(): PowerSignature[] {
    const samples: PowerSignature[] = [];
    const samplesCount = 100; // 2 seconds at 50Hz
    
    for (let i = 0; i < samplesCount; i++) {
      const time = i * (1000 / this.sampleRate);
      const basePower = 8 + Math.sin(time * 0.005) * 2 + (Math.random() - 0.5) * 0.5;
      
      samples.push({
        time,
        power: Math.max(0, basePower),
        voltage: 220 + (Math.random() - 0.5) * 2,
        current: 0.04 + (Math.random() - 0.5) * 0.01,
      });
    }
    
    return samples;
  }
  
  // Generate clean reference signature for pattern matching
  generateReferenceSignature(appliance: Appliance, duration: number = 1000): PowerSignature[] {
    const samples: PowerSignature[] = [];
    const samplesCount = Math.floor(duration * this.sampleRate / 1000);
    
    for (let i = 0; i < samplesCount; i++) {
      const timeMs = i * (1000 / this.sampleRate);
      let power = 0;
      
      // Generate clean signature without noise for pattern matching
      switch (appliance.type) {
        case 'bulb':
          power = appliance.powerRating * (1 + Math.sin(timeMs * 0.001) * 0.02);
          break;
        case 'tube_light':
          power = appliance.powerRating * (0.95 + Math.sin(timeMs * 0.628) * 0.05);
          break;
        case 'fan':
          if (timeMs < 500) {
            const rampUp = 1 - Math.exp(-timeMs / 150);
            power = appliance.powerRating * (2 * (1 - rampUp) + rampUp);
          } else {
            power = appliance.powerRating * (1 + Math.sin(timeMs * 0.005) * 0.1);
          }
          break;
        default:
          power = appliance.powerRating;
      }
      
      samples.push({
        time: timeMs,
        power: Math.max(0, power),
        voltage: appliance.voltage,
        current: power / (appliance.voltage * (appliance.powerFactor || 1)),
        applianceId: appliance.id,
      });
    }
    
    return samples;
  }
}

export const waveformGenerator = new WaveformGenerator();