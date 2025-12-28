import React, { useEffect, useRef } from 'react';
import { US_STATES } from '../../constants/usStates';

/**
 * Shared AddressFormFields Component
 * 
 * Reusable address form fields component that matches the exact layout:
 * - Row 1: Full Name* (full width)
 * - Row 2: Street Address* (left) + Apartment / Unit (optional) (right)
 * - Row 3: City* (left) + State* (right)
 * - Row 4: ZIP Code* (left) + Phone (optional) (right)
 * 
 * @param {Object} props
 * @param {string} props.prefix - Prefix for IDs/refs (e.g., 'from', 'to', 'saved')
 * @param {Object} props.address - Address state object
 * @param {Function} props.setAddress - Setter function for address state
 * @param {Object} props.autocomplete - Autocomplete hook result (for street address)
 * @param {Object} props.cityAutocomplete - City autocomplete hook result (optional)
 * @param {Object} props.refs - Object with refs: { streetRef, cityRef, zipRef }
 * @param {Function} props.onAddressSelect - Handler for address selection from autocomplete
 * @param {Function} props.onZipBlur - Handler for ZIP blur event (optional)
 * @param {boolean} props.showLabel - Whether to show Label field (for SavedAddresses)
 * @param {string} props.streetPlaceholder - Placeholder for street address input
 */
