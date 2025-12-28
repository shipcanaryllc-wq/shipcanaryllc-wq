# Mapbox Address Autocomplete UI Fix

## Problem
The Mapbox autocomplete dropdown was showing a weird white loading box and not disappearing immediately after address selection.

## Solution
Fixed the autocomplete hook to properly handle state cleanup, abort pending requests, and ensure immediate dropdown closure.

---

## Changes Made

### 1. Added `isLoading` State
**File:** `client/src/hooks/useMapboxAutocomplete.js`

Added loading state to track when API requests are in progress:
```javascript
const [isLoading, setIsLoading] = useState(false);
```

### 2. Added AbortController for Fetch Requests
**File:** `client/src/hooks/useMapboxAutocomplete.js`

Prevents stale fetch responses from reopening the dropdown:
```javascript
const abortControllerRef = useRef(null);

// In performSearch:
// Abort previous request if it exists
if (abortControllerRef.current) {
  abortControllerRef.current.abort();
}

// Create new AbortController for this request
const abortController = new AbortController();
abortControllerRef.current = abortController;

// Pass signal to fetch
const response = await fetch(url, {
  signal: abortController.signal
});
```

### 3. Enhanced `handleSelect` Function
**File:** `client/src/hooks/useMapboxAutocomplete.js`

Immediate cleanup on selection:
```javascript
const handleSelect = (feature) => {
  // Abort any pending fetch requests
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
  }
  
  // Clear any pending timeouts
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
  
  // Immediately close suggestions and clear state
  setShowSuggestions(false);
  setSuggestions([]);
  setIsLoading(false);
  setSelectedIndex(-1);
  
  // Blur the input to force dropdown close
  if (input && input.blur) {
    requestAnimationFrame(() => {
      input.blur();
    });
  }
  
  // Call callback...
};
```

### 4. Enhanced Escape Key Handler
**File:** `client/src/hooks/useMapboxAutocomplete.js`

Proper cleanup on Escape:
```javascript
else if (e.key === 'Escape') {
  e.preventDefault();
  // Abort any pending requests
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
  }
  // Clear timeout
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
  // Close suggestions
  setShowSuggestions(false);
  setSuggestions([]);
  setIsLoading(false);
  setSelectedIndex(-1);
  // Blur input
  if (input && input.blur) {
    input.blur();
  }
}
```

### 5. Enhanced Click Outside Handler
**File:** `client/src/hooks/useMapboxAutocomplete.js`

Proper cleanup on click outside:
```javascript
const handleClickOutside = (e) => {
  if (
    suggestionsRef.current &&
    !suggestionsRef.current.contains(e.target) &&
    input !== e.target &&
    !input.contains(e.target)
  ) {
    // Abort any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Close suggestions
    setShowSuggestions(false);
    setSuggestions([]);
    setIsLoading(false);
    setSelectedIndex(-1);
  }
};
```

### 6. Updated Dropdown Rendering Condition
**File:** `client/src/components/Dashboard/AddressFormFields.js`

Only show dropdown when:
- `showSuggestions === true`
- `isLoading === false` (or show loading spinner)
- `suggestions.length > 0`

```javascript
{autocomplete && autocomplete.showSuggestions && !autocomplete.isLoading && autocomplete.suggestions.length > 0 && (
  <div className="mapbox-suggestions">
    {/* Suggestions */}
  </div>
)}

{autocomplete && autocomplete.isLoading && autocomplete.showSuggestions && (
  <div className="mapbox-suggestions">
    <div className="suggestion-item suggestion-loading">
      <div className="suggestion-title">Loading suggestions...</div>
    </div>
  </div>
)}
```

### 7. Enhanced `closeSuggestions` Function
**File:** `client/src/hooks/useMapboxAutocomplete.js`

Complete cleanup:
```javascript
const closeSuggestions = useCallback(() => {
  // Abort any pending requests
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
  }
  // Clear timeout
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
  // Close suggestions
  setShowSuggestions(false);
  setSuggestions([]);
  setIsLoading(false);
  setSelectedIndex(-1);
  // Blur input if available
  if (inputRef?.current && inputRef.current.blur) {
    requestAnimationFrame(() => {
      inputRef.current?.blur();
    });
  }
}, [inputRef]);
```

### 8. Added Loading State CSS
**File:** `client/src/components/Dashboard/CreateLabel.css`

```css
.suggestion-loading {
  padding: 12px 16px;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
  font-style: italic;
}
```

---

## Key Improvements

1. ✅ **Immediate Dropdown Closure**: Dropdown disappears instantly on selection
2. ✅ **No White Box**: Loading state properly handled, no blank white box
3. ✅ **Abort Stale Requests**: Previous fetch requests are aborted when user types again or selects
4. ✅ **Escape Key Support**: Properly closes dropdown and cleans up state
5. ✅ **Click Outside Support**: Properly closes dropdown when clicking outside
6. ✅ **Input Blur**: Input is blurred after selection to ensure dropdown closes
7. ✅ **Loading Indicator**: Shows "Loading suggestions..." instead of blank box

---

## Testing Checklist

- [x] Dropdown closes immediately after selecting an address
- [x] No white loading box appears after selection
- [x] Escape key closes dropdown
- [x] Clicking outside closes dropdown
- [x] Typing after selection doesn't reopen dropdown immediately
- [x] Stale fetch requests are aborted
- [x] Loading state shows spinner instead of blank box
- [x] Works for both From Address and To Address

---

## Files Changed

1. `client/src/hooks/useMapboxAutocomplete.js` - Complete refactor with AbortController and proper state management
2. `client/src/components/Dashboard/AddressFormFields.js` - Updated dropdown rendering conditions
3. `client/src/components/Dashboard/CreateLabel.css` - Added loading state styles

---

## Technical Details

### AbortController Pattern
- Each fetch request gets its own AbortController
- Previous controller is aborted before starting new request
- Aborted requests are silently ignored (no error logs)

### State Cleanup Order
1. Abort pending requests
2. Clear timeouts
3. Clear suggestions array
4. Set showSuggestions to false
5. Set isLoading to false
6. Reset selectedIndex
7. Blur input (via requestAnimationFrame for smooth transition)

### Dropdown Rendering Logic
```javascript
// Only show when:
showSuggestions === true && 
!isLoading && 
suggestions.length > 0

// OR show loading state:
showSuggestions === true && 
isLoading
```

---

## Result

The autocomplete dropdown now:
- ✅ Closes immediately after selection
- ✅ Never shows a blank white box
- ✅ Properly handles loading states
- ✅ Aborts stale requests
- ✅ Responds to Escape key and click outside
- ✅ Works consistently for both From and To addresses


