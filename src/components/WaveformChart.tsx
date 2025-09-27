import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer, Area, AreaChart, ComposedChart } from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PowerSignature, DisaggregationResult, Appliance } from '@/types/appliance';
import { Activity, Zap, TrendingUp, Eye, EyeOff, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState } from 'react';

interface WaveformChartProps {
  title: string;
  data: PowerSignature[];
  showIndividual?: boolean;
  appliances?: Appliance[];
  disaggregationResults?: DisaggregationResult[];
  height?: number;
  showPredictions?: boolean;
  showActualStates?: boolean;
}

export const WaveformChart = ({ 
  title, 
  data, 
  showIndividual = false, 
  appliances = [],
  disaggregationResults = [],
  height = 300,
  showPredictions = false,
  showActualStates = false
}: WaveformChartProps) => {
  const [showActual, setShowActual] = useState(showActualStates);
  const [showPredicted, setShowPredicted] = useState(showPredictions);
  
  const formatTooltip = (value: any, name: string) => {
    if (name.includes('power')) return [`${value.toFixed(2)} W`, name];
    if (name.includes('voltage')) return [`${value.toFixed(1)} V`, name];
    if (name.includes('current')) return [`${value.toFixed(3)} A`, name];
    return [value, name];
  };

  const getLineColor = (index: number) => {
    const colors = [
      'hsl(var(--energy-primary))', 
      'hsl(var(--energy-secondary))', 
      'hsl(var(--energy-success))', 
      'hsl(var(--energy-warning))',
      'hsl(var(--energy-danger))',
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#10B981'  // Emerald
    ];
    return colors[index % colors.length];
  };

  const getApplianceColor = (applianceId: string) => {
    const index = appliances.findIndex(a => a.id === applianceId);
    return getLineColor(index);
  };

  // Generate enhanced data with color coding and predictions
  const enhancedData = data.map((point, index) => {
    const enhancedPoint: any = { ...point };
    
    if (showActual && appliances) {
      // Add actual appliance states as colored segments
      appliances.forEach(appliance => {
        if (appliance.isOn) {
          enhancedPoint[`${appliance.id}_actual`] = point.power;
        }
      });
    }
    
    if (showPredicted && disaggregationResults) {
      // Add prediction data based on disaggregation results
      disaggregationResults.forEach(result => {
        const isDetected = result.detectedPeriods.some(period => 
          point.time >= period.startTime && point.time <= period.endTime
        );
        if (isDetected) {
          enhancedPoint[`${result.appliance.id}_predicted`] = point.power;
        }
      });
    }
    
    return enhancedPoint;
  });

  const renderAnnotations = () => {
    return disaggregationResults.map((result, index) => (
      result.detectedPeriods.map((period, periodIndex) => (
        <ReferenceLine
          key={`${index}-${periodIndex}`}
          x={period.startTime}
          stroke={getLineColor(index)}
          strokeDasharray="5 5"
          label={{ 
            value: `${result.appliance.name} ON`, 
            position: 'top',
            style: { fontSize: '10px', fill: getLineColor(index) }
          }}
        />
      ))
    )).flat();
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-energy-primary" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="flex items-center gap-4">
          {/* Toggle Controls */}
          {(showActualStates || showPredictions) && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowActual(!showActual)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  showActual 
                    ? 'bg-energy-primary text-white' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Eye className="w-3 h-3" />
                Actual
              </button>
              <button
                onClick={() => setShowPredicted(!showPredicted)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  showPredicted 
                    ? 'bg-energy-secondary text-white' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <EyeOff className="w-3 h-3" />
                Predicted
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {data.length} samples
            </Badge>
            {data.length > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {Math.max(...data.map(d => d.power)).toFixed(1)}W peak
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={enhancedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="time" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `${(value / 1000).toFixed(1)}s`}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `${value.toFixed(0)}W`}
          />
          <Tooltip 
            formatter={formatTooltip}
            labelFormatter={(value) => `Time: ${(Number(value) / 1000).toFixed(2)}s`}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Legend fontSize={12} />
          
          {/* Main power line */}
          <Line
            type="monotone"
            dataKey="power"
            stroke="hsl(var(--foreground))"
            strokeWidth={3}
            dot={false}
            name="Total Power (W)"
          />
          
          {/* Actual appliance states - solid lines */}
          {showActual && appliances.filter(a => a.isOn).map((appliance) => (
            <Line
              key={`${appliance.id}_actual`}
              type="monotone"
              dataKey={`${appliance.id}_actual`}
              stroke={getApplianceColor(appliance.id)}
              strokeWidth={2}
              dot={false}
              name={`${appliance.name} (Actual)`}
            />
          ))}
          
          {/* Predicted appliance states - dashed lines */}
          {showPredicted && disaggregationResults.map((result) => (
            <Line
              key={`${result.appliance.id}_predicted`}
              type="monotone"
              dataKey={`${result.appliance.id}_predicted`}
              stroke={getApplianceColor(result.appliance.id)}
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={false}
              name={`${result.appliance.name} (Predicted)`}
            />
          ))}
          
          {renderAnnotations()}
        </ComposedChart>
      </ResponsiveContainer>
      
      {disaggregationResults.length > 0 && (
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Detected Appliances:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {disaggregationResults.map((result, index) => (
              <div key={result.appliance.id} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getLineColor(index) }}
                  ></div>
                  {result.appliance.name}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {result.confidence.toFixed(0)}% conf.
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};