// تعريف أكثر تفصيلاً لمكتبة Leaflet العالمية
import * as L from 'leaflet';

// تعريف لمكتبة Leaflet Draw لتجنب أخطاء الاستيراد
declare module 'leaflet-draw';
declare module 'react-leaflet-draw';

interface LeafletDrawHandlers {
  rectangle?: boolean;
  polygon?: boolean;
  circle?: boolean;
  circlemarker?: boolean;
  marker?: boolean;
  polyline?: boolean;
}

interface LeafletDrawEditHandlers {
  featureGroup: L.FeatureGroup;
  remove?: boolean;
  edit?: boolean;
}

interface LeafletDrawControlOptions {
  position?: string;
  draw?: LeafletDrawHandlers;
  edit?: LeafletDrawEditHandlers;
}

interface LeafletDrawControl {
  new (options: LeafletDrawControlOptions): L.Control;
}

interface LeafletMap extends L.Map {
  remove: () => void;
  off: () => void;
  invalidateSize: (options?: { animate?: boolean }) => void;
  setView: (center: [number, number], zoom: number) => LeafletMap;
  getContainer: () => HTMLElement;
  addControl: (control: L.Control) => LeafletMap;
  [key: string]: unknown;
}

interface LeafletIconDefault {
  mergeOptions: (options: {
    iconRetinaUrl: string;
    iconUrl: string;
    shadowUrl: string;
  }) => void;
  prototype: {
    _getIconUrl?: unknown;
    [key: string]: unknown;
  };
}

interface LeafletGeoJSON extends L.GeoJSON {
  addData: (data: GeoJSON.GeoJSON) => LeafletGeoJSON;
}

interface LeafletControl {
  Draw: any; // تعريف بسيط لأدوات الرسم
}

// امتداد للموجود في @types/leaflet
interface LeafletStatic {
  maps: Record<string, LeafletMap>;
  Map: new (element: string | HTMLElement, options?: L.MapOptions) => LeafletMap;
  Control: L.Control & {
    Draw: LeafletDrawControl;
  };
  Icon: {
    Default: LeafletIconDefault;
  };
  geoJSON: (data: GeoJSON.GeoJSON, options?: L.GeoJSONOptions) => LeafletGeoJSON;
  FeatureGroup: new () => L.FeatureGroup;
  [key: string]: unknown;
}

declare global {
  interface Window {
    L: LeafletStatic;
  }
} 