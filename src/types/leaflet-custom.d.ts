declare module 'leaflet' {
  export interface Map {
    addControl(control: any): this;
    on(type: string, fn: (event: any) => void, context?: any): this;
    remove(): void;
  }
  
  export namespace drawLocal {
    interface DrawToolbar {
      actions: {
        title: string;
        text: string;
      };
      finish: {
        title: string;
        text: string;
      };
      undo: {
        title: string;
        text: string;
      };
      buttons: {
        polyline: string;
        polygon: string;
        rectangle: string;
        circle: string;
        marker: string;
        circlemarker: string;
      };
    }

    interface Draw {
      toolbar: DrawToolbar;
    }
  }

  export let drawLocal: {
    draw: drawLocal.Draw;
  };
}

// تعريف واجهات إضافية للنافذة
interface Window {
  L: any;
}

// تعريف النوع للمكتبة
declare module 'leaflet-draw' {
  // فارغ للسماح بالاستيراد فقط
}

// تعريف النوع لـ GeoJSON
interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: any;
  };
  properties?: any;
}

// تعريف النوع للأحداث
interface DrawEvent {
  layer: {
    toGeoJSON: () => GeoJSONFeature;
  };
  layerType: string;
  layers?: {
    eachLayer: (callback: (layer: any) => void) => void;
  };
} 