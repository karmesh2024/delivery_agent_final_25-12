// تعريفات لمكتبة Leaflet Draw
import L from 'leaflet';

declare module 'leaflet-draw' {
  namespace L {
    namespace Draw {
      interface DrawOptions {
        polyline?: {
          shapeOptions?: L.PolylineOptions;
          metric?: boolean;
          feet?: boolean;
          showLength?: boolean;
          repeatMode?: boolean;
        };
        polygon?: {
          allowIntersection?: boolean;
          showArea?: boolean;
          showLength?: boolean;
          shapeOptions?: L.PolylineOptions;
          metric?: boolean;
          feet?: boolean;
          repeatMode?: boolean;
        };
        rectangle?: {
          shapeOptions?: L.PolylineOptions;
          metric?: boolean;
          feet?: boolean;
          repeatMode?: boolean;
        };
        circle?: {
          shapeOptions?: L.PathOptions;
          metric?: boolean;
          feet?: boolean;
          repeatMode?: boolean;
        };
        circlemarker?: boolean;
        marker?: {
          icon?: L.Icon;
          repeatMode?: boolean;
        };
      }

      interface EditOptions {
        featureGroup: L.FeatureGroup;
        edit?: {
          selectedPathOptions?: L.PathOptions;
        };
        remove?: boolean;
      }

      interface DrawControlOptions {
        position?: L.ControlPosition;
        draw?: DrawOptions | boolean;
        edit?: EditOptions | boolean;
      }
    }

    namespace control {
      class Draw extends L.Control {
        constructor(options?: Draw.DrawControlOptions);
      }
    }

    class DrawToolbar {}
    class EditToolbar {}
  }

  namespace Control {
    export class Draw extends L.Control {
      constructor(options?: L.Draw.DrawControlOptions);
    }
  }
}

declare module 'react-leaflet-draw' {
  import { LeafletEventHandlerFnMap } from 'leaflet';
  import { ReactNode } from 'react';

  export interface EditControlProps {
    position?: string;
    draw?: {
      polyline?: boolean | Record<string, unknown>;
      polygon?: boolean | Record<string, unknown>;
      rectangle?: boolean | Record<string, unknown>;
      circle?: boolean | Record<string, unknown>;
      marker?: boolean | Record<string, unknown>;
      circlemarker?: boolean | Record<string, unknown>;
    };
    edit?: {
      edit?: boolean;
      remove?: boolean;
      featureGroup?: any;
    };
    onCreated?: (e: any) => void;
    onEdited?: (e: any) => void;
    onDeleted?: (e: any) => void;
    children?: ReactNode;
  }

  export class EditControl extends React.Component<EditControlProps, any> {}
}

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
      setDrawingOptions(options: any): void;
    }
  }

  namespace DrawOptions {
    interface PolylineOptions {
      shapeOptions?: L.PathOptions;
      [key: string]: any;
    }

    interface PolygonOptions {
      allowIntersection?: boolean;
      drawError?: {
        color?: string;
        message?: string;
      };
      shapeOptions?: L.PathOptions;
      [key: string]: any;
    }

    interface RectangleOptions {
      shapeOptions?: L.PathOptions;
      [key: string]: any;
    }

    interface CircleOptions {
      shapeOptions?: L.PathOptions;
      [key: string]: any;
    }

    interface MarkerOptions {
      icon?: L.Icon;
      zIndexOffset?: number;
      [key: string]: any;
    }

    interface CircleMarkerOptions {
      [key: string]: any;
    }
  }

  namespace EditOptions {
    interface EditHandlerOptions {
      selectedPathOptions?: L.PathOptions;
    }

    interface DeleteHandlerOptions {
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
    addControl(control: Control): this;
    on(
      type: 'draw:created',
      fn: (event: { layer: Layer; layerType: string }) => void,
      context?: any
    ): this;
    on(
      type: 'draw:edited' | 'draw:deleted',
      fn: (event: { layers: LayerGroup }) => void,
      context?: any
    ): this;
    on(
      type: string,
      fn: (event: any) => void,
      context?: any
    ): this;
  }
  
  interface Control {
    addTo(map: Map): this;
    remove(): this;
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