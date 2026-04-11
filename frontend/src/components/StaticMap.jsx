import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
mapboxgl.accessToken = MAPBOX_TOKEN;

/**
 * Read-only Mapbox map that displays a single marker.
 * Used in incident detail pages to show the incident location.
 */
export default function StaticMap({ latitude, longitude, address, height = 220 }) {
  const container = useRef(null);
  const mapRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!latitude || !longitude || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: 14,
      interactive: false,
      attributionControl: false,
    });

    new mapboxgl.Marker({ color: '#3b82f6' })
      .setLngLat([longitude, latitude])
      .addTo(map);

    map.on('load', () => setLoaded(true));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  if (!latitude || !longitude) return null;

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200">
      <div ref={container} style={{ height }} className="w-full" />
      {!loaded && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin text-brand-500" />
          <span className="text-xs text-slate-500">Loading map…</span>
        </div>
      )}
    </div>
  );
}
