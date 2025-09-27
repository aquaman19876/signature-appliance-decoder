import { useMemo, useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Appliance, PowerSignature, DisaggregationResult } from '@/types/appliance';
import { Brain, Target, Clock, Zap, Play, Pause, RotateCcw, Activity } from 'lucide-react';

interface PatternRecognitionProps {
  appliances: Appliance[];
  aggregatedSignal: PowerSignature[];
  individualSignatures: Record<string, PowerSignature[]>;
  referenceSignatures: Record<string, PowerSignature[]>;
  isSimulating: boolean;
  onAnalysisStateChange?: (isAnalyzing: boolean) => void;
}

export class EnergyDisaggregator {
  static disaggregate(
    aggregatedSignal: PowerSignature[],
    appliances: Appliance[],
    individualSignatures: Record<string, PowerSignature[]>,
    referenceSignatures: Record<string, PowerSignature[]>
  ): DisaggregationResult[] {
    const results: DisaggregationResult[] = [];
    
    // Simple but effective approach: detect appliances based on their current state and power levels
    appliances.forEach(appliance => {
      if (referenceSignatures[appliance.id] && aggregatedSignal.length > 0) {
        const detectedPeriods = this.detectApplianceUsage(
          aggregatedSignal, 
          referenceSignatures[appliance.id], 
          appliance
        );
        
        if (detectedPeriods.length > 0) {
          const totalDuration = detectedPeriods.reduce((sum, period) => 
            sum + (period.endTime - period.startTime), 0
          ) / 60000; // Convert to minutes
          
          const avgConfidence = detectedPeriods.reduce((sum, period) => 
            sum + period.confidence, 0
          ) / detectedPeriods.length;
          
          const energyConsumed = (appliance.powerRating * totalDuration) / 60; // Wh
          
          // Include results with reasonable confidence
          if (avgConfidence > 0.2) {
            results.push({
              appliance,
              duration: totalDuration,
              energyConsumed,
              confidence: avgConfidence,
              detectedPeriods,
            });
          }
        }
      }
    });
    
    return results.sort((a, b) => b.confidence - a.confidence);
  }
  
  private static detectApplianceUsage(
    aggregatedSignal: PowerSignature[],
    referenceSignature: PowerSignature[],
    appliance: Appliance
  ) {
    const periods: Array<{
      startTime: number;
      endTime: number;
      confidence: number;
    }> = [];
    
    // For active appliances, use power level matching
    if (appliance.isOn) {
      const avgPower = aggregatedSignal.reduce((sum, s) => sum + s.power, 0) / aggregatedSignal.length;
      const expectedPower = appliance.powerRating;
      
      // Calculate confidence based on power level match
      const powerMatch = 1 - Math.abs(avgPower - expectedPower) / Math.max(avgPower, expectedPower, 1);
      
      if (powerMatch > 0.3) {
        periods.push({
          startTime: aggregatedSignal[0]?.time || 0,
          endTime: aggregatedSignal[aggregatedSignal.length - 1]?.time || 0,
          confidence: Math.min(0.9, powerMatch + 0.3), // Boost confidence for active appliances
        });
      }
    } else {
      // For inactive appliances, use pattern matching
      const windowSize = Math.min(25, referenceSignature.length);
      const stepSize = 5;
      const threshold = 0.4;
      
      for (let i = 0; i <= aggregatedSignal.length - windowSize; i += stepSize) {
        const window = aggregatedSignal.slice(i, i + windowSize);
        const refWindow = referenceSignature.slice(0, windowSize);
        
        const powerCorrelation = this.calculateCorrelation(
          window.map(s => s.power),
          refWindow.map(s => s.power)
        );
        
        const patternCorrelation = this.calculatePatternCorrelation(window, refWindow);
        const confidence = (powerCorrelation * 0.6 + patternCorrelation * 0.4);
        
        if (confidence > threshold) {
          const startTime = window[0].time;
          const endTime = window[window.length - 1].time;
          
          const lastPeriod = periods[periods.length - 1];
          if (lastPeriod && startTime <= lastPeriod.endTime + 200) {
            lastPeriod.endTime = endTime;
            lastPeriod.confidence = Math.max(lastPeriod.confidence, confidence);
          } else {
            periods.push({
              startTime,
              endTime,
              confidence,
            });
          }
        }
      }
    }
    
    return periods;
  }
  
