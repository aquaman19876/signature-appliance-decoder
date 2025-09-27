import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActivityEvent } from '@/types/appliance';
import { Clock, Power, Play, Pause, RotateCcw, Zap } from 'lucide-react';

interface EventLogProps {
  events: ActivityEvent[];
  maxEvents?: number;
}

export const EventLog = ({ events, maxEvents = 10 }: EventLogProps) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'appliance_toggle':
        return <Power className="w-3 h-3" />;
      case 'simulation_start':
        return <Play className="w-3 h-3" />;
      case 'simulation_pause':
        return <Pause className="w-3 h-3" />;
      case 'simulation_reset':
        return <RotateCcw className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getEventBadgeVariant = (type: string, isOn?: boolean) => {
    switch (type) {
      case 'appliance_toggle':
        return isOn ? 'default' : 'secondary';
      case 'simulation_start':
        return 'default';
      case 'simulation_pause':
        return 'secondary';
      case 'simulation_reset':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const recentEvents = events.slice(-maxEvents).reverse();

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-energy-primary" />
        <h3 className="font-semibold">Activity Log</h3>
        <Badge variant="outline" className="ml-auto">
          {events.length} events
        </Badge>
      </div>
      
      <ScrollArea className="h-64">
        {recentEvents.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground text-sm">
              No activity yet. Start simulation and toggle appliances to see events.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentEvents.map((event, index) => (
              <div 
                key={event.id} 
                className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${
                  index === 0 ? 'bg-energy-primary/5 border border-energy-primary/20' : 'hover:bg-muted/50'
                }`}
              >
                <Badge 
                  variant={getEventBadgeVariant(event.type, event.isOn)}
                  className="flex items-center gap-1 min-w-fit"
                >
                  {getEventIcon(event.type)}
                  <span className="text-xs font-medium">
                    {formatTime(event.timestamp)}
                  </span>
                </Badge>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {event.message}
                  </p>
                  {event.powerRating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Zap className="w-2 h-2 text-energy-warning" />
                      <span className="text-xs text-muted-foreground">
                        {event.powerRating}W
                      </span>
                    </div>
                  )}
                </div>
                
                {event.type === 'appliance_toggle' && (
                  <div className={`w-2 h-2 rounded-full ${
                    event.isOn ? 'bg-energy-success' : 'bg-muted-foreground'
                  }`} />
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};