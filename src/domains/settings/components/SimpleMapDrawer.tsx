"use client";

import { useEffect, useRef, useCallback, useState, memo, useMemo } from "react";
import { MapContainer, TileLayer, FeatureGroup, useMap, useMapEvents } from 'react-leaflet';
// Import Leaflet
import L from 'leaflet';
// No type imports - we'll define our own
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw'; // Import leaflet-draw JS
import dynamic from 'next/dynamic';

// --- Icon Fix --- dynamically import images
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Check if running in a browser environment before modifying L.Icon.Default
if (typeof window !== 'undefined') {
    // @ts-expect-error Property '_getIconUrl' does not exist on type 'Default', but it's used in Leaflet internals
    delete L.Icon.Default.prototype._getIconUrl;

    // @ts-expect-error Property 'Icon' is actually available in runtime even if TypeScript doesn't see it
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIcon2x.src,
        iconUrl: markerIcon.src,
        shadowUrl: markerShadow.src,
    });
}
// --- End Icon Fix ---

// Define types
type Coordinate = [number, number]; // [lng, lat]

interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: Coordinate[][];
}

interface GeoJSONPoint {
  type: "Point";
  coordinates: Coordinate;
}

// Use a specific type instead of 'any'
interface AreaData {
  area_polygon: GeoJSONPolygon;
  center_point: GeoJSONPoint;
  bounds: number[]; // An array of numbers for bbox coordinates
}

interface SimpleMapDrawerProps {
  onAreaDefined: (areaData: AreaData) => void;
  initialPolygon?: Coordinate[]; // lng, lat pairs
  initialCenter?: Coordinate; // lng, lat
  initialZoom?: number;
}

// --- Helper Function to Convert Coordinates ---
// Define our own LatLngExpression type if needed
type LeafletLatLng = {lng: number, lat: number};
type LeafletLatLngExpression = [number, number] | {lng: number, lat: number};

const geoJsonCoordsToLeaflet = (coords: Coordinate[]): LeafletLatLngExpression[] => {
  return coords.map(([lng, lat]) => [lat, lng]);
};

const leafletLatLngsToGeoJson = (latLngs: LeafletLatLng[]): Coordinate[] => {
  return latLngs.map(latLng => [latLng.lng, latLng.lat]);
};
// --- End Helper Function ---

// Define minimal interfaces for Leaflet types we need
interface LeafletLayer {
  toGeoJSON: () => { geometry?: { type: string; coordinates: unknown[] } };
  getBounds: () => LeafletBounds;
  getCenter: () => LeafletLatLng;
  getLatLngs: () => LeafletLatLng[][];
}

interface LeafletBounds {
  isValid: () => boolean;
  toBBoxString: () => string;
}

interface LeafletDrawEvent {
  layer: LeafletLayer;
  layerType: string;
}

interface LeafletDrawEditedEvent {
  layers: {
    eachLayer: (callback: (layer: LeafletLayer) => void) => void;
  };
}

// Define DrawControl interface
interface DrawControl {
  options: Record<string, unknown>;
}

interface LeafletControl {
  options?: Record<string, unknown>;
}

interface LeafletFeatureGroup {
  clearLayers: () => void;
  addLayer: (layer: LeafletLayer) => void;
}

// Define our own Map interface
interface LeafletMap {
  addControl: (control: LeafletControl | DrawControl) => void;
  removeControl: (control: LeafletControl | DrawControl) => void;
  on: <T>(event: string, handler: (e: T) => void) => void;
  off: <T>(event: string, handler: (e: T) => void) => void;
  flyToBounds: (bounds: LeafletBounds, options?: { padding?: [number, number] }) => void;
  invalidateSize: () => void;
}

// Type for Leaflet's Control namespace and Draw control
interface LeafletControlNamespace {
  Draw: new (options: DrawControlOptions) => DrawControl;
}

// Type for draw control options
interface DrawOptions {
  polygon?: Record<string, unknown>;
  rectangle?: Record<string, unknown>;
  polyline?: boolean;
  circle?: boolean;
  marker?: boolean;
  circlemarker?: boolean;
}

interface DrawControlOptions {
  position: string;
  draw: {
    polygon?: {
      allowIntersection: boolean;
      shapeOptions: {
        color: string;
        weight: number;
        opacity: number;
        fillOpacity: number;
      };
      drawError: {
        color: string;
        message: string;
      };
    };
    rectangle?: {
      shapeOptions: {
        color: string;
        weight: number;
        opacity: number;
        fillOpacity: number;
      };
    };
    polyline: boolean;
    circle: boolean;
    marker: boolean;
    circlemarker: boolean;
  };
  edit: {
    featureGroup: LeafletFeatureGroup;
    remove: boolean;
    edit: {
      selectedPathOptions: {
        color: string;
        opacity: number;
        dashArray: string;
        fillOpacity: number;
      };
    };
  };
}

// Define a type for Leaflet's polygon function
interface LeafletPolygonStatic {
  polygon: (latLngs: LeafletLatLngExpression[], options?: Record<string, unknown>) => LeafletLayer;
}