  private static calculatePatternCorrelation(signal1: PowerSignature[], signal2: PowerSignature[]): number {
    if (signal1.length !== signal2.length) return 0;
    
    // Calculate pattern-based features
    const features1 = this.extractFeatures(signal1);
    const features2 = this.extractFeatures(signal2);
    
    // Compare feature similarity with more tolerance
    let similarity = 0;
    
    // Average power comparison with more tolerance
    const powerDiff = Math.abs(features1.avgPower - features2.avgPower);
    const maxPower = Math.max(features1.avgPower, features2.avgPower, 1);
    similarity += Math.max(0, 1 - powerDiff / (maxPower * 0.5)); // More tolerant
    
    // Variance comparison with more tolerance
    const varianceDiff = Math.abs(features1.variance - features2.variance);
    const maxVariance = Math.max(features1.variance, features2.variance, 1);
    similarity += Math.max(0, 1 - varianceDiff / (maxVariance * 0.3)); // More tolerant
    
    // Peak-to-peak comparison with more tolerance
    const peakDiff = Math.abs(features1.peakToPeak - features2.peakToPeak);
    const maxPeak = Math.max(features1.peakToPeak, features2.peakToPeak, 1);
    similarity += Math.max(0, 1 - peakDiff / (maxPeak * 0.4)); // More tolerant
    
    return Math.min(1, similarity / 3);
  }
  
