import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ApplianceSwitch } from '@/components/ApplianceSwitch';
import { WaveformChart } from '@/components/WaveformChart';
import { PatternRecognition } from '@/components/PatternRecognition';
import { DEFAULT_APPLIANCES } from '@/types/appliance';
import { waveformGenerator } from '@/utils/waveformGenerator';
import { toast } from 'sonner';
import { Play, Pause, RotateCcw, BookOpen, Zap, Activity } from 'lucide-react';

const Index = () => {
  const [appliances, setAppliances] = useState(DEFAULT_APPLIANCES);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationTime, setSimulationTime] = useState(0);
  const [maxSimulationTime] = useState(10000); // 10 seconds

  const handleApplianceToggle = (id: string, isOn: boolean) => {
    setAppliances(prev => prev.map(app => 
      app.id === id ? { ...app, isOn } : app
    ));
    
    const appliance = appliances.find(a => a.id === id);
    if (appliance) {
      toast(
        isOn 
          ? `${appliance.name} turned ON` 
          : `${appliance.name} turned OFF`,
        {
          description: isOn 
            ? `Power consumption: ${appliance.powerRating}W` 
            : 'Power consumption stopped',
          duration: 2000,
        }
      );
    }
  };

  const startSimulation = () => {
    setIsSimulating(true);
    setSimulationTime(0);
    toast("Realtime simulation started! Toggle appliances to see live updates.", {
      duration: 3000,
    });
  };

  const pauseSimulation = () => {
    setIsSimulating(false);
    toast("Simulation paused", { duration: 1000 });
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setSimulationTime(0);
    toast("Simulation reset", { duration: 1000 });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isSimulating) {
      interval = setInterval(() => {
        setSimulationTime(prev => prev + 100);
      }, 100);
    }

    return () => clearInterval(interval);
  }, [isSimulating]);

  const { aggregatedSignal, individualSignatures } = useMemo(() => {
    const signatures: Record<string, any[]> = {};
    const allSignatures: any[][] = [];

    appliances.forEach(appliance => {
      const signature = waveformGenerator.generateApplianceSignature(appliance, simulationTime || 1000);
      signatures[appliance.id] = signature;
      
      if (appliance.isOn) {
        allSignatures.push(signature);
      }
    });

    const aggregated = waveformGenerator.aggregateSignatures(allSignatures);

    return {
      aggregatedSignal: aggregated,
      individualSignatures: signatures,
    };
  }, [appliances, simulationTime]);

  const activeAppliances = appliances.filter(a => a.isOn);
  const totalPower = activeAppliances.reduce((sum, app) => sum + app.powerRating, 0);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-energy-primary to-energy-secondary bg-clip-text text-transparent">
            Energy Disaggregation Simulator
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Learn how smart meters identify individual appliances from total power consumption using pattern recognition and signature analysis
          </p>
        </div>

        {/* Tutorial Banner */}
        <Card className="p-4 bg-gradient-to-r from-energy-primary/10 to-energy-secondary/10 border-energy-primary/20">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-energy-primary" />
            <div>
              <h3 className="font-semibold">Interactive Tutorial</h3>
              <p className="text-sm text-muted-foreground">
                Toggle appliances in real-time during simulation and watch live pattern recognition updates
              </p>
            </div>
          </div>
        </Card>

        {/* Control Panel */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button 
              onClick={startSimulation} 
              disabled={activeAppliances.length === 0}
              className="bg-energy-primary hover:bg-energy-primary/90"
            >
              <Play className="w-4 h-4 mr-2" />
              {isSimulating ? 'Running Live' : 'Start Simulation'}
            </Button>
            <Button 
              onClick={pauseSimulation} 
              disabled={!isSimulating}
              variant="outline"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
            <Button onClick={resetSimulation} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <Zap className="w-3 h-3" />
              {totalPower}W Total Load
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Activity className="w-3 h-3" />
              {activeAppliances.length} Active
            </Badge>
            {isSimulating && (
              <Badge className="bg-energy-success animate-pulse">
                Live Simulation Running
              </Badge>
            )}
          </div>
        </div>

        {/* Main Content - All Panels Visible */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column */}
          <div className="space-y-6">
            {/* Appliances Control Panel */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Available Appliances</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appliances.map(appliance => (
                  <ApplianceSwitch
                    key={appliance.id}
                    appliance={appliance}
                    onToggle={handleApplianceToggle}
                    signatureData={individualSignatures[appliance.id] || []}
                  />
                ))}
              </div>
            </Card>
            
            {/* Pattern Recognition Panel */}
            <PatternRecognition
              appliances={appliances}
              aggregatedSignal={aggregatedSignal}
              individualSignatures={individualSignatures}
            />
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            {/* Aggregated Signal */}
            <WaveformChart
              title="Total Power Consumption (Aggregated Signal)"
              data={aggregatedSignal}
              showIndividual={true}
              appliances={appliances}
              height={350}
            />
            
            {/* Individual Waveforms */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Individual Appliance Signatures</h3>
              {activeAppliances.map(appliance => (
                <WaveformChart
                  key={appliance.id}
                  title={`${appliance.name} - Live Signature`}
                  data={individualSignatures[appliance.id] || []}
                  height={200}
                />
              ))}
              {activeAppliances.length === 0 && (
                <Card className="p-8 text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Turn on appliances to see their individual signatures</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;