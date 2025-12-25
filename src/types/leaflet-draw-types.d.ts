declare module 'leaflet-draw' {
  import * as L from 'leaflet';

  namespace Draw {
    class Event {
      static readonly CREATED: 'draw:created';
      static readonly EDITED: 'draw:edited';
      static readonly DELETED: 'draw:deleted';
      static readonly DRAWSTART: 'draw:drawstart';
      static readonly DRAWSTOP: 'draw:drawstop';
      static readonly DRAWVERTEX: 'draw:drawvertex';
      static readonly EDITSTART: 'draw:editstart';
      static readonly EDITMOVE: 'draw:editmove';
      static readonly EDITRESIZE: 'draw:editresize';
      static readonly EDITVERTEX: 'draw:editvertex';
      static readonly EDITSTOP: 'draw:editstop';
      static readonly DELETESTART: 'draw:deletestart';
      static readonly DELETESTOP: 'draw:deletestop';
    }
    
    interface IDrawControlOptions {
      position?: L.ControlPosition;
      draw?: {
        polyline?: boolean | L.DrawOptions.PolylineOptions;
        polygon?: boolean | L.DrawOptions.PolygonOptions;
        rectangle?: boolean | L.DrawOptions.RectangleOptions;
        circle?: boolean | L.DrawOptions.CircleOptions;
        marker?: boolean | L.DrawOptions.MarkerOptions;
        circlemarker?: boolean | L.DrawOptions.CircleMarkerOptions;
      };
      edit?: {
        featureGroup: L.FeatureGroup;
        remove?: boolean;
        edit?: boolean;
      };
    }
    
    class Control extends L.Control {
      constructor(options?: IDrawControlOptions);
      setDrawingOptions(options: Record<string, unknown>): void;
    }
  }

  namespace DrawOptions {
    interface PolylineOptions {
      shapeOptions?: L.PathOptions;
      [key: string]: unknown;
    }

    interface PolygonOptions {
      allowIntersection?: boolean;
      drawError?: {
        color?: string;
        message?: string;
      };
      shapeOptions?: L.PathOptions;
      [key: string]: unknown;
    }

    interface RectangleOptions {
      shapeOptions?: L.PathOptions;
      [key: string]: unknown;
    }

    interface CircleOptions {
      shapeOptions?: L.PathOptions;
      [key: string]: unknown;
    }

    interface MarkerOptions {
      icon?: L.Icon;
      zIndexOffset?: number;
      [key: string]: unknown;
    }

    interface CircleMarkerOptions {
      [key: string]: unknown;
    }
  }

  namespace DrawEvents {
    interface Created {
      layer: L.Layer;
      layerType: string;
    }

    interface Edited {
      layers: L.LayerGroup;
    }

    interface Deleted {
      layers: L.LayerGroup;
    }
  }

  // العناصر المصدرة
  export namespace Control {
    class Draw extends L.Draw.Control { }
  }
}

// تمديد التعريفات الأساسية للخريطة
declare module 'leaflet' {
  interface Map {
    on(
      type: 'draw:created',
      fn: (event: { layer: Layer; layerType: string }) => void,
      context?: unknown
    ): this;
    on(
      type: 'draw:edited' | 'draw:deleted',
      fn: (event: { layers: LayerGroup }) => void,
      context?: unknown
    ): this;
    on(
      type: string,
      fn: (event: unknown) => void,
      context?: unknown
    ): this;
  }
  
  namespace drawLocal {
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

  let drawLocal: {
    draw: drawLocal.Draw;
  };
} 