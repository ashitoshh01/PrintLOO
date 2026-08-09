'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Crosshair, Loader2 } from 'lucide-react';

interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
  className?: string;
  compact?: boolean;
}

// Nominatim reverse geocode (free, no API key)
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (data.display_name) {
      const parts = data.display_name.split(',').slice(0, 4);
      return parts.join(',').trim();
    }
    return '';
  } catch {
    return '';
  }
}

export default function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
  className = '',
  compact = false,
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const leafletModuleRef = useRef<any>(null);
  const isInitializingRef = useRef(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );

  const createCustomIcon = (L: any) => {
    return L.divIcon({
      html: `<div style="
        background: #3b82f6;
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      "><div style="
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div></div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  };

  useEffect(() => {
    let isMounted = true;

    async function setupMap() {
      const container = mapContainerRef.current;
      if (!container || mapInstanceRef.current || isInitializingRef.current) return;

      isInitializingRef.current = true;

      try {
        const L = (await import('leaflet')).default;
        leafletModuleRef.current = L;

        if (!isMounted || !mapContainerRef.current) {
          isInitializingRef.current = false;
          return;
        }

        // Clean up any stale leaflet ID on container if present
        if ((container as any)._leaflet_id) {
          (container as any)._leaflet_id = null;
        }

        // Fix default marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        const initialLat = latitude ?? coords?.lat ?? 18.5204;
        const initialLng = longitude ?? coords?.lng ?? 73.8567;
        const defaultCenter: [number, number] = [initialLat, initialLng];
        const defaultZoom = (latitude && longitude) || coords ? 16 : 13;

        let map: any;
        try {
          map = L.map(container, {
            center: defaultCenter,
            zoom: defaultZoom,
            zoomControl: true,
            attributionControl: !compact,
          });
        } catch {
          (container as any)._leaflet_id = null;
          container.innerHTML = '';
          map = L.map(container, {
            center: defaultCenter,
            zoom: defaultZoom,
            zoomControl: true,
            attributionControl: !compact,
          });
        }

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map);

        const icon = createCustomIcon(L);

        if (initialLat && initialLng && (latitude || coords)) {
          markerRef.current = L.marker([initialLat, initialLng], { icon }).addTo(map);
        }

        map.on('click', async (e: any) => {
          const { lat, lng } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng], { icon: createCustomIcon(L) }).addTo(map);
          }
          setCoords({ lat, lng });
          const address = await reverseGeocode(lat, lng);
          onLocationChange(lat, lng, address);
        });

        mapInstanceRef.current = map;

        // Force resize recalculations
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 200);

        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 500);
      } catch (err) {
        console.error('Error initializing map:', err);
      } finally {
        isInitializingRef.current = false;
      }
    }

    setupMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
      if (mapContainerRef.current) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync map position and marker when props update (e.g. after async shop API response)
  useEffect(() => {
    if (latitude && longitude && mapInstanceRef.current && leafletModuleRef.current) {
      const L = leafletModuleRef.current;
      setCoords({ lat: latitude, lng: longitude });

      mapInstanceRef.current.setView([latitude, longitude], 16);

      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else {
        markerRef.current = L.marker([latitude, longitude], { icon: createCustomIcon(L) }).addTo(
          mapInstanceRef.current
        );
      }

      mapInstanceRef.current.invalidateSize();
    }
  }, [latitude, longitude]);

  // Detect user's current location
  const handleDetectLocation = async () => {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const L = leafletModuleRef.current || (await import('leaflet')).default;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng], { icon: createCustomIcon(L) }).addTo(
              mapInstanceRef.current
            );
          }
          mapInstanceRef.current.invalidateSize();
        }

        setCoords({ lat, lng });
        const address = await reverseGeocode(lat, lng);
        onLocationChange(lat, lng, address);
        setDetectingLocation(false);
      },
      () => {
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const mapHeight = compact ? 'h-48' : 'h-64';

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          Pin Shop Location on Map
        </label>
        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={detectingLocation}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
        >
          {detectingLocation ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Crosshair className="w-3.5 h-3.5" />
          )}
          {detectingLocation ? 'Detecting...' : 'Use My Location'}
        </button>
      </div>

      <div
        className={`relative rounded-xl overflow-hidden border border-border ${mapHeight} bg-muted z-0`}
      >
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />
        {!coords && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-border">
              <p className="text-xs text-muted-foreground font-medium">
                👆 Click on the map to pin your shop location
              </p>
            </div>
          </div>
        )}
      </div>

      {coords && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3 text-primary shrink-0" />
          <span className="font-mono">
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </span>
        </div>
      )}
    </div>
  );
}
