# Autocomplete Dropdown Unmount Fix

## Problem
The Mapbox autocomplete dropdowns (Street Address and City) were showing as white boxes even after selection because they were being hidden (CSS `display: none`) rather than fully unmounted from the DOM.

## Root Cause
The previous implementation used conditional rendering like:
```javascript
{autocomplete.showSuggestions && autocomplete.suggestions.length > 0 && (
  <div className="mapbox-suggestions">...</div>
)}
```

But `showSuggestions` was being set to `false` while `suggestions` still had items, causing the dropdown container to remain in the DOM as an empty white box.

## Solution
Refactored both autocomplete hooks to use explicit controlled state with proper unmounting:

### 1. Explicit Controlled State
Both hooks now use:
- `open` - boolean controlling dropdown visibility
- `loading` - boolean for loading state
- `items` - array of suggestions
- `abortRef` - AbortController for canceling stale requests
- `rootRef` - ref to dropdown container for outside click detection

### 2. Hard Close Function
```javascript
const closeDropdown = useCallback(() => {
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
```

### 3. Selection Handler Order
```javascript
const handleSelect = (feature) => {
  // 1. Apply selected value FIRST
  if (onPlaceSelectRef.current) {
    onPlaceSelectRef.current(feature);
  }
  
  // 2. THEN close dropdown (this unmounts it)
  closeDropdown();
  
  // 3. Blur input after closing
  requestAnimationFrame(() => {
    if (input && input.blur) {
      input.blur();
    }
  });
};
```

### 4. Render Gating (CRITICAL)
The dropdown is only rendered when it should be visible:

```javascript
{/* CRITICAL: Only render dropdown when open AND (loading OR has items) */}
{/* This ensures dropdown is UNMOUNTED when closed, not just hidden */}
{autocomplete && autocomplete.open && (autocomplete.loading || autocomplete.items.length > 0) && (
  <div ref={autocomplete.rootRef} className="mapbox-suggestions">
    {autocomplete.loading && (
      <div className="suggestion-item suggestion-loading">
        <div className="suggestion-title">Searching…</div>
      </div>
    )}
    {autocomplete.items.map((suggestion, index) => (
      <div key={suggestion.id} onClick={...}>
        ...
      </div>
    ))}
  </div>
)}
```

**Key Points:**
- `open && (loading || items.length > 0)` ensures dropdown only exists when needed
- When `open === false`, the dropdown is completely removed from DOM
- Loading state shows "Searching…" instead of empty white box

### 5. AbortController for Stale Requests
```javascript
const performSearch = async (query) => {
  // Abort previous request
  if (abortRef.current) {
    abortRef.current.abort();
  }

  // Create new AbortController
  const abortController = new AbortController();
  abortRef.current = abortController;

  const response = await fetch(url, {
    signal: abortController.signal
  });

  // Check if aborted BEFORE processing
  if (abortController.signal.aborted) {
    return;
  }

  const data = await response.json();
  
  // Check if aborted AFTER fetch
  if (abortController.signal.aborted) {
    return;
  }

  // Only update state if NOT aborted
  if (!abortController.signal.aborted) {
    setItems(features);
    setOpen(features.length > 0);
    setLoading(false);
  }
};
```

### 6. Outside Click + Escape Handlers
```javascript
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

// Escape key handler
else if (e.key === 'Escape') {
  e.preventDefault();
  closeDropdown();
  if (input && input.blur) {
    input.blur();
  }
}
```

## Files Changed

### 1. `client/src/hooks/useMapboxAutocomplete.js`
- Refactored to use explicit `open`, `loading`, `items` state
- Added `closeDropdown()` function
- Added AbortController support
- Added outside click and escape handlers
- Selection handler applies value first, then closes dropdown

### 2. `client/src/hooks/useCityAutocomplete.js`
- Refactored to use explicit `open`, `loading`, `items` state
- Added `closeDropdown()` function
- Added AbortController support
- Added `setupOutsideClick()` function for component to attach listener
- Selection handler applies value first, then closes dropdown

### 3. `client/src/components/Dashboard/AddressFormFields.js`
- Updated Street Address dropdown rendering to use `open && (loading || items.length > 0)`
- Updated City dropdown rendering to use `open && (loading || items.length > 0)`
- Added outside click handler setup for city autocomplete
- Removed old `setShowSuggestions(false)` call from city onBlur

## Previous Issue Location

**Where the dropdown was still being rendered:**

1. **Street Address (Line 82-117 in old code):**
   ```javascript
   // OLD - Still rendered empty container
   {autocomplete && autocomplete.showSuggestions && !autocomplete.isLoading && autocomplete.suggestions.length > 0 && (
     <div className="mapbox-suggestions">...</div>
   )}
   {autocomplete && autocomplete.isLoading && autocomplete.showSuggestions && (
     <div className="mapbox-suggestions">...</div>  // Empty white box!
   )}
   ```
   
   **Problem:** When `isLoading` was true but `suggestions.length === 0`, the second condition would render an empty dropdown container.

2. **City (Line 150-173 in old code):**
   ```javascript
   // OLD - Could render empty container
   {cityAutocomplete.showSuggestions && cityAutocomplete.suggestions.length > 0 && (
     <div className="mapbox-suggestions">...</div>
   )}
   ```
   
   **Problem:** If `showSuggestions` was set to `false` but `suggestions` still had items (race condition), the dropdown would disappear but the container might still exist briefly.

## New Implementation

**Fixed rendering:**

1. **Street Address:**
   ```javascript
   // NEW - Only renders when open AND has content
   {autocomplete && autocomplete.open && (autocomplete.loading || autocomplete.items.length > 0) && (
     <div ref={autocomplete.rootRef} className="mapbox-suggestions">
       {autocomplete.loading && <div>Searching…</div>}
       {autocomplete.items.map(...)}
     </div>
   )}
   ```

2. **City:**
   ```javascript
   // NEW - Only renders when open AND has content
   {cityAutocomplete && cityAutocomplete.open && (cityAutocomplete.loading || cityAutocomplete.items.length > 0) && (
     <div ref={cityAutocomplete.rootRef} className="mapbox-suggestions">
       {cityAutocomplete.loading && <div>Searching…</div>}
       {cityAutocomplete.items.map(...)}
     </div>
   )}
   ```

## Verification Checklist

- [x] Selecting a suggestion removes the dropdown instantly (unmounted, not hidden)
- [x] No white box appears after selection
- [x] Clicking outside closes dropdown
- [x] Escape key closes dropdown
- [x] Switching between inputs doesn't leave ghost dropdowns
- [x] City field dropdown closes properly
- [x] Stale fetch responses don't reopen dropdown
- [x] Loading state shows "Searching…" instead of blank box

## Key Improvements

1. ✅ **Complete Unmounting**: Dropdown is removed from DOM when `open === false`
2. ✅ **No Empty Containers**: Only renders when `open && (loading || items.length > 0)`
3. ✅ **Stale Request Prevention**: AbortController prevents old responses from updating state
4. ✅ **Proper State Management**: Explicit `open` state instead of derived `showSuggestions`
5. ✅ **Consistent Behavior**: Both Street Address and City use same pattern



