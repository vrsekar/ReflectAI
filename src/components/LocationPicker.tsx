import React, { useState } from 'react';
import { JournalLocation } from '../types';
import {
  MapPin,
  Navigation,
  Search,
  X,
  ExternalLink,
  Loader2,
  AlertCircle,
  Check,
  Compass,
} from 'lucide-react';

interface LocationPickerProps {
  location: JournalLocation | null;
  onChange: (loc: JournalLocation | null) => void;
  disabled?: boolean;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  location,
  onChange,
  disabled = false,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<JournalLocation[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Request browser geolocation and reverse-geocode securely via backend proxy
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Route through secure backend proxy (Pattern A: Zero client-side API key exposure)
          const res = await fetch('/api/maps/reverse-geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }),
          });

          if (!res.ok) {
            throw new Error('Failed to resolve location address.');
          }

          const data = await res.json();
          onChange({
            latitude,
            longitude,
            name: data.name || 'Current Location',
            address: data.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            placeId: data.placeId,
          });
          setShowSearch(false);
        } catch (err: any) {
          // Fallback to basic coordinates if reverse geocoding is unavailable
          onChange({
            latitude,
            longitude,
            name: `Pinned Location (${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°)`,
            address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
          });
        } finally {
          setIsLocating(false);
        }
      },
      (geoErr) => {
        setIsLocating(false);
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setErrorMsg('Location permission was denied. You can search for a location manually.');
        } else {
          setErrorMsg('Could not determine current location. Try manual search.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/maps/search-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });

      if (!res.ok) {
        throw new Error('Search failed.');
      }

      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
        setErrorMsg('No matching locations found. Try another search query.');
      }
    } catch (err: any) {
      setErrorMsg('Failed to search location.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: JournalLocation) => {
    onChange(result);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Action triggers if no location is pinned */}
      {!location ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={disabled || isLocating}
              onClick={handleGetCurrentLocation}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors border border-stone-200 cursor-pointer disabled:opacity-50"
              title="Pin my current location"
            >
              {isLocating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-stone-500" />
              ) : (
                <Navigation className="h-3.5 w-3.5 text-emerald-600" />
              )}
              <span>{isLocating ? 'Detecting Location...' : 'Pin Current Location'}</span>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setShowSearch(!showSearch);
                setErrorMsg(null);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors border border-stone-200 cursor-pointer disabled:opacity-50"
            >
              <Search className="h-3.5 w-3.5 text-stone-500" />
              <span>Search Location / Place</span>
            </button>
          </div>

          {/* Search Box Drawer */}
          {showSearch && (
            <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-xs space-y-2.5 animate-in fade-in duration-150">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search city, address, or landmark (e.g., Tokyo, Central Park)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400 bg-stone-50/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!searchQuery.trim() || isSearching}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Search'}
                </button>
              </form>

              {/* Results List */}
              {searchResults.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto divide-y divide-stone-100 text-xs">
                  {searchResults.map((res, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectResult(res)}
                      className="p-2 hover:bg-stone-50 rounded-lg cursor-pointer flex items-center justify-between group transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-stone-800 truncate">{res.name}</p>
                        <p className="text-[11px] text-stone-500 truncate">{res.address}</p>
                      </div>
                      <Check className="h-4 w-4 text-emerald-600 opacity-0 group-hover:opacity-100 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Pinned Location Card */
        <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-start space-x-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-stone-900 truncate">{location.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100/70 text-emerald-800 font-medium">
                  Pinned
                </span>
              </div>
              <p className="text-[11px] text-stone-600 truncate mt-0.5">{location.address}</p>
              <div className="flex items-center space-x-3 text-[10px] text-stone-400 mt-1">
                <span>{location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°</span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-0.5 text-emerald-700 hover:underline"
                >
                  <span>View on Google Maps</span>
                  <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                </a>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(null)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-white/80 transition-colors cursor-pointer shrink-0"
            title="Remove pinned location"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center space-x-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
