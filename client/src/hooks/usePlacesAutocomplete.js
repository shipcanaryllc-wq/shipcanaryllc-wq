import { useEffect, useRef, useState } from 'react';
import { loadGooglePlaces } from '../utils/loadGooglePlaces';

export const usePlacesAutocomplete = (inputRef, onPlaceSelect) => {
  const autocompleteRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load Google Places API if not already loaded
    const initGooglePlaces = async () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsLoaded(true);
        return;
      }

      try {
        await loadGooglePlaces();
        setIsLoaded(true);
      } catch (err) {
        console.warn('Google Places API not available:', err);
      }
    };

    initGooglePlaces();
  }, []);

  useEffect(() => {
    // Wait for both Google Places to load and input ref to be available
    if (!inputRef?.current || !isLoaded || !window.google?.maps?.places) {
      return;
    }

    // Clean up previous autocomplete if it exists
    if (autocompleteRef.current) {
      window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null;
    }

    try {
      // Initialize autocomplete with configuration for showing suggestions
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['address_components', 'formatted_address', 'geometry']
      });

      autocompleteRef.current = autocomplete;

      // Handle place selection
      const handlePlaceSelect = () => {
        const place = autocomplete.getPlace();
        if (place && place.address_components && onPlaceSelect) {
          onPlaceSelect(place);
        }
      };

      autocomplete.addListener('place_changed', handlePlaceSelect);

      return () => {
        if (autocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
          autocompleteRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }
  }, [inputRef, onPlaceSelect, isLoaded]);
};