  private static extractFeatures(signal: PowerSignature[]) {
    const powers = signal.map(s => s.power);
    const avgPower = powers.reduce((a, b) => a + b, 0) / powers.length;
    const variance = powers.reduce((sum, p) => sum + Math.pow(p - avgPower, 2), 0) / powers.length;
    const peakToPeak = Math.max(...powers) - Math.min(...powers);
    
    return { avgPower, variance, peakToPeak };
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
  individualSignatures,
  referenceSignatures,
  isSimulating,
  onAnalysisStateChange
}: PatternRecognitionProps) => {
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [collectedData, setCollectedData] = useState<PowerSignature[]>([]);
  const [dataStreamActive, setDataStreamActive] = useState(false);
  const [lastToggleTime, setLastToggleTime] = useState<number>(0);
  const previousApplianceStates = useRef<Record<string, boolean>>({});
  const dataCollectionInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Track appliance toggle changes
  useEffect(() => {
    const currentStates = appliances.reduce((acc, appliance) => {
      acc[appliance.id] = appliance.isOn;
      return acc;
    }, {} as Record<string, boolean>);
    
    // Check if any appliance state has changed
    const hasStateChanged = appliances.some(appliance => 
      previousApplianceStates.current[appliance.id] !== appliance.isOn
    );
    
    if (hasStateChanged && isSimulating) {
      setLastToggleTime(Date.now());
      
      // Start data collection when any appliance is turned on
      const hasActiveAppliances = appliances.some(a => a.isOn);
      if (hasActiveAppliances && !dataStreamActive) {
        startDataCollection();
      } else if (!hasActiveAppliances && dataStreamActive) {
        stopDataCollection();
      }
    }
    
    previousApplianceStates.current = currentStates;
  }, [appliances, isSimulating, dataStreamActive]);
  
  // Stop data collection when simulation stops
  useEffect(() => {
    if (!isSimulating && dataStreamActive) {
      stopDataCollection();
    }
  }, [isSimulating, dataStreamActive]);
  
  const startDataCollection = () => {
    if (dataCollectionInterval.current) {
      clearInterval(dataCollectionInterval.current);
    }
    
    setDataStreamActive(true);
    setIsAnalyzing(true);
    setCollectedData([]);
    onAnalysisStateChange?.(true);
    
    // Collect data every 100ms for real-time analysis
    dataCollectionInterval.current = setInterval(() => {
      if (aggregatedSignal.length > 0) {
        setCollectedData(prev => {
          const newData = [...prev, ...aggregatedSignal.slice(-10)]; // Take last 10 samples
          // Keep only last 500 samples to prevent memory issues
          return newData.slice(-500);
        });
      }
    }, 100);
  };
  
  const stopDataCollection = () => {
    if (dataCollectionInterval.current) {
      clearInterval(dataCollectionInterval.current);
      dataCollectionInterval.current = null;
    }
    
    setDataStreamActive(false);
    setIsAnalyzing(false);
    onAnalysisStateChange?.(false);
  };
  
  const resetAnalysis = () => {
    stopDataCollection();
    setCollectedData([]);
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (dataCollectionInterval.current) {
        clearInterval(dataCollectionInterval.current);
      }
    };
  }, []);
  
  const disaggregationResults = useMemo(() => {
    // Use collected data when actively analyzing, otherwise use current aggregated signal
    const dataToAnalyze = dataStreamActive && collectedData.length > 0 ? collectedData : aggregatedSignal;
    
    if (!isAnalyzing && !dataStreamActive) {
      return [];
    }
    
    return EnergyDisaggregator.disaggregate(
      dataToAnalyze, 
      appliances, 
      individualSignatures, 
      referenceSignatures
    );
  }, [collectedData, aggregatedSignal, appliances, individualSignatures, referenceSignatures, isAnalyzing, dataStreamActive]);
  
  const totalEnergyDetected = disaggregationResults.reduce((sum, result) => sum + result.energyConsumed, 0);
  const activeAppliances = appliances.filter(a => a.isOn);
  const samplesCollected = dataStreamActive ? collectedData.length : aggregatedSignal.length;
  
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-energy-secondary" />
          <h3 className="text-lg font-semibold">Pattern Recognition & Disaggregation</h3>
          {dataStreamActive && (
            <Badge className="bg-energy-success animate-pulse text-xs">
              <Activity className="w-3 h-3 mr-1" />
              Live Analysis
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={startDataCollection}
            disabled={!isSimulating || activeAppliances.length === 0 || dataStreamActive}
            size="sm"
            className="bg-energy-primary hover:bg-energy-primary/90"
          >
            <Play className="w-3 h-3 mr-1" />
            Start Analysis
          </Button>
          
          <Button
            onClick={stopDataCollection}
            disabled={!dataStreamActive}
            size="sm"
            variant="outline"
          >
            <Pause className="w-3 h-3 mr-1" />
            Stop
          </Button>
          
          <Button
            onClick={resetAnalysis}
            size="sm"
            variant="outline"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>
      
      {/* Data Collection Status */}
      <div className="mb-4 p-3 bg-muted/30 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              dataStreamActive ? 'bg-energy-success animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="font-medium">
              Data Stream: {dataStreamActive ? 'Active' : 'Stopped'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Target className="w-3 h-3 text-muted-foreground" />
            <span>{samplesCollected} samples collected</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-muted-foreground" />
            <span>{activeAppliances.length} appliances active</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span>Last toggle: {lastToggleTime ? `${((Date.now() - lastToggleTime) / 1000).toFixed(1)}s ago` : 'Never'}</span>
          </div>
        </div>
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
            {!dataStreamActive ? (
              <>
                <p>Data collection stopped. Click "Start Analysis" to begin pattern recognition!</p>
                <p className="text-xs mt-1">Toggle appliances and start analysis to see real-time disaggregation</p>
              </>
            ) : (
              <>
                <p>Collecting data... {samplesCollected} samples gathered</p>
                <p className="text-xs mt-1">The AI is analyzing power signatures to identify individual appliances</p>
              </>
            )}
          </div>
        ) : (
          disaggregationResults.map((result) => (
            <Card key={result.appliance.id} className="p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div>
                    <h5 className="font-medium">{result.appliance.name}</h5>
                    <p className="text-sm text-muted-foreground">
                      {result.appliance.brand} {result.appliance.model}
                    </p>
                  </div>
                  {result.appliance.isOn && (
                    <Badge variant="outline" className="bg-energy-success/10 text-energy-success border-energy-success">
                      ACTIVE
                    </Badge>
                  )}
                </div>
                <Badge 
                  variant="outline"
                  className={`${
                    result.confidence > 0.8 
                      ? 'border-energy-success text-energy-success' 
                      : result.confidence > 0.5 
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
                    <strong>{result.duration.toFixed(1)} min</strong> detected
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
                  <span>Pattern Match Confidence</span>
                  <span>{(result.confidence * 100).toFixed(1)}%</span>
                </div>
                <Progress 
                  value={result.confidence * 100} 
                  className="h-2"
                />
              </div>
              
              {/* Reference Signature Preview */}
              {referenceSignatures[result.appliance.id] && (
                <div className="mt-3 p-2 bg-background/50 rounded border">
                  <div className="text-xs text-muted-foreground mb-1">Reference Pattern Used for Matching:</div>
                  <div className="flex items-center gap-2">
                    <svg width="120" height="30" className="border rounded bg-muted/20">
                      <polyline
                        fill="none"
                        stroke="hsl(var(--energy-secondary))"
                        strokeWidth="1.5"
                        points={referenceSignatures[result.appliance.id]
                          .slice(0, 30)
                          .map((point, index) => {
                            const maxPower = Math.max(...referenceSignatures[result.appliance.id].map(s => s.power));
                            const x = (index / 29) * 118 + 1;
                            const y = 28 - (point.power / maxPower) * 26;
                            return `${x},${y}`;
                          }).join(' ')}
                      />
                    </svg>
                    <div className="text-xs">
                      <div>Type: <span className="font-medium">{result.appliance.type}</span></div>
                      <div>Expected: <span className="font-medium">{result.appliance.powerRating}W</span></div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </Card>
  );
};