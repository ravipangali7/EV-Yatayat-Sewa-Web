import { useState, useCallback, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '@/config/maps';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface SeatBookingMapProps {
  checkInLat?: number;
  checkInLng?: number;
  checkInAddress?: string;
  checkOutLat?: number;
  checkOutLng?: number;
  checkOutAddress?: string;
  onCheckInChange: (lat: number, lng: number, address: string) => void;
  onCheckOutChange: (lat: number, lng: number, address: string) => void;
  onDistanceChange?: (distance: number) => void;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

const containerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 27.7172,
  lng: 85.3240,
};

// Google Maps libraries - defined as constant to prevent LoadScript reloads
const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry'] as const;

const checkInPinIcon = {
  url: '/start_point.png',
  scaledSize: { width: 32, height: 32 },
  anchor: { x: 16, y: 16 },
};

const checkOutPinIcon = {
  url: '/end_point.png',
  scaledSize: { width: 32, height: 32 },
  anchor: { x: 16, y: 16 },
};

export function SeatBookingMap({
  checkInLat,
  checkInLng,
  checkInAddress,
  checkOutLat,
  checkOutLng,
  checkOutAddress,
  onCheckInChange,
  onCheckOutChange,
  onDistanceChange,
}: SeatBookingMapProps) {
  const [activeTab, setActiveTab] = useState<'checkin' | 'checkout'>('checkin');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'seat-booking-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Helper function: Calculate Haversine distance
  const calculateHaversineDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Calculate distance and draw polyline
  const calculateDistanceAndDrawRoute = useCallback(async () => {
    if (!checkInLat || !checkInLng || !checkOutLat || !checkOutLng || !isLoaded || !mapRef.current) return;

    try {
      // Clear previous renderer
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }

      const directionsService = new google.maps.DirectionsService();
      const renderer = new google.maps.DirectionsRenderer({
        map: mapRef.current,
        suppressMarkers: true, // We'll use our custom markers
      });

      const result = await directionsService.route({
        origin: { lat: checkInLat, lng: checkInLng },
        destination: { lat: checkOutLat, lng: checkOutLng },
        travelMode: google.maps.TravelMode.DRIVING,
      });

      renderer.setDirections(result);
      directionsRendererRef.current = renderer;

      // Calculate distance
      let totalDistance = 0;
      result.routes[0]?.legs.forEach((leg) => {
        if (leg.distance) {
          totalDistance += leg.distance.value; // Distance in meters
        }
      });

      const distanceKm = totalDistance / 1000; // Convert to kilometers
      if (onDistanceChange) {
        onDistanceChange(distanceKm);
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      // Fallback to Haversine distance
      const distance = calculateHaversineDistance(
        checkInLat!,
        checkInLng!,
        checkOutLat!,
        checkOutLng!
      );
      if (onDistanceChange) {
        onDistanceChange(distance);
      }
    }
  }, [checkInLat, checkInLng, checkOutLat, checkOutLng, isLoaded, onDistanceChange, calculateHaversineDistance]);

  // Update map center when locations change
  useEffect(() => {
    if (checkInLat && checkInLng) {
      setMapCenter({ lat: checkInLat, lng: checkInLng });
    } else if (checkOutLat && checkOutLng) {
      setMapCenter({ lat: checkOutLat, lng: checkOutLng });
    }
  }, [checkInLat, checkInLng, checkOutLat, checkOutLng]);

  // Calculate distance and draw polyline when both locations are set
  useEffect(() => {
    if (checkInLat && checkInLng && checkOutLat && checkOutLng && isLoaded && mapRef.current) {
      calculateDistanceAndDrawRoute();
    } else if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
  }, [checkInLat, checkInLng, checkOutLat, checkOutLng, isLoaded, calculateDistanceAndDrawRoute]);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'EVYatayatSewa/1.0' } }
      );
      const data = await response.json();
      return data.display_name || '';
    } catch {
      return '';
    }
  }, []);

  const handleMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      const address = await reverseGeocode(lat, lng);

      if (activeTab === 'checkin') {
        onCheckInChange(lat, lng, address);
      } else {
        onCheckOutChange(lat, lng, address);
      }
    },
    [activeTab, reverseGeocode, onCheckInChange, onCheckOutChange]
  );

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'EVYatayatSewa/1.0' } }
      );
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = async (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (activeTab === 'checkin') {
      onCheckInChange(lat, lng, result.display_name);
    } else {
      onCheckOutChange(lat, lng, result.display_name);
    }

    setMapCenter({ lat, lng });
    setShowResults(false);
    setSearchQuery(result.display_name);
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    // Recalculate route if both locations are set
    if (checkInLat && checkInLng && checkOutLat && checkOutLng) {
      setTimeout(() => calculateDistanceAndDrawRoute(), 100);
    }
  }, [checkInLat, checkInLng, checkOutLat, checkOutLng, calculateDistanceAndDrawRoute]);

  const onUnmount = useCallback(() => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
    mapRef.current = null;
  }, []);

  if (!isLoaded) {
    return (
      <Card className="overflow-hidden">
        <div className="w-full bg-muted flex items-center justify-center" style={{ height: '400px' }}>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </Card>
    );
  }

  const markers: Array<{ lat: number; lng: number; icon: any; label: string }> = [];
  if (checkInLat && checkInLng) {
    markers.push({
      lat: checkInLat,
      lng: checkInLng,
      icon: checkInPinIcon,
      label: 'Check In',
    });
  }
  if (checkOutLat && checkOutLng) {
    markers.push({
      lat: checkOutLat,
      lng: checkOutLng,
      icon: checkOutPinIcon,
      label: 'Check Out',
    });
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'checkin' | 'checkout')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="checkin">Check In</TabsTrigger>
          <TabsTrigger value="checkout">Check Out</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching} type="button">
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Search Results */}
        {showResults && searchResults.length > 0 && (
          <Card className="absolute z-10 w-full mt-2 p-2 max-h-64 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectResult(result)}
                className="w-full text-left p-3 hover:bg-muted rounded-lg transition-colors"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-1 text-primary shrink-0" />
                  <span className="text-sm">{result.display_name}</span>
                </div>
              </button>
            ))}
          </Card>
        )}
      </div>

      {/* Map */}
      <Card className="overflow-hidden">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={15}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
          }}
        >
          {/* Custom Markers */}
          {markers.map((marker, index) => (
            <Marker
              key={index}
              position={{ lat: marker.lat, lng: marker.lng }}
              icon={marker.icon}
              label={marker.label}
            />
          ))}
        </GoogleMap>
      </Card>

      {/* Location Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checkInLat && checkInLng && (
          <div className="space-y-2">
            <Label>Check In Location</Label>
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm font-medium text-muted-foreground">Coordinates</div>
              <div className="text-sm">{checkInLat.toFixed(6)}, {checkInLng.toFixed(6)}</div>
              {checkInAddress && (
                <>
                  <div className="text-sm font-medium text-muted-foreground mt-2">Address</div>
                  <div className="text-sm">{checkInAddress}</div>
                </>
              )}
            </div>
          </div>
        )}

        {checkOutLat && checkOutLng && (
          <div className="space-y-2">
            <Label>Check Out Location</Label>
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm font-medium text-muted-foreground">Coordinates</div>
              <div className="text-sm">{checkOutLat.toFixed(6)}, {checkOutLng.toFixed(6)}</div>
              {checkOutAddress && (
                <>
                  <div className="text-sm font-medium text-muted-foreground mt-2">Address</div>
                  <div className="text-sm">{checkOutAddress}</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