interface MapDrawerLogicProps {
  onAreaDefined: (areaData: AreaData) => void;
  initialPolygon?: Coordinate[]; // lng, lat pairs
  stableKey: string; // A stable key to prevent recreation
}

// --- Internal Component to handle Map Logic ---
const MapDrawerLogic: React.FC<MapDrawerLogicProps> = memo(({
  onAreaDefined,
  initialPolygon,
  stableKey
}) => {
  // Cast to our custom LeafletMap interface
  const map = useMap() as unknown as LeafletMap;
  // Use the reference with our defined types
  const featureGroupRef = useRef<LeafletFeatureGroup | null>(null);
  const [isInitialLayerAdded, setIsInitialLayerAdded] = useState(false);
  const onAreaDefinedRef = useRef(onAreaDefined);
  // Add reference to track if we've already processed a drawn area
  const drawnAreaRef = useRef<boolean>(false);
  // Add reference to track if we've handled the initial polygon
  const initialPolygonHandledRef = useRef<boolean>(false);

  useEffect(() => {
    onAreaDefinedRef.current = onAreaDefined;
  }, [onAreaDefined]);

  const handleDrawEvent = useCallback((layer: LeafletLayer) => {
    // Check if layer is Polygon or Rectangle - check for needed methods
    if (!layer.getLatLngs || !layer.getBounds) {
      console.warn("Unsupported layer type drawn:", layer);
      return;
    }

    const featureGroup = featureGroupRef.current;
    if (!featureGroup) return;

    featureGroup.clearLayers();
    // Cast the layer to the proper type
    featureGroup.addLayer(layer);

    try {
      // Process the layer
      const pathLayer = layer;
      const geoJson = pathLayer.toGeoJSON();

      if (geoJson.geometry && geoJson.geometry.type === 'Polygon') {
        const bounds = pathLayer.getBounds();
        const center = pathLayer.getCenter();
        const latLngs = pathLayer.getLatLngs()[0];

        // Fly to the bounds of the newly drawn polygon
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { padding: [50, 50] });
          console.log("Flying to newly drawn polygon bounds", bounds.toBBoxString());
        }

        const areaData: AreaData = {
          area_polygon: {
            type: "Polygon",
            coordinates: [leafletLatLngsToGeoJson(latLngs)]
          },
          center_point: {
            type: "Point",
            coordinates: [center.lng, center.lat]
          },
          bounds: bounds.toBBoxString().split(',').map(Number)
        };
        
        // Set drawn area flag to true
        drawnAreaRef.current = true;
        
        onAreaDefinedRef.current(areaData);
        console.log("Area defined/updated:", areaData);
      }
    } catch (error) {
      console.error("Error processing drawn shape:", error);
    }
  }, [map]);

  // Effect to add initial polygon - separated to avoid dependency issues
  useEffect(() => {
    if (!map || !featureGroupRef.current) return;
    
    // If we've already handled this, exit early to prevent loops
    if (initialPolygonHandledRef.current) return;
    
    // Only add the initial polygon if it exists and has at least 3 points (valid polygon)
    if (initialPolygon && initialPolygon.length >= 3 && !drawnAreaRef.current) {
        try {
            // Mark as handled first, before any async operations
            initialPolygonHandledRef.current = true;
            
            const latLngs = geoJsonCoordsToLeaflet(initialPolygon);
            // Use proper type casting instead of 'any'
            const LWithPolygon = L as unknown as LeafletPolygonStatic;
            const polygon = LWithPolygon.polygon(latLngs, {
                 color: '#3388ff',
                 weight: 3,
                 opacity: 0.8,
                 fillOpacity: 0.3
            });
            
            const drawnItems = featureGroupRef.current;
            drawnItems.addLayer(polygon);
            const bounds = polygon.getBounds();
            
            // Only fly to bounds if they are valid
            if (bounds.isValid()) {
                map.flyToBounds(bounds, { padding: [50, 50] });
                console.log("Flying to initial polygon bounds", bounds.toBBoxString());
            }
            
            console.log("Initial polygon added and map adjusted.");

            const center = polygon.getCenter();
            const initialBounds = polygon.getBounds();
            const initialLatLngs = polygon.getLatLngs()[0];
            
            try {
              const initialAreaData: AreaData = {
                area_polygon: {
                  type: "Polygon",
                  coordinates: [leafletLatLngsToGeoJson(initialLatLngs)]
                },
                center_point: {
                  type: "Point",
                  coordinates: [center.lng, center.lat]
                },
                bounds: initialBounds.toBBoxString().split(',').map(Number)
              };
              
              onAreaDefinedRef.current(initialAreaData);
            } catch (error) {
              console.error("Error creating area data:", error);
            }
            
            setIsInitialLayerAdded(true);
        } catch (error) {
            console.error("Error adding initial polygon:", error);
        }
    }
  }, [map, initialPolygon]); // Removed isInitialLayerAdded to avoid re-running

  // Effect to add draw controls after initial polygon is handled
  useEffect(() => {
    if (!map || !featureGroupRef.current) return;

    const drawnItems = featureGroupRef.current;

    // Define draw control options with proper typing
    const drawControlOptions: DrawControlOptions = {
         position: 'topright',
         draw: {
             polygon: {
                 allowIntersection: false,
                 shapeOptions: { color: '#3388ff', weight: 3, opacity: 0.8, fillOpacity: 0.3 },
                 drawError: { color: '#e1e100', message: 'Polygon edges cannot intersect!' }
             },
             rectangle: {
                 shapeOptions: { color: '#3388ff', weight: 3, opacity: 0.8, fillOpacity: 0.3 }
             },
             polyline: false,
             circle: false,
             marker: false,
             circlemarker: false,
         },
         edit: {
             featureGroup: drawnItems,
             remove: true,
             edit: {
                 selectedPathOptions: {
                     color: '#fe57a1',
                     opacity: 0.6,
                     dashArray: '10, 10',
                     fillOpacity: 0.1
                 }
             }
         },
     };

    // Cast the Draw control with a proper type
    const LControl = L.Control as unknown as LeafletControlNamespace;
    const drawControl = new LControl.Draw(drawControlOptions);

    map.addControl(drawControl);

     const handleDrawCreated = (e: LeafletDrawEvent) => {
         handleDrawEvent(e.layer);
     };

     const handleDrawEdited = (e: LeafletDrawEditedEvent) => {
         e.layers.eachLayer((layer: LeafletLayer) => {
             // Just call handleDrawEvent directly since we check capabilities inside
             handleDrawEvent(layer);
         });
     };

     const handleDrawDeleted = () => {
         console.log("Layer deleted");
         drawnAreaRef.current = false;
         onAreaDefinedRef.current({
             area_polygon: { type: "Polygon", coordinates: [[]] },
             center_point: { type: "Point", coordinates: [0, 0] },
             bounds: [0, 0, 0, 0]
         });
     };

    const drawCreatedEvent = 'draw:created';
    const drawEditedEvent = 'draw:edited';
    const drawDeletedEvent = 'draw:deleted';

    map.on(drawCreatedEvent, handleDrawCreated);
    map.on(drawEditedEvent, handleDrawEdited);
    map.on(drawDeletedEvent, handleDrawDeleted);

    return () => {
        console.log("Cleaning up Draw Controls and Events");
        if (map) {
            map.off(drawCreatedEvent, handleDrawCreated);
            map.off(drawEditedEvent, handleDrawEdited);
            map.off(drawDeletedEvent, handleDrawDeleted);

            if (drawControl) {
                 try {
                     map.removeControl(drawControl);
                 } catch (error) {
                     console.warn("Could not remove draw control:", error);
                 }
             }
        }
    };
  }, [map, handleDrawEvent]); // Removed dependencies that cause re-runs

   useMapEvents({
     load() {
         console.log("Map loaded via useMapEvents");
         setTimeout(() => map.invalidateSize(), 100);
     }
   });

  return (
    <FeatureGroup ref={featureGroupRef} />
  );
});

