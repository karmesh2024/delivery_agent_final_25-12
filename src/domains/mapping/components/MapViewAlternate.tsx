"use client";

import React from 'react';
import { Agent } from '@/types';
import { Card } from '@/shared/ui/card';
import { LeafletMapComponent } from './LeafletMapComponent';
import { DeliveryLocation } from '../types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GeographicZone } from '@/domains/settings/types/index';

interface MapViewAlternateProps {
  agents: Agent[];
  locations?: DeliveryLocation[];
  className?: string;
  onLocationClick?: (location: DeliveryLocation) => void;
  onAgentClick?: (agent: Agent) => void;
  lastRefreshed: string;
  refreshing: boolean;
  error: string | null;
  handleRefresh: () => void;
  selectedAgent?: Agent;
  handleAgentClick: (agent: Agent) => void;
  zones?: GeographicZone[];
  handleZoneClick?: (zoneId: string) => void;
}

// تعريف وظيفة تنسيق الوقت 
const formatTime = (timestamp: string | Date) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ar-EG');
};

export function MapViewAlternate({ 
  agents, 
  locations = [], 
  className = '',
  onLocationClick,
  onAgentClick,
  lastRefreshed,
  refreshing,
  error,
  handleRefresh,
  selectedAgent,
  handleAgentClick,
  zones,
  handleZoneClick
}: MapViewAlternateProps) {
  // Convert order locations to delivery locations if needed
  const deliveryLocations: DeliveryLocation[] = locations.length > 0 
    ? locations 
    : []; // You could add logic here to convert orders to locations if needed

  // Create a unique key that changes when dependencies change
  const mapKey = React.useMemo(() => 
    `map-view-${Math.random().toString(36).substring(2, 9)}-${agents.length}-${deliveryLocations.length}-${Date.now()}`,
    [agents.length, deliveryLocations.length]
  );

  return (
    <Card className={`relative overflow-hidden shadow-xl rounded-lg ${className}`}>
      <div className="absolute top-2 left-2 right-2 z-20 bg-white/80 dark:bg-slate-800/80 rounded-md p-2 flex justify-between items-center shadow-md">
        <div className="text-sm flex items-center">
          <span className="mr-2">المندوبين:</span>
          <Badge className="bg-green-100 text-green-800 mr-1">
            متاح: {agents.filter(a => a.status === 'online').length}
          </Badge>
          <Badge className="bg-amber-100 text-amber-800 mr-1">
            مشغول: {agents.filter(a => a.status === 'busy').length}
          </Badge>
          <Badge className="bg-gray-100 text-gray-800">
            غير متصل: {agents.filter(a => a.status === 'offline').length}
          </Badge>
        </div>
        <div className="flex items-center" suppressHydrationWarning>
          <span className="text-xs text-gray-500 ml-2">
            آخر تحديث: {formatTime(lastRefreshed)}
          </span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="absolute top-14 left-2 right-2 z-20 bg-red-100 text-red-800 p-2 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {/* Use Leaflet Map Component */}
      <LeafletMapComponent
        key={mapKey}
        agents={agents}
        locations={deliveryLocations}
        geographicZones={zones}
        onAgentClick={handleAgentClick}
        onZoneClick={handleZoneClick}
        className="w-full h-full min-h-[600px]"
      />
      
      {/* Map attribution */}
      <div className="absolute bottom-2 right-2 text-xs text-slate-500 dark:text-slate-400 z-10 bg-white/70 px-1 rounded">
        OpenStreetMap
      </div>
    </Card>
  );
}