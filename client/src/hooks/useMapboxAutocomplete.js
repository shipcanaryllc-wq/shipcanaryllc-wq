import { useEffect, useRef, useState, useCallback } from 'react';

const DEBUG_AUTOCOMPLETE = false;

export const useMapboxAutocomplete = (inputRef, onPlaceSelect) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef(null);
  const timeoutRef = useRef(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const suggestionsStateRef = useRef([]);
  const cleanupRef = useRef(null);
  const skipNextSearchRef = useRef(false);

  // Keep callback ref updated
  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

  // Keep suggestions ref updated
  useEffect(() => {
    suggestionsStateRef.current = suggestions;
  }, [suggestions]);

  useEffect(() => {
    let retryTimeout = null;
    let isMounted = true;

    const setupAutocomplete = () => {
      const input = inputRef?.current;
      if (!input) {
        // Retry after a short delay if ref isn't ready yet
        if (isMounted) {
          retryTimeout = setTimeout(setupAutocomplete, 100);
        }
        return null;
      }

      const accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
      if (!accessToken) {
        console.error('Mapbox access token not found!');
        console.error('Make sure REACT_APP_MAPBOX_ACCESS_TOKEN is set in client/.env');
        return null;
      }
      
      if (DEBUG_AUTOCOMPLETE) {
        console.log('[Mapbox] Autocomplete initialized for input:', input.id || 'unnamed');
      }

      const handleSelect = (feature) => {
        if (DEBUG_AUTOCOMPLETE) {
          console.log('[Mapbox] handleSelect called with feature:', feature);
          console.log('[Mapbox] Feature properties:', feature.properties);
          console.log('[Mapbox] Feature place_name:', feature.place_name);
          console.log('[Mapbox] Feature text:', feature.text);
        }
        
        // Immediately close suggestions to prevent re-opening
        setShowSuggestions(false);
        setSuggestions([]);
        setSelectedIndex(-1);
        
        // Skip next search to prevent dropdown from reopening
        skipNextSearchRef.current = true;
        setTimeout(() => {
          skipNextSearchRef.current = false;
        }, 500);
        
        // Call the callback to update React state
        if (onPlaceSelectRef.current) {
          if (DEBUG_AUTOCOMPLETE) {
            console.log('[Mapbox] Calling onPlaceSelect callback');
          }
          try {
            onPlaceSelectRef.current(feature);
            if (DEBUG_AUTOCOMPLETE) {
              console.log('[Mapbox] onPlaceSelect callback completed');
            }
          } catch (error) {
            console.error('[Mapbox] Error in onPlaceSelect callback:', error);
          }
        } else {
          console.warn('[Mapbox] onPlaceSelect callback is not set');
        }
      };

      const performSearch = async (query) => {
        if (!query || query.trim().length < 2) {
          setSuggestions([]);
          setShowSuggestions(false);
          setSelectedIndex(-1);
          return;
        }

        const trimmedQuery = query.trim();
        
        try {
          // Use Mapbox Geocoding v5 API
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmedQuery)}.json?` +
            `access_token=${accessToken}&` +
            `country=us&` +
            `types=address&` +
            `autocomplete=true&` +
            `limit=5`;
          
          if (DEBUG_AUTOCOMPLETE) {
            console.log('[Mapbox] API call for:', trimmedQuery);
          }
          
          const response = await fetch(url);

          if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { message: errorText };
            }
            console.error('Mapbox API error:', response.status, errorData);
            if (response.status === 401) {
              console.error('Authentication failed. Check your access token is correct.');
            } else if (response.status === 403) {
              console.error('Access forbidden. Make sure your token has geocoding permissions.');
            }
            throw new Error(errorData.message || `HTTP ${response.status}`);
          }

          const data = await response.json();
          
          // v5 API returns features in data.features array
          const features = data.features || [];
          if (DEBUG_AUTOCOMPLETE) {
            console.log('[Mapbox] Found', features.length, 'suggestions for:', trimmedQuery);
          }
          setSuggestions(features);
          setShowSuggestions(features.length > 0);
          setSelectedIndex(-1);
        } catch (error) {
          console.error('Mapbox geocoding error:', error);
          setSuggestions([]);
          setShowSuggestions(false);
          setSelectedIndex(-1);
        }
      };

      const handleInput = async (e) => {
        // Skip search if we just selected a suggestion
        if (skipNextSearchRef.current) {
          if (DEBUG_AUTOCOMPLETE) {
            console.log('[Mapbox] Skipping search after selection');
          }
          return;
        }
        
        // Get value from event target, or fallback to input.value (for controlled inputs)
        const query = (e && e.target && e.target.value) || input.value || '';
        if (DEBUG_AUTOCOMPLETE) {
          console.log('[Mapbox] Input event fired, query:', query);
        }
        
        // Clear previous timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Debounce API calls
        timeoutRef.current = setTimeout(() => {
          performSearch(query);
        }, 300);
      };

      // Also listen to React onChange events (for controlled inputs)
      const handleChange = (e) => {
        // Skip search if we just selected a suggestion
        if (skipNextSearchRef.current) {
          if (DEBUG_AUTOCOMPLETE) {
            console.log('[Mapbox] Skipping change search after selection');
          }
          return;
        }
        
        const query = (e && e.target && e.target.value) || input.value || '';
        if (DEBUG_AUTOCOMPLETE) {
          console.log('[Mapbox] Change event fired, query:', query);
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          performSearch(query);
        }, 300);
      };

      const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => {
            const current = suggestionsStateRef.current;
            return prev < current.length - 1 ? prev + 1 : prev;
          });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const current = suggestionsStateRef.current;
          if (selectedIndex >= 0 && current[selectedIndex]) {
            if (DEBUG_AUTOCOMPLETE) {
              console.log('[Mapbox] Enter key pressed, selecting suggestion at index:', selectedIndex);
            }
            handleSelect(current[selectedIndex]);
          }
        } else if (e.key === 'Escape') {
          setShowSuggestions(false);
          setSelectedIndex(-1);
        }
      };

      const handleClickOutside = (e) => {
        if (
          suggestionsRef.current &&
          !suggestionsRef.current.contains(e.target) &&
          input !== e.target &&
          !input.contains(e.target)
        ) {
          setShowSuggestions(false);
        }
      };

      // Listen to native input events (works for both controlled and uncontrolled)
      // React controlled inputs should still fire native 'input' events when user types
      input.addEventListener('input', handleInput, true); // Use capture phase
      input.addEventListener('change', handleChange, true); // Also listen to change
      input.addEventListener('keydown', handleKeyDown);
      document.addEventListener('click', handleClickOutside);

      if (DEBUG_AUTOCOMPLETE) {
        console.log('[Mapbox] Event listeners attached to:', input.id || 'unnamed input');
      }

      // Return cleanup function
      return () => {
        input.removeEventListener('input', handleInput, true);
        input.removeEventListener('change', handleChange, true);
        input.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('click', handleClickOutside);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    };

    // Start checking for input
    const cleanup = setupAutocomplete();
    cleanupRef.current = cleanup;
    
    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputRef]); // Only depend on inputRef

  // Function to close suggestions programmatically
  const closeSuggestions = useCallback(() => {
    if (DEBUG_AUTOCOMPLETE) {
      console.log('[Mapbox] closeSuggestions() called');
    }
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  }, []);

  return {
    suggestions,
    showSuggestions,
    selectedIndex,
    suggestionsRef,
    closeSuggestions
  };
};