// Set a display name for the memoized component
MapDrawerLogic.displayName = 'MapDrawerLogic';

// --- Map Container Wrapper Component ---
const MapElementsWrapper = memo(({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
    </>
  );
});

MapElementsWrapper.displayName = 'MapElementsWrapper';

// --- Main Exported Component ---
export function SimpleMapDrawer(props: SimpleMapDrawerProps) {
  const {
    initialCenter = [31.2001, 29.9187], // Default Alexandria [lng, lat]
    initialZoom = 14, // Increased zoom level for better visibility
    onAreaDefined,
    initialPolygon,
  } = props;

  // Center needs [lat, lng]
  const centerLatLng = useMemo(() => {
    return [initialCenter[1], initialCenter[0]] as LeafletLatLngExpression;
  }, [initialCenter]);

  // Use useMemo for tile layer props
  const tileLayerProps = useMemo(() => ({
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    maxZoom: 19
  }), []);

  // Generate a stable key for components
  const stableKey = useMemo(() => `map-drawer-logic-${Math.random().toString(36).substring(2, 9)}`, []);
  const mapContainerKey = useMemo(() => `map-container-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, []);

  // Props for MapContainer, excluding 'key' which is handled directly
  const mapContainerDisplayProps = useMemo(() => ({
    center: centerLatLng,
    zoom: initialZoom,
    scrollWheelZoom: true,
    style: { height: '100%', width: '100%' },
    className: "simple-map-drawer-container",
  }), [centerLatLng, initialZoom]);

  return (
    <div className="w-full h-full relative overflow-hidden border rounded-md map-container-wrapper">
      <MapContainer key={mapContainerKey} {...mapContainerDisplayProps}>
        <MapElementsWrapper>
          <TileLayer key="tile-layer" {...tileLayerProps} />
          <MapDrawerLogic 
            key={stableKey}
            onAreaDefined={onAreaDefined}
            initialPolygon={initialPolygon}
            stableKey={stableKey}
          />
        </MapElementsWrapper>
      </MapContainer>
    </div>
  );
}

// Note: Memoizing components and using stable keys to prevent re-renders
// Using try-catch blocks to handle errors more gracefully and prevent React from crashing 