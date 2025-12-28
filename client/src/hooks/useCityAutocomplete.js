import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook for city autocomplete using Mapbox Places API
 * Returns suggestions and handlers for city input
 * 
 * REFACTORED: Now uses explicit controlled state with proper unmounting
 */
export const useCityAutocomplete = (cityValue, selectedState, onCitySelect) => {
  // Explicit controlled state
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const abortRef = useRef(null);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);
  const onCitySelectRef = useRef(onCitySelect);
  const itemsStateRef = useRef([]);

  // Keep callback ref updated
  useEffect(() => {
    onCitySelectRef.current = onCitySelect;
  }, [onCitySelect]);

  // Keep items ref updated
  useEffect(() => {
    itemsStateRef.current = items;
  }, [items]);

  // Hard close function - must be used on select, escape, outside click, blur
  const closeDropdown = useCallback(() => {
    // Abort any pending requests
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Clear state - this ensures dropdown is UNMOUNTED
    setItems([]);
    setLoading(false);
    setOpen(false);
    setSelectedIndex(-1);
  }, []);

  useEffect(() => {
    // Clear suggestions if city value is too short
    if (!cityValue || cityValue.trim().length < 2) {
      closeDropdown();
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

      // Abort previous request
      if (abortRef.current) {
        abortRef.current.abort();
      }

      // Create new AbortController
      const abortController = new AbortController();
      abortRef.current = abortController;

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

        setLoading(true);

        const response = await fetch(url, {
          signal: abortController.signal
        });

        // Check if aborted BEFORE processing
        if (abortController.signal.aborted) {
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Check if aborted AFTER fetch
        if (abortController.signal.aborted) {
          return;
        }

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

        // CRITICAL: Only update state if NOT aborted
        if (!abortController.signal.aborted) {
          setItems(formattedSuggestions);
          setOpen(formattedSuggestions.length > 0);
          setLoading(false);
          setSelectedIndex(-1);
        }
      } catch (error) {
        // Don't log aborted errors
        if (error.name === 'AbortError') {
          return;
        }
        console.error('City autocomplete error:', error);
        // Only update state if NOT aborted
        if (!abortController.signal.aborted) {
          setItems([]);
          setLoading(false);
          setOpen(false);
        }
      } finally {
        // Clear abort controller if this was the active request
        if (abortRef.current === abortController) {
          abortRef.current = null;
        }
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [cityValue, selectedState, closeDropdown]);

  const handleSelect = useCallback((suggestion) => {
    // CRITICAL: Apply selected value FIRST, then close
    if (onCitySelectRef.current) {
      onCitySelectRef.current({
        city: suggestion.city,
        state: suggestion.state,
        zip: suggestion.zip || ''
      });
    }
    
    // THEN close dropdown (this unmounts it)
    closeDropdown();
    
    // Blur input after closing
    requestAnimationFrame(() => {
      if (inputRef.current && inputRef.current.blur) {
        inputRef.current.blur();
      }
    });
  }, [closeDropdown]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => prev < itemsStateRef.current.length - 1 ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && itemsStateRef.current[selectedIndex]) {
        handleSelect(itemsStateRef.current[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown();
      if (inputRef.current && inputRef.current.blur) {
        inputRef.current.blur();
      }
    }
  }, [selectedIndex, handleSelect, closeDropdown]);

  // Expose setInputRef for component to attach
  const setInputRef = useCallback((ref) => {
    inputRef.current = ref;
  }, []);

  // Outside click handler - must be set up by component
  const setupOutsideClick = useCallback((inputElement) => {
    const handleClickOutside = (e) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(e.target) &&
        inputElement !== e.target &&
        !inputElement.contains(e.target)
      ) {
        closeDropdown();
      }
    };

    // Blur handler - small delay to allow click events on suggestions to fire first
    const handleBlur = () => {
      setTimeout(() => {
        closeDropdown();
      }, 200);
    };

    document.addEventListener('mousedown', handleClickOutside);
    if (inputElement) {
      inputElement.addEventListener('blur', handleBlur);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (inputElement) {
        inputElement.removeEventListener('blur', handleBlur);
      }
    };
  }, [closeDropdown]);

  return {
    // Backward compatibility
    suggestions: items,
    showSuggestions: open,
    selectedIndex,
    suggestionsRef: rootRef,
    handleSelect,
    handleKeyDown,
    setShowSuggestions: (value) => {
      if (!value) {
        closeDropdown();
      }
    },
    // New explicit API
    open,
    loading,
    items,
    rootRef,
    setInputRef,
    setupOutsideClick
  };
};
