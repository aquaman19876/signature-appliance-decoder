import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Appliance } from '@/types/appliance';
import { Lightbulb, Fan, Zap, Power } from 'lucide-react';

interface ApplianceSwitchProps {
  appliance: Appliance;
  onToggle: (id: string, isOn: boolean) => void;
}

export const ApplianceSwitch = ({ appliance, onToggle }: ApplianceSwitchProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const getApplianceIcon = () => {
    switch (appliance.type) {
      case 'bulb':
        return <Lightbulb className={`w-6 h-6 transition-colors ${appliance.isOn ? 'text-energy-warning' : 'text-muted-foreground'}`} />;
      case 'tube_light':
        return <Zap className={`w-6 h-6 transition-colors ${appliance.isOn ? 'text-energy-primary' : 'text-muted-foreground'}`} />;
      case 'fan':
        return <Fan className={`w-6 h-6 transition-transform duration-500 ${appliance.isOn ? 'animate-spin text-energy-secondary' : 'text-muted-foreground'}`} />;
      default:
        return <Power className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const handleToggle = () => {
    setIsAnimating(true);
    onToggle(appliance.id, !appliance.isOn);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const getEfficiencyColor = () => {
    if (!appliance.efficiency) return 'bg-muted';
    if (appliance.efficiency >= 80) return 'bg-energy-success';
    if (appliance.efficiency >= 50) return 'bg-energy-warning';
    return 'bg-energy-danger';
  };

  return (
    <Card className={`p-4 transition-all duration-300 hover:shadow-lg ${
      appliance.isOn ? 'ring-2 ring-energy-primary shadow-[var(--shadow-energy)]' : ''
    } ${isAnimating ? 'scale-105' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getApplianceIcon()}
          <div>
            <h3 className="font-semibold text-sm">{appliance.name}</h3>
            <p className="text-xs text-muted-foreground">{appliance.brand} {appliance.model}</p>
          </div>
        </div>
        <Switch 
          checked={appliance.isOn} 
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-energy-primary"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Power:</span>
          <span className="font-medium">{appliance.powerRating}W</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Voltage:</span>
          <span className="font-medium">{appliance.voltage}V</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Current:</span>
          <span className="font-medium">{appliance.current.toFixed(2)}A</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">P.F.:</span>
          <span className="font-medium">{appliance.powerFactor?.toFixed(2) || 'N/A'}</span>
        </div>
      </div>
      
      {appliance.efficiency && (
        <div className="mt-2">
          <Badge variant="secondary" className={`text-xs ${getEfficiencyColor()} text-white`}>
            {appliance.efficiency}% Efficient
          </Badge>
        </div>
      )}
      
      {appliance.isOn && (
        <div className="mt-2 text-xs text-energy-primary font-medium flex items-center gap-1">
          <div className="w-2 h-2 bg-energy-success rounded-full animate-pulse"></div>
          ACTIVE
        </div>
      )}
    </Card>
  );
};