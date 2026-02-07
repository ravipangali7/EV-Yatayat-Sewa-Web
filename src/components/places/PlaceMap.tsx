import { useState, useCallback } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GoogleMapComponent } from '@/components/maps/GoogleMap';

interface PlaceMapProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function PlaceMap({ latitude, longitude, onLocationChange }: PlaceMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Get address from coordinates using OpenStreetMap Nominatim
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await response.json();
      return data.display_name || '';
    } catch {
      return '';
    }
  }, []);

  // Search for places
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
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
    onLocationChange(lat, lng, result.display_name);
    setShowResults(false);
    setSearchQuery(result.display_name);
  };

  return (
    <div className="space-y-4">
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
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Search Results */}
        {showResults && searchResults.length > 0 && (
          <Card className="absolute z-10 w-full mt-2 p-2 max-h-64 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
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

      {/* Google Map Display with custom pin */}
      <GoogleMapComponent
        latitude={latitude}
        longitude={longitude}
        onLocationChange={onLocationChange}
        height="400px"
        zoom={15}
        clickable={true}
      />
    </div>
  );
}
