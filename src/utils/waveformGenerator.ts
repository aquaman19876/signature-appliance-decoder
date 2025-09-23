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
  
  aggregateSignatures(signatures: PowerSignature[][]): PowerSignature[] {
    if (signatures.length === 0) return [];
    
    const maxLength = Math.max(...signatures.map(s => s.length));
    const aggregated: PowerSignature[] = [];
    
    for (let i = 0; i < maxLength; i++) {
      let totalPower = 0;
      let avgVoltage = 0;
      let totalCurrent = 0;
      let validSamples = 0;
      let time = 0;
      
      signatures.forEach(signature => {
        if (signature[i]) {
          totalPower += signature[i].power;
          avgVoltage += signature[i].voltage;
          totalCurrent += signature[i].current;
          time = signature[i].time;
          validSamples++;
        }
      });
      
      if (validSamples > 0) {
        aggregated.push({
          time,
          power: totalPower,
          voltage: avgVoltage / validSamples,
          current: totalCurrent,
        });
      }
    }
    
    return aggregated;
  }
}

export const waveformGenerator = new WaveformGenerator();