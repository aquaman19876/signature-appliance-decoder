import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PowerSignature, DisaggregationResult } from '@/types/appliance';
import { Activity, Zap, TrendingUp } from 'lucide-react';

interface WaveformChartProps {
  title: string;
  data: PowerSignature[];
  showIndividual?: boolean;
  appliances?: any[];
  disaggregationResults?: DisaggregationResult[];
  height?: number;
}

export const WaveformChart = ({ 
  title, 
  data, 
  showIndividual = false, 
  appliances = [],
  disaggregationResults = [],
  height = 300 
}: WaveformChartProps) => {
  
  const formatTooltip = (value: any, name: string) => {
    if (name.includes('power')) return [`${value.toFixed(2)} W`, name];
    if (name.includes('voltage')) return [`${value.toFixed(1)} V`, name];
    if (name.includes('current')) return [`${value.toFixed(3)} A`, name];
    return [value, name];
  };

  const getLineColor = (index: number) => {
    const colors = ['hsl(var(--wave-primary))', 'hsl(var(--wave-secondary))', 'hsl(var(--wave-tertiary))', 'hsl(var(--wave-quaternary))'];
    return colors[index % colors.length];
  };

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
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          
          <Line
            type="monotone"
            dataKey="power"
            stroke="hsl(var(--wave-primary))"
            strokeWidth={2}
            dot={false}
            name="Power (W)"
          />
          
          {showIndividual && appliances.filter(a => a.isOn).map((appliance, index) => (
            <Line
              key={appliance.id}
              type="monotone"
              dataKey={`${appliance.id}_power`}
              stroke={getLineColor(index + 1)}
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              name={`${appliance.name} (W)`}
            />
          ))}
          
          {renderAnnotations()}
        </LineChart>
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