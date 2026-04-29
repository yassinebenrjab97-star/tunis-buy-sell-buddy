import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { tunisianCities } from '@/data/tunisia';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';

interface TunisiaMapProps {
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  listings?: Array<{
    id: string;
    title: string;
    lat?: number;
    lng?: number;
    property_type: string;
    price: number;
    currency: string;
  }>;
  selectedListing?: string;
  interactive?: boolean;
}

const TunisiaMap: React.FC<TunisiaMapProps> = ({ 
  onLocationSelect, 
  listings = [], 
  selectedListing,
  interactive = true 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [popup, setPopup] = useState<mapboxgl.Popup | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapContainer.current) return;

      try {
        // Get Mapbox token from Supabase secrets
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        let mapboxToken = '';
        if (error || !data?.token) {
          // Fallback - you'll need to set this manually for development
          console.warn('Could not get Mapbox token from Supabase, using fallback');
          mapboxToken = 'pk.eyJ1IjoidHVuaXNpYW1hcmtldCIsImEiOiJjbHNkZjEyM3QwMjFiMmlxdGhoZ3JtZWVsIn0.example'; // Replace with actual token
        } else {
          mapboxToken = data.token;
        }

        mapboxgl.accessToken = mapboxToken;
        
        // Initialize map centered on Tunisia
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [9.5375, 33.8869], // Tunisia center
          zoom: 6.5,
          maxZoom: 18,
          minZoom: 5
        });

        // Add navigation controls
        map.current.addControl(
          new mapboxgl.NavigationControl({
            visualizePitch: true,
          }),
          'top-right'
        );

        // Add Tunisia cities as markers
        tunisianCities.forEach(city => {
          const el = document.createElement('div');
          el.className = 'city-marker';
          el.innerHTML = `
            <div class="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:bg-blue-600 transition-colors"></div>
          `;
          
          const marker = new mapboxgl.Marker(el)
            .setLngLat([city.lng, city.lat])
            .addTo(map.current!);

          el.addEventListener('click', () => {
            if (onLocationSelect) {
              onLocationSelect({
                lat: city.lat,
                lng: city.lng,
                address: `${city.name}, ${city.governorate}`
              });
            }
          });
        });

        // Add click handler for custom location selection
        if (onLocationSelect && interactive) {
          map.current.on('click', (e) => {
            const { lng, lat } = e.lngLat;
            
            // Reverse geocoding to get address
            fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&country=TN&language=fr`)
              .then(response => response.json())
              .then(data => {
                const address = data.features[0]?.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                onLocationSelect({
                  lat,
                  lng,
                  address
                });
              })
              .catch(() => {
                onLocationSelect({
                  lat,
                  lng,
                  address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
                });
              });
          });
        }

        map.current.on('load', () => {
          updateListingMarkers();
        });

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();

    return () => {
      map.current?.remove();
    };
  }, []);

  const updateListingMarkers = () => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Close existing popup
    if (popup) {
      popup.remove();
      setPopup(null);
    }

    // Group listings by location
    const groupedListings = new Map<string, typeof listings>();
    listings.forEach(listing => {
      if (!listing.lat || !listing.lng) return;
      const key = `${listing.lat.toFixed(4)},${listing.lng.toFixed(4)}`;
      if (!groupedListings.has(key)) {
        groupedListings.set(key, []);
      }
      groupedListings.get(key)!.push(listing);
    });

    // Add listing markers
    groupedListings.forEach((groupListings, locationKey) => {
      const firstListing = groupListings[0];
      
      const el = document.createElement('div');
      el.className = 'listing-marker';
      
      const isSelected = groupListings.some(l => l.id === selectedListing);
      const markerColor = firstListing.property_type === 'car' ? 'bg-red-500' : 
                         firstListing.property_type === 'building' ? 'bg-yellow-500' : 'bg-green-500';
      
      const showCount = groupListings.length > 1;
      
      el.innerHTML = `
        <div class="relative">
          <div class="w-8 h-8 ${markerColor} rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform ${isSelected ? 'ring-2 ring-blue-400' : ''}">
            <div class="w-full h-full flex items-center justify-center">
              ${showCount 
                ? `<span class="text-white text-xs font-bold">${groupListings.length}</span>`
                : '<div class="w-2 h-2 bg-white rounded-full"></div>'
              }
            </div>
          </div>
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-${markerColor}"></div>
        </div>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([firstListing.lng!, firstListing.lat!])
        .addTo(map.current!);

      markersRef.current.push(marker);

      el.addEventListener('click', () => {
        setSelectedMarker(firstListing);
        
        const popupContent = groupListings.length === 1
          ? `
            <div class="p-3 min-w-[200px]">
              <h3 class="font-semibold text-sm mb-2">${firstListing.title}</h3>
              <p class="text-lg font-bold text-red-600 mb-2">${firstListing.price.toLocaleString()} ${firstListing.currency}</p>
              <p class="text-xs text-gray-600 capitalize">${firstListing.property_type}</p>
              <a href="/listing/${firstListing.id}" class="mt-2 block text-center bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">View Details</a>
            </div>
          `
          : `
            <div class="p-3 min-w-[250px] max-h-[300px] overflow-y-auto">
              <h3 class="font-semibold text-sm mb-3">${groupListings.length} Listings Here</h3>
              <div class="space-y-2">
                ${groupListings.map(listing => `
                  <a href="/listing/${listing.id}" class="block p-2 bg-gray-50 hover:bg-gray-100 rounded">
                    <p class="font-semibold text-xs mb-1">${listing.title}</p>
                    <p class="text-sm font-bold text-red-600">${listing.price.toLocaleString()} ${listing.currency}</p>
                  </a>
                `).join('')}
              </div>
            </div>
          `;

        const newPopup = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false,
          anchor: 'bottom',
          offset: [0, -20],
          maxWidth: '300px'
        })
          .setLngLat([firstListing.lng!, firstListing.lat!])
          .setHTML(popupContent)
          .addTo(map.current!);

        if (popup) {
          popup.remove();
        }
        setPopup(newPopup);

        newPopup.on('close', () => {
          setSelectedMarker(null);
          setPopup(null);
        });
      });
    });
  };

  useEffect(() => {
    updateListingMarkers();
  }, [listings, selectedListing]);

  useEffect(() => {
    if (selectedListing && map.current) {
      const listing = listings.find(l => l.id === selectedListing);
      if (listing && listing.lat && listing.lng) {
        map.current.flyTo({
          center: [listing.lng, listing.lat],
          zoom: 12,
          duration: 1000
        });
      }
    }
  }, [selectedListing, listings]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      {/* Map Legend */}
      <Card className="absolute bottom-4 left-4 z-10">
        <CardContent className="p-3">
          <h4 className="font-semibold text-sm mb-2">Légende</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Voitures</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Immobilier</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Terrains</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Villes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Instructions */}
      {onLocationSelect && interactive && (
        <Card className="absolute top-4 left-4 z-10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span>Cliquez sur la carte pour sélectionner un emplacement</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TunisiaMap;