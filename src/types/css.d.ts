// تعريف لملفات CSS
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// تعريف لمكتبات Leaflet
declare module 'leaflet/dist/leaflet.css';
declare module 'leaflet-draw/dist/leaflet.draw.css';
declare module 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
declare module 'leaflet-defaulticon-compatibility'; 