const AddressFormFields = ({
  prefix,
  address,
  setAddress,
  autocomplete,
  cityAutocomplete,
  refs = {},
  onAddressSelect,
  onZipBlur,
  showLabel = false,
  streetPlaceholder = "START TYPING ADDRESS (E.G., 123 MAIN ST)"
}) => {
  const { streetRef, cityRef, zipRef } = refs;
  const cityOutsideClickCleanupRef = useRef(null);

  // Set up outside click handler for city autocomplete
  useEffect(() => {
    if (cityAutocomplete && cityRef?.current && cityAutocomplete.setupOutsideClick) {
      // Clean up previous listener
      if (cityOutsideClickCleanupRef.current) {
        cityOutsideClickCleanupRef.current();
      }
      // Set up new listener
      cityOutsideClickCleanupRef.current = cityAutocomplete.setupOutsideClick(cityRef.current);
      
      return () => {
        if (cityOutsideClickCleanupRef.current) {
          cityOutsideClickCleanupRef.current();
          cityOutsideClickCleanupRef.current = null;
        }
      };
    }
  }, [cityAutocomplete, cityRef]);

  // Set input ref for city autocomplete
  useEffect(() => {
    if (cityAutocomplete && cityRef?.current && cityAutocomplete.setInputRef) {
      cityAutocomplete.setInputRef(cityRef.current);
    }
  }, [cityAutocomplete, cityRef]);

  return (
    <div className="form-grid-2">
      {/* Label field (only for SavedAddresses) */}
      {showLabel && (
        <div className="form-field col-span-2">
          <label>Label (e.g., Home, Office)*</label>
          <input
            type="text"
            value={address.label || ''}
            onChange={(e) => setAddress({ ...address, label: e.target.value })}
            required
            placeholder="Home"
          />
        </div>
      )}

      {/* Row 1: Full Name* (full width) */}
      <div className="form-field col-span-2">
        <label>Full Name*</label>
        <input
          type="text"
          value={address.name || ''}
          onChange={(e) => setAddress({ ...address, name: e.target.value.toUpperCase() })}
          onBlur={(e) => setAddress({ ...address, name: e.target.value.toUpperCase().trim() })}
          required
          autoComplete="name"
        />
      </div>

      {/* Row 2: Street Address* (left) + Apartment / Unit (optional) (right) */}
      <div className="form-field" style={{ position: 'relative' }}>
        <label>Street Address*</label>
        <input
          ref={streetRef}
          type="text"
          value={address.street1 || ''}
          onChange={(e) => setAddress({ ...address, street1: e.target.value.toUpperCase() })}
          onBlur={(e) => setAddress({ ...address, street1: e.target.value.toUpperCase().trim() })}
          required
          autoComplete="off"
          placeholder={streetPlaceholder}
          id={`${prefix}-street-address`}
        />
        {/* CRITICAL: Only render dropdown when open AND (loading OR has items) */}
        {/* This ensures dropdown is UNMOUNTED when closed, not just hidden */}
        {/* Filter out any falsy items to prevent ghost rows */}
        {autocomplete && 
         autocomplete.open && 
         (autocomplete.loading || (autocomplete.items && autocomplete.items.length > 0)) && (
          <div 
            ref={autocomplete.rootRef}
            className="mapbox-suggestions"
          >
            {autocomplete.loading && (
              <div className="suggestion-item suggestion-loading">
                <div className="suggestion-title">Searching…</div>
              </div>
            )}
            {autocomplete.items && autocomplete.items
              .filter(item => item != null) // Filter out falsy items
              .map((suggestion, index) => (
                <div
                  key={suggestion.id || `suggestion-${index}`}
                  className={`suggestion-item ${index === autocomplete.selectedIndex ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onAddressSelect && suggestion) {
                      onAddressSelect(suggestion);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                >
                  <div className="suggestion-title">{suggestion.text || ''}</div>
                  <div className="suggestion-address">{suggestion.place_name || ''}</div>
                </div>
              ))}
          </div>
        )}
      </div>
      <div className="form-field">
        <label>Apartment / Unit (optional)</label>
        <input
          type="text"
          value={address.street2 || ''}
          onChange={(e) => setAddress({ ...address, street2: e.target.value.toUpperCase() })}
          onBlur={(e) => setAddress({ ...address, street2: e.target.value ? e.target.value.toUpperCase().trim() : '' })}
          autoComplete="address-line2"
        />
      </div>

      {/* Row 3: City* (left) + State* (right) */}
      <div className="form-field" style={{ position: 'relative' }}>
        <label>City*</label>
        {cityAutocomplete ? (
          <>
            <input
              ref={cityRef}
              type="text"
              value={address.city || ''}
              onChange={(e) => setAddress({ ...address, city: e.target.value.toUpperCase() })}
              onBlur={(e) => {
                setAddress({ ...address, city: e.target.value.toUpperCase().trim() });
                // Dropdown will close via outside click handler or blur handler in hook
              }}
              onKeyDown={cityAutocomplete.handleKeyDown}
              required
              autoComplete="address-level2"
            />
            {/* CRITICAL: Only render dropdown when open AND (loading OR has items) */}
            {/* This ensures dropdown is UNMOUNTED when closed, not just hidden */}
            {cityAutocomplete && cityAutocomplete.open && (cityAutocomplete.loading || cityAutocomplete.items.length > 0) && (
              <div 
                ref={cityAutocomplete.rootRef}
                className="mapbox-suggestions"
                style={{ top: '100%', marginTop: '4px' }}
              >
                {cityAutocomplete.loading && (
                  <div className="suggestion-item suggestion-loading">
                    <div className="suggestion-title">Searching…</div>
                  </div>
                )}
                {cityAutocomplete.items.map((suggestion, index) => (
                  <div
                    key={suggestion.id}
                    className={`suggestion-item ${index === cityAutocomplete.selectedIndex ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (cityAutocomplete.handleSelect) {
                        cityAutocomplete.handleSelect(suggestion);
                      }
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {suggestion.formattedText}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <input
            type="text"
            value={address.city || ''}
            onChange={(e) => setAddress({ ...address, city: e.target.value.toUpperCase() })}
            onBlur={(e) => setAddress({ ...address, city: e.target.value.toUpperCase().trim() })}
            required
            autoComplete="address-level2"
          />
        )}
      </div>
      <div className="form-field">
        <label>State*</label>
        <select
          value={address.state || ''}
          onChange={(e) => setAddress({ ...address, state: e.target.value })}
          required
          autoComplete="address-level1"
          className="state-select"
        >
          <option value="">Select State</option>
          {US_STATES.map(state => (
            <option key={state.value} value={state.value}>
              {state.value} - {state.label}
            </option>
          ))}
        </select>
      </div>

      {/* Row 4: ZIP Code* (left) + Phone (optional) (right) */}
      <div className="form-field">
        <label>ZIP Code*</label>
        <input
          ref={zipRef}
          type="text"
          value={address.zip || ''}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 5);
            setAddress({ ...address, zip: value });
          }}
          onBlur={onZipBlur}
          required
          autoComplete="postal-code"
          maxLength={5}
        />
      </div>
      <div className="form-field">
        <label>Phone (optional)</label>
        <input
          type="tel"
          value={address.phone || ''}
          onChange={(e) => setAddress({ ...address, phone: e.target.value })}
          autoComplete="tel"
        />
      </div>
    </div>
  );
};

export default AddressFormFields;

