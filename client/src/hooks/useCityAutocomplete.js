import { useState, useEffect, useRef } from 'react';

/**
 * Hook for city autocomplete using Mapbox Places API
 * Returns suggestions and handlers for city input
 */
export const useCityAutocomplete = (cityValue, selectedState, onCitySelect) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const timeoutRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    // Clear suggestions if city value is too short
    if (!cityValue || cityValue.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce API calls
    timeoutRef.current = setTimeout(async () => {
      const accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
      if (!accessToken) {
        return;
      }

      try {
        const query = cityValue.trim();
        let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
          `access_token=${accessToken}&` +
          `country=us&` +
          `types=place&` +
          `autocomplete=true&` +
          `limit=5`;

        // Bias by state if selected
        if (selectedState) {
          url += `&proximity=-98.5795,39.8283`; // Center of US
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const features = data.features || [];

        // Format suggestions as "City, ST (ZIP)"
        const formattedSuggestions = features.map(feature => {
          const context = feature.context || [];
          let city = feature.text || '';
          let state = '';
          let zip = '';

          context.forEach(item => {
            const id = item.id || '';
            if (id.includes('region')) {
              const code = item.short_code || '';
              if (code.includes('-')) {
                state = code.split('-')[1].toUpperCase();
              } else if (code.length === 2) {
                state = code.toUpperCase();
              }
            } else if (id.includes('postcode')) {
              zip = item.text || '';
            }
          });

          return {
            ...feature,
            formattedText: zip ? `${city.toUpperCase()}, ${state} (${zip})` : `${city.toUpperCase()}, ${state}`,
            city: city.toUpperCase(),
            state: state,
            zip: zip
          };
        });

        setSuggestions(formattedSuggestions);
        setShowSuggestions(formattedSuggestions.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('City autocomplete error:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [cityValue, selectedState]);

  const handleSelect = (suggestion) => {
    if (onCitySelect) {
      onCitySelect({
        city: suggestion.city,
        state: suggestion.state, // This will be 2-letter code like "AZ"
        zip: suggestion.zip || ''
      });
    }
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return {
    suggestions,
    showSuggestions,
    selectedIndex,
    suggestionsRef,
    handleSelect,
    handleKeyDown,
    setShowSuggestions
  };
};

