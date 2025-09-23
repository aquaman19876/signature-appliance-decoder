import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    toast("Energy simulation started! Watch the waveforms in real-time.", {
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
    setAppliances(prev => prev.map(app => ({ ...app, isOn: false })));
    toast("Simulation reset", { duration: 1000 });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isSimulating && simulationTime < maxSimulationTime) {
      interval = setInterval(() => {
        setSimulationTime(prev => {
          const next = prev + 100;
          if (next >= maxSimulationTime) {
            setIsSimulating(false);
            toast("Simulation completed! Check the disaggregation results.", {
              duration: 4000,
            });
          }
          return next;
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [isSimulating, simulationTime, maxSimulationTime]);

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
                Turn on appliances, start the simulation, and watch how AI disaggregates the combined energy signal
              </p>
            </div>
          </div>
        </Card>

        {/* Control Panel */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button 
              onClick={startSimulation} 
              disabled={isSimulating || activeAppliances.length === 0}
              className="bg-energy-primary hover:bg-energy-primary/90"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Simulation
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
              <Badge className="bg-energy-success">
                Simulating... {((simulationTime / maxSimulationTime) * 100).toFixed(0)}%
              </Badge>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="appliances" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appliances">Appliances</TabsTrigger>
            <TabsTrigger value="waveforms">Waveforms</TabsTrigger>
            <TabsTrigger value="aggregated">Aggregated Signal</TabsTrigger>
            <TabsTrigger value="recognition">Pattern Recognition</TabsTrigger>
          </TabsList>

          <TabsContent value="appliances" className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Available Appliances</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {appliances.map(appliance => (
                  <ApplianceSwitch
                    key={appliance.id}
                    appliance={appliance}
                    onToggle={handleApplianceToggle}
                  />
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="waveforms" className="space-y-4">
            {activeAppliances.map(appliance => (
              <WaveformChart
                key={appliance.id}
                title={`${appliance.name} - Individual Signature`}
                data={individualSignatures[appliance.id] || []}
                height={250}
              />
            ))}
            {activeAppliances.length === 0 && (
              <Card className="p-8 text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Turn on some appliances to see their individual waveforms</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="aggregated" className="space-y-4">
            <WaveformChart
              title="Total Power Consumption (Aggregated Signal)"
              data={aggregatedSignal}
              showIndividual={true}
              appliances={appliances}
              height={400}
            />
          </TabsContent>

          <TabsContent value="recognition" className="space-y-4">
            <PatternRecognition
              appliances={appliances}
              aggregatedSignal={aggregatedSignal}
              individualSignatures={individualSignatures}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;