import { useRef } from 'react';

/**
 * Hook for ZIP code lookup using Mapbox
 * Returns a function to lookup ZIP and populate city/state
 */
export const useZipLookup = () => {
  const timeoutRef = useRef(null);

  const lookupZip = async (zip, onResult) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only lookup if ZIP is 5 digits
    if (!zip || zip.trim().length !== 5 || !/^\d{5}$/.test(zip.trim())) {
      return;
    }

    // Debounce lookup
    timeoutRef.current = setTimeout(async () => {
      const accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
      if (!accessToken) {
        return;
      }

      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(zip)}.json?` +
          `access_token=${accessToken}&` +
          `country=us&` +
          `types=postcode&` +
          `limit=1`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const features = data.features || [];

        if (features.length > 0) {
          const feature = features[0];
          const context = feature.context || [];
          let city = '';
          let state = '';

          context.forEach(item => {
            const id = item.id || '';
            if (id.includes('place')) {
              city = item.text || '';
            } else if (id.includes('region')) {
              const code = item.short_code || '';
              if (code.includes('-')) {
                state = code.split('-')[1].toUpperCase();
              } else if (code.length === 2) {
                state = code.toUpperCase();
              }
            }
          });

          if (city && state && onResult) {
            onResult({
              city: city.toUpperCase(),
              state: state,
              zip: zip.trim()
            });
          }
        }
      } catch (error) {
        console.error('ZIP lookup error:', error);
        // Fail silently - user can still type manually
      }
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  };

  return { lookupZip };
};










