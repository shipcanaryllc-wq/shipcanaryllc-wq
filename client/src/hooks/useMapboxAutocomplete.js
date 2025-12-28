import { useEffect, useRef, useState, useCallback } from 'react';

const DEBUG_AUTOCOMPLETE = false;

export const useMapboxAutocomplete = (inputRef, onPlaceSelect) => {
  // Explicit controlled state
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const abortRef = useRef(null);
  const rootRef = useRef(null);
  const timeoutRef = useRef(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const itemsStateRef = useRef([]);
  const cleanupRef = useRef(null);
  const skipNextSearchRef = useRef(false);

  // Keep callback ref updated
  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

  // Keep items ref updated
  useEffect(() => {
    itemsStateRef.current = items;
  }, [items]);

  // Hard close function - must be used on select, escape, outside click, blur
  const closeDropdown = useCallback(() => {
    if (DEBUG_AUTOCOMPLETE) {
      console.log('[Mapbox] closeDropdown() called');
    }
    
    // Abort any pending requests
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    
    // Clear state - this ensures dropdown is UNMOUNTED
    setItems([]);
    setLoading(false);
    setOpen(false);
    setSelectedIndex(-1);
  }, []);

  useEffect(() => {
    let retryTimeout = null;
    let isMounted = true;

    const setupAutocomplete = () => {
      const input = inputRef?.current;
      if (!input) {
        if (isMounted) {
          retryTimeout = setTimeout(setupAutocomplete, 100);
        }
        return null;
      }

      const accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
      if (!accessToken) {
        console.error('Mapbox access token not found!');
        return null;
      }
      
      if (DEBUG_AUTOCOMPLETE) {
        console.log('[Mapbox] Autocomplete initialized for input:', input.id || 'unnamed');
      }

      const handleSelect = (feature) => {
        if (DEBUG_AUTOCOMPLETE) {
          console.log('[Mapbox] handleSelect called with feature:', feature);
        }
        
        // CRITICAL: Apply selected value FIRST, then close
        if (onPlaceSelectRef.current) {
          try {
            onPlaceSelectRef.current(feature);
          } catch (error) {
            console.error('[Mapbox] Error in onPlaceSelect callback:', error);
          }
        }
        
        // THEN close dropdown (this unmounts it)
        closeDropdown();
        
        // Blur input after closing
        requestAnimationFrame(() => {
          if (input && input.blur) {
            input.blur();
          }
        });
      };

      const performSearch = async (query) => {
        if (!query || query.trim().length < 2) {
          setItems([]);
          setLoading(false);
          setOpen(false);
          setSelectedIndex(-1);
          return;
        }

        // Abort previous request
        if (abortRef.current) {
          abortRef.current.abort();
        }

        // Create new AbortController
        const abortController = new AbortController();
        abortRef.current = abortController;

        const trimmedQuery = query.trim();
        setLoading(true);
        
        try {
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmedQuery)}.json?` +
            `access_token=${accessToken}&` +
            `country=us&` +
            `types=address&` +
            `autocomplete=true&` +
            `limit=5`;
          
          if (DEBUG_AUTOCOMPLETE) {
            console.log('[Mapbox] API call for:', trimmedQuery);
          }
          
          const response = await fetch(url, {
            signal: abortController.signal
          });

          // Check if aborted BEFORE processing response
          if (abortController.signal.aborted) {
            if (DEBUG_AUTOCOMPLETE) {
              console.log('[Mapbox] Request aborted');
            }
            return;
          }

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = await response.json();
          
          // Check if aborted AFTER fetch completes
          if (abortController.signal.aborted) {
            if (DEBUG_AUTOCOMPLETE) {
              console.log('[Mapbox] Request aborted after fetch');
            }
            return;
          }
          
          const features = data.features || [];
          
          // CRITICAL: Only update state if NOT aborted
          if (!abortController.signal.aborted) {
            setItems(features);
            setOpen(features.length > 0);
            setLoading(false);
            setSelectedIndex(-1);
          }
        } catch (error) {
          // Don't log aborted errors
          if (error.name === 'AbortError') {
            if (DEBUG_AUTOCOMPLETE) {
              console.log('[Mapbox] Request aborted (expected)');
            }
            return;
          }
          console.error('Mapbox geocoding error:', error);
          // Only update state if NOT aborted
          if (!abortController.signal.aborted) {
            setItems([]);
            setLoading(false);
            setOpen(false);
            setSelectedIndex(-1);
          }
        } finally {
          // Clear abort controller if this was the active request
          if (abortRef.current === abortController) {
            abortRef.current = null;
          }
        }
      };

      const handleInput = async (e) => {
        if (skipNextSearchRef.current) {
          if (DEBUG_AUTOCOMPLETE) {
            console.log('[Mapbox] Skipping search after selection');
          }
          return;
        }
        
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

      const handleChange = (e) => {
        if (skipNextSearchRef.current) {
          return;
        }
        
        const query = (e && e.target && e.target.value) || input.value || '';
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
            const current = itemsStateRef.current;
            return prev < current.length - 1 ? prev + 1 : prev;
          });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const current = itemsStateRef.current;
          if (selectedIndex >= 0 && current[selectedIndex]) {
            handleSelect(current[selectedIndex]);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeDropdown();
          if (input && input.blur) {
            input.blur();
          }
        }
      };

      // Outside click handler
      const handleClickOutside = (e) => {
        if (
          rootRef.current &&
          !rootRef.current.contains(e.target) &&
          input !== e.target &&
          !input.contains(e.target)
        ) {
          closeDropdown();
        }
      };

      // Blur handler
      const handleBlur = () => {
        // Small delay to allow click events on suggestions to fire first
        setTimeout(() => {
          closeDropdown();
        }, 200);
      };

      // Listen to native input events
      input.addEventListener('input', handleInput, true);
      input.addEventListener('change', handleChange, true);
      input.addEventListener('keydown', handleKeyDown);
      input.addEventListener('blur', handleBlur);
      document.addEventListener('mousedown', handleClickOutside);

      if (DEBUG_AUTOCOMPLETE) {
        console.log('[Mapbox] Event listeners attached');
      }

      // Return cleanup function
      return () => {
        input.removeEventListener('input', handleInput, true);
        input.removeEventListener('change', handleChange, true);
        input.removeEventListener('keydown', handleKeyDown);
        input.removeEventListener('blur', handleBlur);
        document.removeEventListener('mousedown', handleClickOutside);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (abortRef.current) {
          abortRef.current.abort();
          abortRef.current = null;
        }
      };
    };

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
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [inputRef, closeDropdown]);

  // Expose closeDropdown for external use
  const closeSuggestions = useCallback(() => {
    closeDropdown();
    if (inputRef?.current && inputRef.current.blur) {
      requestAnimationFrame(() => {
        inputRef.current?.blur();
      });
    }
  }, [closeDropdown, inputRef]);

  return {
    suggestions: items, // Keep for backward compatibility
    showSuggestions: open, // Keep for backward compatibility
    isLoading: loading,
    selectedIndex,
    suggestionsRef: rootRef, // Keep for backward compatibility
    closeSuggestions,
    // New explicit API
    open,
    loading,
    items,
    rootRef
  };
};
