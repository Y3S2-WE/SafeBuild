import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Search, MapPin, Loader2, Navigation, X } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
mapboxgl.accessToken = MAPBOX_TOKEN;

// Default center: Sri Lanka
const DEFAULT_CENTER = [80.7718, 7.8731];
const DEFAULT_ZOOM = 7;

export default function MapPicker({ value, onChange, error }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const searchTimeout = useRef(null);
  const resultsRef = useRef(null);

  // ── Initialize map ───────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: value?.longitude && value?.latitude
        ? [value.longitude, value.latitude]
        : DEFAULT_CENTER,
      zoom: value?.longitude ? 14 : DEFAULT_ZOOM,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

    // If there's already a value, place a marker
    if (value?.longitude && value?.latitude) {
      const marker = new mapboxgl.Marker({
        color: '#3b82f6',
        draggable: true,
      })
        .setLngLat([value.longitude, value.latitude])
        .addTo(map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        reverseGeocode(lngLat.lng, lngLat.lat);
      });

      markerRef.current = marker;
    }

    // Click to place marker
    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      placeMarker(lng, lat, map);
      reverseGeocode(lng, lat);
    });

    map.on('load', () => setMapLoaded(true));

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Place / move marker ──────────────────────────────────────────────────
  const placeMarker = useCallback((lng, lat, map) => {
    const targetMap = map || mapRef.current;
    if (!targetMap) return;

    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    } else {
      const marker = new mapboxgl.Marker({
        color: '#3b82f6',
        draggable: true,
      })
        .setLngLat([lng, lat])
        .addTo(targetMap);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        reverseGeocode(lngLat.lng, lngLat.lat);
      });

      markerRef.current = marker;
    }
  }, []);

  // ── Reverse geocode ──────────────────────────────────────────────────────
  const reverseGeocode = useCallback(async (lng, lat) => {
    setReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address,poi,place,locality,neighborhood`
      );
      const data = await res.json();
      const placeName = data.features?.[0]?.place_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

      onChange({
        address: placeName,
        latitude: lat,
        longitude: lng,
      });
    } catch {
      onChange({
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        latitude: lat,
        longitude: lng,
      });
    } finally {
      setReverseGeocoding(false);
    }
  }, [onChange]);

  // ── Forward geocode search ───────────────────────────────────────────────
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5&country=lk`
      );
      const data = await res.json();
      setSearchResults(data.features || []);
      setShowResults(true);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const onSearchInput = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => handleSearch(q), 400);
  };

  const selectResult = (feature) => {
    const [lng, lat] = feature.center;
    const map = mapRef.current;
    if (map) {
      map.flyTo({ center: [lng, lat], zoom: 15, duration: 1200 });
      placeMarker(lng, lat, map);
    }

    onChange({
      address: feature.place_name,
      latitude: lat,
      longitude: lng,
    });

    setSearchQuery(feature.place_name);
    setShowResults(false);
  };

  // ── Locate me ────────────────────────────────────────────────────────────
  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude: lng, latitude: lat } = pos.coords;
        const map = mapRef.current;
        if (map) {
          map.flyTo({ center: [lng, lat], zoom: 15, duration: 1200 });
          placeMarker(lng, lat, map);
        }
        reverseGeocode(lng, lat);
      },
      () => {},
      { enableHighAccuracy: true }
    );
  };

  // Close results on outside click
  useEffect(() => {
    const handler = (e) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="space-y-3">
      {/* Search bar + locate me */}
      <div className="relative" ref={resultsRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={onSearchInput}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder="Search for a location…"
              className={`w-full pl-10 pr-9 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-colors ${
                error ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50 focus:bg-white'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSearchResults([]); setShowResults(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={14} />
              </button>
            )}
            {searching && (
              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-500 animate-spin" />
            )}
          </div>
          <button
            type="button"
            onClick={handleLocateMe}
            title="Use my current location"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-brand-600 hover:border-brand-300 text-sm font-medium transition-colors flex-shrink-0"
          >
            <Navigation size={15} />
            <span className="hidden sm:inline">Locate me</span>
          </button>
        </div>

        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-20 mt-1.5 w-full bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
            {searchResults.map((feature) => (
              <button
                key={feature.id}
                type="button"
                onClick={() => selectResult(feature)}
                className="w-full text-left px-4 py-3 hover:bg-brand-50 transition-colors border-b border-slate-50 last:border-0 flex items-start gap-3"
              >
                <MapPin size={14} className="text-brand-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{feature.text}</p>
                  <p className="text-xs text-slate-500 truncate">{feature.place_name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map container */}
      <div className={`relative rounded-xl overflow-hidden border-2 transition-colors ${
        error ? 'border-rose-400' : value?.latitude ? 'border-brand-400' : 'border-slate-200'
      }`}>
        <div
          ref={mapContainer}
          className="w-full"
          style={{ height: 320 }}
        />

        {/* Loading overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin text-brand-500" />
            <span className="text-sm text-slate-500">Loading map…</span>
          </div>
        )}

        {/* Reverse geocoding indicator */}
        {reverseGeocoding && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm border border-slate-200">
            <Loader2 size={12} className="animate-spin text-brand-500" />
            <span className="text-xs text-slate-600 font-medium">Getting address…</span>
          </div>
        )}

        {/* Instruction overlay (when no marker placed yet) */}
        {mapLoaded && !value?.latitude && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-ink-900/80 backdrop-blur-sm text-white rounded-lg px-4 py-2 shadow-lg flex items-center gap-2 pointer-events-none">
            <MapPin size={14} className="text-brand-300" />
            <span className="text-xs font-medium">Click on the map to select a location</span>
          </div>
        )}
      </div>

      {/* Selected location display */}
      {value?.address && (
        <div className="flex items-start gap-2.5 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
          <MapPin size={15} className="text-brand-600 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-brand-800 leading-snug">{value.address}</p>
            {value.latitude && value.longitude && (
              <p className="text-xs text-brand-500 mt-0.5 font-mono">
                {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
