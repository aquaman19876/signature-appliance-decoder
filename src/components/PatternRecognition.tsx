import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Appliance, PowerSignature, DisaggregationResult } from '@/types/appliance';
import { Brain, Target, Clock, Zap } from 'lucide-react';

interface PatternRecognitionProps {
  appliances: Appliance[];
  aggregatedSignal: PowerSignature[];
  individualSignatures: Record<string, PowerSignature[]>;
}

export class EnergyDisaggregator {
  static disaggregate(
    aggregatedSignal: PowerSignature[],
    appliances: Appliance[],
    individualSignatures: Record<string, PowerSignature[]>
  ): DisaggregationResult[] {
    const results: DisaggregationResult[] = [];
    
    appliances.forEach(appliance => {
      if (appliance.isOn && individualSignatures[appliance.id]) {
        const signature = individualSignatures[appliance.id];
        const detectedPeriods = this.detectApplianceUsage(aggregatedSignal, signature, appliance);
        
        const totalDuration = detectedPeriods.reduce((sum, period) => 
          sum + (period.endTime - period.startTime), 0
        ) / 60000; // Convert to minutes
        
        const avgConfidence = detectedPeriods.length > 0 
          ? detectedPeriods.reduce((sum, period) => sum + period.confidence, 0) / detectedPeriods.length
          : 0;
        
        const energyConsumed = (appliance.powerRating * totalDuration) / 60; // Wh
        
        if (detectedPeriods.length > 0) {
          results.push({
            appliance,
            duration: totalDuration,
            energyConsumed,
            confidence: avgConfidence,
            detectedPeriods,
          });
        }
      }
    });
    
    return results.sort((a, b) => b.confidence - a.confidence);
  }
  
  private static detectApplianceUsage(
    aggregatedSignal: PowerSignature[],
    applianceSignature: PowerSignature[],
    appliance: Appliance
  ) {
    const periods: Array<{
      startTime: number;
      endTime: number;
      confidence: number;
    }> = [];
    
    const windowSize = Math.min(100, applianceSignature.length);
    const threshold = 0.7; // 70% correlation threshold
    
    for (let i = 0; i <= aggregatedSignal.length - windowSize; i += 10) {
      const window = aggregatedSignal.slice(i, i + windowSize);
      const signatureWindow = applianceSignature.slice(0, windowSize);
      
      const correlation = this.calculateCorrelation(
        window.map(s => s.power),
        signatureWindow.map(s => s.power)
      );
      
      if (correlation > threshold) {
        const startTime = window[0].time;
        const endTime = window[window.length - 1].time;
        
        // Merge overlapping periods
        const lastPeriod = periods[periods.length - 1];
        if (lastPeriod && startTime <= lastPeriod.endTime + 1000) {
          lastPeriod.endTime = endTime;
          lastPeriod.confidence = Math.max(lastPeriod.confidence, correlation);
        } else {
          periods.push({
            startTime,
            endTime,
            confidence: correlation,
          });
        }
      }
    }
    
    return periods;
  }
  
  private static calculateCorrelation(signal1: number[], signal2: number[]): number {
    if (signal1.length !== signal2.length) return 0;
    
    const n = signal1.length;
    const mean1 = signal1.reduce((sum, val) => sum + val, 0) / n;
    const mean2 = signal2.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;
    
    for (let i = 0; i < n; i++) {
      const diff1 = signal1[i] - mean1;
      const diff2 = signal2[i] - mean2;
      
      numerator += diff1 * diff2;
      sum1Sq += diff1 * diff1;
      sum2Sq += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(sum1Sq * sum2Sq);
    return denominator === 0 ? 0 : Math.abs(numerator / denominator);
  }
}

export const PatternRecognition = ({ 
  appliances, 
  aggregatedSignal, 
  individualSignatures 
}: PatternRecognitionProps) => {
  
  const disaggregationResults = useMemo(() => {
    return EnergyDisaggregator.disaggregate(aggregatedSignal, appliances, individualSignatures);
  }, [aggregatedSignal, appliances, individualSignatures]);
  
  const totalEnergyDetected = disaggregationResults.reduce((sum, result) => sum + result.energyConsumed, 0);
  
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-energy-secondary" />
        <h3 className="text-lg font-semibold">Pattern Recognition & Disaggregation</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="p-3 bg-gradient-to-r from-energy-primary/10 to-energy-secondary/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Energy</p>
              <p className="text-xl font-bold">{totalEnergyDetected.toFixed(2)} Wh</p>
            </div>
            <Zap className="w-8 h-8 text-energy-primary" />
          </div>
        </Card>
        
        <Card className="p-3 bg-gradient-to-r from-energy-secondary/10 to-energy-success/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Devices</p>
              <p className="text-xl font-bold">{disaggregationResults.length}</p>
            </div>
            <Target className="w-8 h-8 text-energy-secondary" />
          </div>
        </Card>
        
        <Card className="p-3 bg-gradient-to-r from-energy-success/10 to-energy-warning/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
              <p className="text-xl font-bold">
                {disaggregationResults.length > 0 
                  ? (disaggregationResults.reduce((sum, r) => sum + r.confidence, 0) / disaggregationResults.length * 100).toFixed(0)
                  : 0}%
              </p>
            </div>
            <Brain className="w-8 h-8 text-energy-success" />
          </div>
        </Card>
      </div>
      
      <div className="space-y-3">
        <h4 className="font-medium flex items-center gap-2">
          <Target className="w-4 h-4" />
          Detected Appliance Usage
        </h4>
        
        {disaggregationResults.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No patterns detected. Turn on some appliances to see disaggregation in action!</p>
          </div>
        ) : (
          disaggregationResults.map((result) => (
            <Card key={result.appliance.id} className="p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h5 className="font-medium">{result.appliance.name}</h5>
                  <p className="text-sm text-muted-foreground">
                    {result.appliance.brand} {result.appliance.model}
                  </p>
                </div>
                <Badge 
                  variant="outline"
                  className={`${
                    result.confidence > 0.8 
                      ? 'border-energy-success text-energy-success' 
                      : result.confidence > 0.6 
                      ? 'border-energy-warning text-energy-warning'
                      : 'border-energy-danger text-energy-danger'
                  }`}
                >
                  {(result.confidence * 100).toFixed(0)}% match
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{result.duration.toFixed(1)} min</strong> active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{result.energyConsumed.toFixed(2)} Wh</strong> consumed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{result.detectedPeriods.length}</strong> periods
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Detection Confidence</span>
                  <span>{(result.confidence * 100).toFixed(1)}%</span>
                </div>
                <Progress 
                  value={result.confidence * 100} 
                  className="h-2"
                />
              </div>
            </Card>
          ))
        )}
      </div>
    </Card>
  );
};