import { useEffect, useRef, useState, useCallback } from 'react';

const DEBUG_AUTOCOMPLETE = false;

export const useMapboxAutocomplete = (inputRef, onPlaceSelect) => {
  // State
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  
  // Refs for state management
  const abortRef = useRef(null);
  const rootRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const blurTimeoutRef = useRef(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const itemsStateRef = useRef([]);
  const suppressNextQueryRef = useRef(false);
  const isSelectingRef = useRef(false);
  const inputValueRef = useRef('');
  const isFocusedRef = useRef(false);
  const openRef = useRef(false);
  const currentInputRef = useRef(null); // Track the actual input element to detect changes

  // Keep callback ref updated
  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

  // Keep items ref updated
  useEffect(() => {
    itemsStateRef.current = items;
  }, [items]);

  // Keep focus and open refs updated
  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

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
    
    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    // Clear state - this ensures dropdown is UNMOUNTED
    setItems([]);
    setLoading(false);
    setOpen(false);
    setSelectedIndex(-1);
  }, []);

  // Handle selection - CRITICAL: must lock and close immediately
  const handleSelect = useCallback((feature) => {
    if (DEBUG_AUTOCOMPLETE) {
      console.log('[Mapbox] handleSelect called with feature:', feature);
    }
    
    // Set selection lock to prevent re-fetch
    isSelectingRef.current = true;
    suppressNextQueryRef.current = true;
    
    // Immediately close dropdown
    closeDropdown();
    
    // Call the onPlaceSelect callback
    if (onPlaceSelectRef.current) {
      try {
        onPlaceSelectRef.current(feature);
      } catch (error) {
        console.error('[Mapbox] Error in onPlaceSelect callback:', error);
      }
    }
    
    // Blur input after closing (with small delay to ensure click event completes)
    requestAnimationFrame(() => {
      if (inputRef?.current && inputRef.current.blur) {
        inputRef.current.blur();
      }
      // Reset selection lock after blur
      setTimeout(() => {
        isSelectingRef.current = false;
      }, 100);
    });
  }, [closeDropdown, inputRef]);

  useEffect(() => {
    let isMounted = true;
    const input = inputRef?.current;
    
    if (!input) {
      // If input doesn't exist yet, return early but don't prevent re-running
      // This allows the effect to re-run when the input becomes available
      return;
    }
    
    // Check if input element has changed (remount scenario)
    const inputChanged = currentInputRef.current !== input;
    if (inputChanged) {
      if (DEBUG_AUTOCOMPLETE) {
        console.log('[Mapbox] Input element changed, resetting state');
      }
      // Reset internal state flags when input element changes
      suppressNextQueryRef.current = false;
      isSelectingRef.current = false;
      inputValueRef.current = input.value || '';
      isFocusedRef.current = false;
      openRef.current = false;
      currentInputRef.current = input;
    }

    const accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('Mapbox access token not found!');
      return;
    }
    
    if (DEBUG_AUTOCOMPLETE) {
      console.log('[Mapbox] Autocomplete initialized for input:', input.id || input.name || 'unnamed');
    }

    const performSearch = async (query) => {
      // CRITICAL: Check all conditions before fetching
      if (!isFocusedRef.current) {
        if (DEBUG_AUTOCOMPLETE) {
          console.log('[Mapbox] Not focused, skipping search');
        }
        return;
      }
      
      if (!openRef.current && query.length < 3) {
        // Don't open dropdown if query is too short
        setItems([]);
        setLoading(false);
        setOpen(false);
        return;
      }
      
      // Check suppression flag
      if (suppressNextQueryRef.current) {
        if (DEBUG_AUTOCOMPLETE) {
          console.log('[Mapbox] Suppressing query after selection');
        }
        suppressNextQueryRef.current = false;
        return;
      }
      
      // Minimum query length check
      const trimmedQuery = query.trim();
      if (trimmedQuery.length < 3) {
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
        
        // CRITICAL: Only update state if NOT aborted and still focused
        if (!abortController.signal.aborted && isFocusedRef.current && isMounted) {
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
        // Only update state if NOT aborted and still focused
        if (!abortController.signal.aborted && isFocusedRef.current && isMounted) {
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

    const handleInput = (e) => {
      // Skip if suppressing (programmatic update)
      if (suppressNextQueryRef.current) {
        if (DEBUG_AUTOCOMPLETE) {
          console.log('[Mapbox] Skipping input handler - suppressed');
        }
        suppressNextQueryRef.current = false;
        return;
      }
      
      // Skip if selecting
      if (isSelectingRef.current) {
        return;
      }
      
      const query = (e && e.target && e.target.value) || input.value || '';
      inputValueRef.current = query;
      
      if (DEBUG_AUTOCOMPLETE) {
        console.log('[Mapbox] Input event fired, query:', query);
      }
      
      // Clear previous timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Debounce API calls (250ms)
      debounceTimeoutRef.current = setTimeout(() => {
        if (isFocusedRef.current && query.trim().length >= 3) {
          performSearch(query);
        } else {
          setItems([]);
          setLoading(false);
          setOpen(false);
        }
      }, 250);
    };

    const handleFocus = () => {
      if (DEBUG_AUTOCOMPLETE) {
        console.log('[Mapbox] Input focused');
      }
      setIsFocused(true);
      // CRITICAL: Update ref immediately so performSearch can use it
      isFocusedRef.current = true;
      
      // If there's a query >= 3 chars, open dropdown
      const query = input.value || '';
      if (query.trim().length >= 3) {
        performSearch(query);
      }
    };

    const handleBlur = () => {
      if (DEBUG_AUTOCOMPLETE) {
        console.log('[Mapbox] Input blurred');
      }
      
      // Small delay to allow click events on suggestions to fire first
      blurTimeoutRef.current = setTimeout(() => {
        setIsFocused(false);
        // CRITICAL: Update ref immediately
        isFocusedRef.current = false;
        closeDropdown();
      }, 200);
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
        setIsFocused(false);
      }
    };

    // Attach event listeners
    input.addEventListener('input', handleInput, true);
    input.addEventListener('focus', handleFocus);
    input.addEventListener('blur', handleBlur);
    input.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    if (DEBUG_AUTOCOMPLETE) {
      console.log('[Mapbox] Event listeners attached');
    }

    // Return cleanup function
    return () => {
      isMounted = false;
      input.removeEventListener('input', handleInput, true);
      input.removeEventListener('focus', handleFocus);
      input.removeEventListener('blur', handleBlur);
      input.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [inputRef, closeDropdown, handleSelect, inputRef?.current]); // Include inputRef.current to detect when input element changes

  // Expose closeDropdown for external use
  const closeSuggestions = useCallback(() => {
    closeDropdown();
    setIsFocused(false);
    if (inputRef?.current && inputRef.current.blur) {
      requestAnimationFrame(() => {
        inputRef.current?.blur();
      });
    }
  }, [closeDropdown, inputRef]);

  // Expose method to set input value programmatically (with suppression)
  const setInputValue = useCallback((value) => {
    if (inputRef?.current) {
      suppressNextQueryRef.current = true;
      inputRef.current.value = value;
      inputValueRef.current = value;
      // Trigger input event manually but it will be suppressed
      const event = new Event('input', { bubbles: true });
      inputRef.current.dispatchEvent(event);
    }
  }, [inputRef]);

  // Reset function to clear all internal state
  const reset = useCallback(() => {
    if (DEBUG_AUTOCOMPLETE) {
      console.log('[Mapbox] reset() called');
    }
    
    // Abort any pending requests
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    
    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    // Clear blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    
    // Reset all state flags - IMPORTANT: Don't reset suppressNextQueryRef here
    // as it might interfere with normal operation
    isSelectingRef.current = false;
    inputValueRef.current = '';
    isFocusedRef.current = false;
    openRef.current = false;
    
    // Clear state
    setItems([]);
    setLoading(false);
    setOpen(false);
    setSelectedIndex(-1);
    setIsFocused(false);
    
    // Clear input value if ref exists
    if (inputRef?.current) {
      inputRef.current.value = '';
    }
  }, [inputRef]);

  return {
    suggestions: items, // Keep for backward compatibility
    showSuggestions: open, // Keep for backward compatibility
    isLoading: loading,
    selectedIndex,
    suggestionsRef: rootRef, // Keep for backward compatibility
    closeSuggestions,
    setInputValue,
    reset,
    // New explicit API
    open,
    loading,
    items,
    rootRef,
    isFocused
  };
};
