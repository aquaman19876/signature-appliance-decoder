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
          case 'microwave':
            power = this.generateMicrowaveSignature(appliance, timeMs);
            break;
          case 'washing_machine':
            power = this.generateWashingMachineSignature(appliance, timeMs);
            break;
          case 'fridge':
            power = this.generateFridgeSignature(appliance, timeMs);
            break;
          default:
            power = appliance.powerRating;
        }
        
        // Add realistic voltage fluctuations
        voltage += Math.sin(timeMs * 0.02) * 2 + Math.random() * 1.5 - 0.75;
        current = power / (voltage * (appliance.powerFactor || 1));
      } else {
        // When appliance is OFF, power should be 0 but with some realistic characteristics
        power = 0;
        voltage = appliance.voltage + (Math.random() - 0.5) * 0.5; // Slight voltage variation
        current = 0;
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
  
  private generateMicrowaveSignature(appliance: Appliance, time: number): number {
    const basePower = appliance.powerRating;
    
    // Microwave has very distinctive signature: high power with cycling pattern
    if (time < 200) {
      // Startup surge
      const startupPower = appliance.startupPower || basePower * 1.2;
      const rampUp = 1 - Math.exp(-time / 50);
      return startupPower * (1 - rampUp) + basePower * rampUp;
    }
    
    // Cycling pattern - microwave magnetron cycles on/off
    const cyclePeriod = 2000; // 2 second cycles
    const cyclePosition = (time % cyclePeriod) / cyclePeriod;
    
    if (cyclePosition < 0.8) {
      // Magnetron ON - full power
      const magnetronNoise = Math.sin(time * 0.1) * 20; // High frequency noise
      const powerVariation = Math.sin(time * 0.05) * 30; // Slow power variation
      return Math.max(0, basePower + magnetronNoise + powerVariation);
    } else {
      // Magnetron OFF - only control circuits
      return basePower * 0.1; // 10% for control circuits
    }
  }
  
  private generateWashingMachineSignature(appliance: Appliance, time: number): number {
    const basePower = appliance.powerRating;
    
    // Washing machine has very distinctive phases
    if (time < 500) {
      // Startup phase - water filling
      const startupPower = appliance.startupPower || basePower * 1.25;
      const rampUp = 1 - Math.exp(-time / 100);
      return startupPower * (1 - rampUp) + basePower * 0.3 * rampUp;
    }
    
    // Different washing phases with distinct power patterns
    const phaseDuration = 30000; // 30 seconds per phase
    const phase = Math.floor(time / phaseDuration) % 4;
    
    switch (phase) {
      case 0: // Washing phase - moderate power with agitation
        const agitationPattern = Math.sin(time * 0.2) * 200; // Agitation cycles
        return basePower * 0.6 + agitationPattern;
        
      case 1: // Rinse phase - high power with spinning
        const spinPattern = Math.sin(time * 0.5) * 300; // Spinning cycles
        return basePower * 0.8 + spinPattern;
        
      case 2: // Drain phase - pump running
        const pumpNoise = Math.sin(time * 0.3) * 100;
        return basePower * 0.4 + pumpNoise;
        
      case 3: // Spin dry phase - very high power
        const spinDryPattern = Math.sin(time * 0.8) * 400; // High speed spinning
        return basePower * 1.1 + spinDryPattern;
        
      default:
        return basePower * 0.3; // Standby
    }
  }
  
  private generateFridgeSignature(appliance: Appliance, time: number): number {
    const basePower = appliance.powerRating;
    
    // Refrigerator has very distinctive cycling pattern
    const cyclePeriod = 12000; // 12 second compressor cycles
    const cyclePosition = (time % cyclePeriod) / cyclePeriod;
    
    if (cyclePosition < 0.3) {
      // Compressor ON phase
      if (time < 1000) {
        // Startup surge
        const startupPower = appliance.startupPower || basePower * 2;
        const rampUp = 1 - Math.exp(-time / 200);
        return startupPower * (1 - rampUp) + basePower * rampUp;
      }
      
      // Normal compressor operation
      const compressorNoise = Math.sin(time * 0.1) * 10;
      const loadVariation = Math.sin(time * 0.02) * 20;
      return basePower + compressorNoise + loadVariation;
    } else {
      // Compressor OFF phase - only control circuits
      const controlPower = basePower * 0.05; // 5% for control circuits
      const fanPower = Math.sin(time * 0.05) * 5; // Internal fan
      return controlPower + fanPower;
    }
  }
  
  // Generate real-time aggregated signal based on current appliance states
  generateRealtimeAggregatedSignal(appliances: Appliance[], duration: number = 1000): PowerSignature[] {
    const samples: PowerSignature[] = [];
    const samplesCount = Math.floor(duration * this.sampleRate / 1000);
    
    // Debug: Log active appliances
    const activeAppliances = appliances.filter(a => a.isOn);
    console.log('generateRealtimeAggregatedSignal - Active appliances:', activeAppliances.map(a => a.name));
    
    for (let i = 0; i < samplesCount; i++) {
      const timeMs = i * (1000 / this.sampleRate);
      let totalPower = 8; // Base household consumption
      let avgVoltage = 220;
      let totalCurrent = 0.04; // Base current
      
      // Only add power from appliances that are currently ON
      appliances.forEach(appliance => {
        if (appliance.isOn) {
          const appliancePower = this.getAppliancePowerAtTime(appliance, timeMs);
          totalPower += appliancePower;
          
          // Add voltage and current contributions
          const voltage = appliance.voltage + Math.sin(timeMs * 0.02) * 2 + (Math.random() - 0.5) * 1.5;
          const current = appliancePower / (voltage * (appliance.powerFactor || 1));
          avgVoltage += voltage;
          totalCurrent += current;
        }
      });
      
      // Calculate average voltage
      const activeCount = appliances.filter(a => a.isOn).length;
      if (activeCount > 0) {
        avgVoltage = avgVoltage / (activeCount + 1); // +1 for base voltage
      }
      
      // Add realistic grid variations
      totalPower += Math.sin(timeMs * 0.01) * 1 + (Math.random() - 0.5) * 0.5;
      
      samples.push({
        time: timeMs,
        power: Math.max(0, totalPower),
        voltage: avgVoltage,
        current: totalCurrent,
      });
    }
    
    return samples;
  }
  
  // Get power consumption for a specific appliance at a specific time
  private getAppliancePowerAtTime(appliance: Appliance, timeMs: number): number {
    if (!appliance.isOn) return 0;
    
    switch (appliance.type) {
      case 'bulb':
        return this.generateBulbSignature(appliance, timeMs);
      case 'tube_light':
        return this.generateTubeLightSignature(appliance, timeMs);
      case 'fan':
        return this.generateFanSignature(appliance, timeMs);
      case 'microwave':
        return this.generateMicrowaveSignature(appliance, timeMs);
      case 'washing_machine':
        return this.generateWashingMachineSignature(appliance, timeMs);
      case 'fridge':
        return this.generateFridgeSignature(appliance, timeMs);
      default:
        return appliance.powerRating;
    }
  }
  
  aggregateSignatures(signatures: PowerSignature[][], activeAppliances: Appliance[]): PowerSignature[] {
    if (signatures.length === 0) {
      // Return baseline consumption even when no appliances are on
      return this.generateBaselineSignature();
    }
    
    const maxLength = Math.max(...signatures.map(s => s.length));
    const aggregated: PowerSignature[] = [];
    
    for (let i = 0; i < maxLength; i++) {
      let totalPower = 8; // Base household consumption
      let avgVoltage = 220;
      let totalCurrent = 0.04; // Base current
      let time = i * (1000 / this.sampleRate);
      
      // Only add power from appliances that are currently ON
      // This creates a real-time aggregated signal that reflects current state
      activeAppliances.forEach((appliance, index) => {
        if (appliance.isOn && signatures[index] && signatures[index][i]) {
          totalPower += signatures[index][i].power;
          avgVoltage += signatures[index][i].voltage;
          totalCurrent += signatures[index][i].current;
        }
      });
      
      // Calculate average voltage
      const activeCount = activeAppliances.filter(a => a.isOn).length;
      if (activeCount > 0) {
        avgVoltage = avgVoltage / (activeCount + 1); // +1 for base voltage
      }
      
      // Add realistic grid variations
      totalPower += Math.sin(time * 0.01) * 1 + (Math.random() - 0.5) * 0.5;
      
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
        case 'microwave':
          // Clean microwave signature with cycling pattern
          const cyclePeriod = 2000;
          const cyclePosition = (timeMs % cyclePeriod) / cyclePeriod;
          power = cyclePosition < 0.8 ? appliance.powerRating : appliance.powerRating * 0.1;
          break;
        case 'washing_machine':
          // Clean washing machine signature with phases
          const phaseDuration = 30000;
          const phase = Math.floor(timeMs / phaseDuration) % 4;
          const phaseMultipliers = [0.6, 0.8, 0.4, 1.1];
          power = appliance.powerRating * phaseMultipliers[phase] || appliance.powerRating * 0.3;
          break;
        case 'fridge':
          // Clean fridge signature with cycling
          const fridgeCyclePeriod = 12000;
          const fridgeCyclePosition = (timeMs % fridgeCyclePeriod) / fridgeCyclePeriod;
          power = fridgeCyclePosition < 0.3 ? appliance.powerRating : appliance.powerRating * 0.05;
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