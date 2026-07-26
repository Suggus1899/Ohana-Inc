import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteData } from '@/services/routingService';

interface NavigationMapProps {
  currentPosition: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  route: RouteData | null;
  shouldCenter?: boolean;
}

const NavigationMap = ({ currentPosition, destination, route, shouldCenter }: NavigationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const userMarker = useRef<L.Marker | null>(null);
  const routePolyline = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView(
        currentPosition ? [currentPosition.lat, currentPosition.lng] : [9.4111, -67.3592],
        15
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance.current);
    }

    return () => {
      // Cleanup happens if component unmounts
    };
  }, []);

  // Update User Marker
  useEffect(() => {
    if (!mapInstance.current || !currentPosition) return;

    const latLng: L.LatLngExpression = [currentPosition.lat, currentPosition.lng];

    if (!userMarker.current) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<div style="background-color: #3b82f6; width: 15px; height: 15px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
        iconSize: [15, 15]
      });
      userMarker.current = L.marker(latLng, { icon: userIcon }).addTo(mapInstance.current);
    } else {
      userMarker.current.setLatLng(latLng);
    }

    // Auto-center if requested or first time
    if (shouldCenter) {
      mapInstance.current.setView(latLng, mapInstance.current.getZoom());
    }
  }, [currentPosition, shouldCenter]);

  // Update Route
  useEffect(() => {
    if (!mapInstance.current || !route) {
      if (routePolyline.current) {
        routePolyline.current.remove();
        routePolyline.current = null;
      }
      return;
    }

    const latLngs = route.geometry.coordinates.map(coord => [coord[1], coord[0]] as L.LatLngExpression);

    if (routePolyline.current) {
      routePolyline.current.setLatLngs(latLngs);
    } else {
      // Create a background line for boarder effect
      L.polyline(latLngs, { color: '#ffffff', weight: 10, opacity: 0.8 }).addTo(mapInstance.current);
      routePolyline.current = L.polyline(latLngs, { color: '#3b82f6', weight: 6, opacity: 1.0 }).addTo(mapInstance.current);
    }

    // Fit bounds if new route
    const bounds = L.latLngBounds(latLngs);
    mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
  }, [route]);

  // Destination Marker
  useEffect(() => {
    if (!mapInstance.current || !destination) return;

    const destMarker = L.marker([destination.lat, destination.lng], {
      title: 'Destino'
    }).addTo(mapInstance.current);

    return () => {
      destMarker.remove();
    };
  }, [destination]);

  return <div ref={mapRef} className="w-full h-full" />;
};

export default NavigationMap;
