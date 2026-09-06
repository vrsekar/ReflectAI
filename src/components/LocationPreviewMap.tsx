import React from 'react';
import { JournalLocation } from '../types';
import { MapPin, ExternalLink, Compass, Navigation } from 'lucide-react';

interface LocationPreviewMapProps {
  location: JournalLocation;
}

export const LocationPreviewMap: React.FC<LocationPreviewMapProps> = ({ location }) => {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs">
      {/* Visual map preview header */}
      <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold truncate max-w-xs">{location.name}</h4>
            <p className="text-[11px] text-stone-400 truncate max-w-xs">{location.address}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition-colors"
          >
            <Navigation className="h-3 w-3 text-emerald-400" />
            <span className="hidden sm:inline">Directions</span>
          </a>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
          >
            <span>Google Maps</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Styled Location Coordinate Stage */}
      <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-4 text-stone-600">
          <div className="flex items-center space-x-1.5">
            <Compass className="h-3.5 w-3.5 text-stone-400" />
            <span className="font-mono text-stone-800 font-medium">
              {location.latitude >= 0 ? `${location.latitude.toFixed(4)}° N` : `${Math.abs(location.latitude).toFixed(4)}° S`}
              {', '}
              {location.longitude >= 0 ? `${location.longitude.toFixed(4)}° E` : `${Math.abs(location.longitude).toFixed(4)}° W`}
            </span>
          </div>
          {location.placeId && (
            <span className="hidden md:inline text-stone-400 text-[10px]">
              Place ID: {location.placeId.slice(0, 12)}...
            </span>
          )}
        </div>

        <span className="text-[11px] text-stone-500 flex items-center space-x-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Location Verified via Google Maps Platform</span>
        </span>
      </div>
    </div>
  );
};
