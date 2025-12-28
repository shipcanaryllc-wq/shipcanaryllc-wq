import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Ban } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PackageDetailsModal from './PackageDetailsModal';
import OrderConfirmation from './OrderConfirmation';
import AddressFormFields from './AddressFormFields';
import { useMapboxAutocomplete } from '../../hooks/useMapboxAutocomplete';
import { useCityAutocomplete } from '../../hooks/useCityAutocomplete';
import { useZipLookup } from '../../hooks/useZipLookup';
import { US_STATES } from '../../constants/usStates';
import './CreateLabel.css';
import API_BASE_URL from '../../config/api';

// Smart Tooltip Component with auto-placement
const SmartTooltip = ({ maxDimensions, maxWeight, apiId }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ placement: 'top', x: 0, y: 0, arrowOffset: 0 });
  const iconRef = useRef(null);
  const tooltipRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!iconRef.current || !tooltipRef.current) return;

    const iconRect = iconRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Get the card element (parent of option-max-info)
    const cardElement = iconRef.current.closest('.usps-option');
    const cardRect = cardElement ? cardElement.getBoundingClientRect() : null;

    const tooltipWidth = tooltipRect.width || 220;
    const tooltipHeight = tooltipRect.height || 120;
    const spacing = 10;
    const minSpacingFromEdge = 8;

    let placement = 'top';
    let x = 0;
    let y = 0;

    // Check available space
    const spaceAbove = iconRect.top;
    const spaceBelow = viewport.height - iconRect.bottom;
    const spaceLeft = iconRect.left;
    const spaceRight = viewport.width - iconRect.right;

    // Determine vertical placement - prefer top, but check if card border would be overlapped
    const cardTopOffset = cardRect ? iconRect.top - cardRect.top : 0;
    const cardBottomOffset = cardRect ? cardRect.bottom - iconRect.bottom : 0;
    
    // Ensure tooltip doesn't overlap card border (account for 2px border)
    const minDistanceFromCardTop = cardTopOffset + 2 + spacing;
    const minDistanceFromCardBottom = cardBottomOffset + 2 + spacing;

    if (spaceAbove >= tooltipHeight + spacing && spaceAbove >= minDistanceFromCardTop) {
      placement = 'top';
      y = -tooltipHeight - spacing;
    } else if (spaceBelow >= tooltipHeight + spacing && spaceBelow >= minDistanceFromCardBottom) {
      placement = 'bottom';
      y = iconRect.height + spacing;
    } else {
      // Use whichever has more space, but ensure it's outside card
      if (spaceAbove > spaceBelow && spaceAbove >= minDistanceFromCardTop) {
        placement = 'top';
        y = -Math.min(tooltipHeight + spacing, spaceAbove - minDistanceFromCardTop);
      } else if (spaceBelow >= minDistanceFromCardBottom) {
        placement = 'bottom';
        y = iconRect.height + spacing;
      } else {
        // Fallback: place above but adjust to available space
        placement = 'top';
        y = -Math.max(spacing, spaceAbove - minDistanceFromCardTop);
      }
    }

    // Determine horizontal centering relative to icon center
    const iconCenterX = iconRect.left + iconRect.width / 2;
    x = -tooltipWidth / 2;

    // Adjust if tooltip would overflow viewport left
    const tooltipLeft = iconCenterX + x;
    if (tooltipLeft < minSpacingFromEdge) {
      x = minSpacingFromEdge - iconCenterX;
    }
    // Adjust if tooltip would overflow viewport right
    const tooltipRight = iconCenterX + x + tooltipWidth;
    if (tooltipRight > viewport.width - minSpacingFromEdge) {
      x = viewport.width - minSpacingFromEdge - iconCenterX - tooltipWidth;
    }

    // Calculate arrow offset (how far from center the arrow should be to point at icon)
    const tooltipCenterX = iconCenterX + x + tooltipWidth / 2;
    const arrowOffset = iconCenterX - tooltipCenterX;
    const maxArrowOffset = tooltipWidth / 2 - 20; // Keep arrow within tooltip bounds
    const clampedArrowOffset = Math.max(-maxArrowOffset, Math.min(maxArrowOffset, arrowOffset));

    setPosition({ placement, x, y, arrowOffset: clampedArrowOffset });
  }, []);

  const handleMouseEnter = () => {
    setIsVisible(true);
    // Small delay to ensure tooltip is rendered before calculating
    setTimeout(calculatePosition, 0);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      window.addEventListener('scroll', calculatePosition, true);
      window.addEventListener('resize', calculatePosition);
      return () => {
        window.removeEventListener('scroll', calculatePosition, true);
        window.removeEventListener('resize', calculatePosition);
      };
    }
  }, [isVisible, calculatePosition]);

  const tooltipElement = isVisible && iconRef.current ? (
        <div
          ref={tooltipRef}
          className={`tooltip tooltip-${position.placement}`}
          style={{
            left: `${iconRef.current.getBoundingClientRect().left + iconRef.current.getBoundingClientRect().width / 2}px`,
            top: `${iconRef.current.getBoundingClientRect().top + iconRef.current.getBoundingClientRect().height / 2}px`,
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
        >
          <div className="tooltip-content">
            <div className="tooltip-row">
              <span className="tooltip-label">Max Dimensions:</span>
              <span className="tooltip-value">{maxDimensions}" total</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">Max Weight:</span>
          <span className="tooltip-value">≤ {maxWeight} lbs</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">Estimated Delivery:</span>
          <span className="tooltip-value">{apiId === 373 ? '1-3 business days' : '2-5 business days'}</span>
            </div>
          </div>
          <div 
            className={`tooltip-arrow tooltip-arrow-${position.placement}`}
            style={{
              left: position.arrowOffset !== undefined ? `calc(50% + ${position.arrowOffset}px)` : '50%',
            }}
          ></div>
        </div>
  ) : null;

  return (
    <div className="info-icon-container">
      <span
        ref={iconRef}
        className="info-icon"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        i
      </span>
      {tooltipElement && ReactDOM.createPortal(tooltipElement, document.body)}
    </div>
  );
};

// Unavailable Badge Component with Tooltip
const UnavailableBadge = ({ disabledReason }) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const badgeRef = useRef(null);
  const tooltipRef = useRef(null);

  const calculateTooltipPosition = useCallback(() => {
    if (!badgeRef.current || !tooltipRef.current) return;

    const badgeRect = badgeRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const tooltipWidth = tooltipRect.width || 200;
    const spacing = 8;
    const minSpacingFromEdge = 8;

    // Position tooltip above the badge
    let x = badgeRect.left + badgeRect.width / 2 - tooltipWidth / 2;
    let y = badgeRect.top - tooltipRect.height - spacing;

    // Adjust if tooltip would overflow viewport
    if (x < minSpacingFromEdge) {
      x = minSpacingFromEdge;
    }
    if (x + tooltipWidth > viewport.width - minSpacingFromEdge) {
      x = viewport.width - minSpacingFromEdge - tooltipWidth;
    }

    // If not enough space above, position below
    if (y < minSpacingFromEdge) {
      y = badgeRect.bottom + spacing;
    }

    return { x, y };
  }, []);

  useEffect(() => {
    if (isTooltipVisible) {
      const position = calculateTooltipPosition();
      if (tooltipRef.current && position) {
        tooltipRef.current.style.left = `${position.x}px`;
        tooltipRef.current.style.top = `${position.y}px`;
      }
      window.addEventListener('scroll', calculateTooltipPosition, true);
      window.addEventListener('resize', calculateTooltipPosition);
      return () => {
        window.removeEventListener('scroll', calculateTooltipPosition, true);
        window.removeEventListener('resize', calculateTooltipPosition);
      };
    }
  }, [isTooltipVisible, calculateTooltipPosition]);

  const tooltipElement = isTooltipVisible && badgeRef.current ? (
    <div
      ref={tooltipRef}
      className="unavailable-tooltip"
      style={{
        position: 'fixed',
        zIndex: 10000,
      }}
    >
      <div className="unavailable-tooltip-content">
        {disabledReason || 'Unavailable for this service selection'}
      </div>
      <div className="unavailable-tooltip-arrow"></div>
    </div>
  ) : null;

  return (
    <>
      <div
        ref={badgeRef}
        className="unavailable-badge"
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
      >
        <Ban size={14} />
        <span>Unavailable</span>
      </div>
      {tooltipElement && ReactDOM.createPortal(tooltipElement, document.body)}
    </>
  );
};

const CreateLabel = () => {
  const { user, updateBalance, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [labelTypes, setLabelTypes] = useState([]);
  
  // Service selection state - track user selection vs auto-selection
  const [userSelectedServiceId, setUserSelectedServiceId] = useState(null);
  const [autoSelectedServiceId, setAutoSelectedServiceId] = useState(null);
  
  // Service family toggle state (controls auto-selection filtering)
  const [serviceFamily, setServiceFamily] = useState('ground'); // 'ground' | 'priority'
  
  // Use ref to track if purchase is in progress (prevents race conditions)
  // This is more reliable than just checking loading state because refs persist across renders
  const isPurchaseInProgressRef = useRef(false);
  
  // Computed effective service (user selection takes precedence)
  const effectiveServiceId = userSelectedServiceId ?? autoSelectedServiceId;
  const selectedService = labelTypes.find(lt => lt.id === effectiveServiceId) || null;
  
  // Selected saved items (optional dropdowns)
  const [selectedFromAddressId, setSelectedFromAddressId] = useState('');
  const [selectedToAddressId, setSelectedToAddressId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  
  // New address/package data
  const [newFromAddress, setNewFromAddress] = useState({
    label: 'New From Address',
    name: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    country: 'US'
  });
  const [newToAddress, setNewToAddress] = useState({
    label: 'New To Address',
    name: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    country: 'US'
  });
  const [newPackage, setNewPackage] = useState({
    label: 'New Package',
    length: '0',
    width: '0',
    height: '0',
    weight: '0',
    description: ''
  });
  
  // Refs for city autocomplete
  const fromCityRef = useRef(null);
  const toCityRef = useRef(null);
  const fromZipRef = useRef(null);
  const toZipRef = useRef(null);
  
  const [addresses, setAddresses] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dimensionError, setDimensionError] = useState('');
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  
  // Debounce timer for auto-selection
  const autoSelectTimerRef = useRef(null);

  // Refs for address autocomplete
  const fromStreetRef = useRef(null);
  const toStreetRef = useRef(null);

  // Helper function to parse Mapbox v5 API address
  const DEBUG_AUTOCOMPLETE = false;

  // Refs to store closeSuggestions functions from hooks
  const fromAutocompleteCloseRef = useRef(null);
  const toAutocompleteCloseRef = useRef(null);

  // Helper: Extract house number from feature
  const extractHouseNumber = (feature) => {
    // Method 1: properties.address (Mapbox v5 forward geocode)
    if (feature.properties?.address) {
      if (DEBUG_AUTOCOMPLETE) {
        console.log('[parseAddress] extractHouseNumber: from properties.address:', feature.properties.address);
      }
      return feature.properties.address.trim();
    }
    
    // Method 2: feature.address (some Mapbox objects use this)
    if (feature.address) {
      if (DEBUG_AUTOCOMPLETE) {
        console.log('[parseAddress] extractHouseNumber: from feature.address:', feature.address);
      }
      return feature.address.trim();
    }
    
    // Method 3: Parse from beginning of place_name if it starts with digits
    if (feature.place_name) {
      const firstPart = feature.place_name.split(',')[0] || '';
      // Match: number optionally followed by letter, optionally followed by dash and more digits
      // e.g., "1020", "1020A", "1020-1022"
      const houseNumberMatch = firstPart.match(/^(\d+[A-Z]?(?:-\d+)?)\b/);
      if (houseNumberMatch && houseNumberMatch[1]) {
        if (DEBUG_AUTOCOMPLETE) {
          console.log('[parseAddress] extractHouseNumber: parsed from place_name:', houseNumberMatch[1]);
        }
        return houseNumberMatch[1].trim();
      }
    }
    
    return null;
  };

  // Helper: Extract street name from feature
  const extractStreetName = (feature) => {
    // Method 1: feature.text (street name)
    if (feature.text) {
      if (DEBUG_AUTOCOMPLETE) {
        console.log('[parseAddress] extractStreetName: from feature.text:', feature.text);
      }
      return feature.text.trim();
    }
    
    // Method 2: Parse from place_name after house number
    if (feature.place_name) {
      const firstPart = feature.place_name.split(',')[0] || '';
      // Remove house number if present, then get the rest
      const withoutNumber = firstPart.replace(/^\d+[A-Z]?(?:-\d+)?\s*/, '').trim();
      // Remove unit patterns if present
      const withoutUnit = withoutNumber.replace(/\b(APT|APARTMENT|APPT|SUITE|STE|ST|UNIT|UNT|#)\s+[A-Z0-9-]+\b/gi, '').trim();
      if (withoutUnit) {
        if (DEBUG_AUTOCOMPLETE) {
          console.log('[parseAddress] extractStreetName: parsed from place_name:', withoutUnit);
        }
        return withoutUnit;
      }
    }
    
    return null;
  };

  // Helper: Extract unit (APT/SUITE/#) from feature
  const extractUnit = (feature) => {
    if (!feature.place_name) return null;
    
    const firstPart = feature.place_name.split(',')[0] || '';
    
    // Look for unit patterns: APT, SUITE, #, UNIT, etc.
    const unitPatterns = [
      /\b(APT|APARTMENT|APPT)\s+([A-Z0-9-]+)\b/i,
      /\b(SUITE|STE|ST)\s+([A-Z0-9-]+)\b/i,
      /\b(UNIT|UNT)\s+([A-Z0-9-]+)\b/i,
      /\b#\s*([A-Z0-9-]+)\b/i,
    ];
    
    for (const pattern of unitPatterns) {
      const match = firstPart.match(pattern);
      if (match && match[0]) {
        const unit = match[0].trim();
        if (DEBUG_AUTOCOMPLETE) {
          console.log('[parseAddress] extractUnit: found:', unit);
        }
        return unit;
      }
    }
    
    return null;
  };

  const parseAddress = (feature) => {
    if (DEBUG_AUTOCOMPLETE) {
      console.log('[parseAddress] Parsing feature:', feature);
      console.log('[parseAddress] place_name:', feature.place_name);
      console.log('[parseAddress] properties:', feature.properties);
      console.log('[parseAddress] text:', feature.text);
    }

    const address = {
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    };

    // Mapbox v5 API structure - context is an array
    const context = feature.context || [];
    
    // Extract components
    const houseNumber = extractHouseNumber(feature);
    const streetName = extractStreetName(feature);
    const unit = extractUnit(feature);
    
    // Build street1 with strict fallback order that preserves house number
    if (houseNumber && streetName) {
      // Best case: both house number and street name exist
      address.street1 = `${houseNumber} ${streetName}${unit ? ' ' + unit : ''}`.trim();
      if (DEBUG_AUTOCOMPLETE) {
        console.log('[parseAddress] Built street1 from houseNumber + streetName:', address.street1);
      }
    } else if (feature.place_name) {
      // Fallback: use first comma chunk from place_name (usually includes number + street + unit)
      // This ensures we preserve the number even if extractHouseNumber/extractStreetName didn't work
      const firstPart = feature.place_name.split(',')[0] || '';
      address.street1 = firstPart.trim();
      if (DEBUG_AUTOCOMPLETE) {
        console.log('[parseAddress] Built street1 from place_name first part:', address.street1);
      }
    } else if (houseNumber) {
      // Only house number available (append streetName if we have it but didn't match first condition)
      address.street1 = streetName ? `${houseNumber} ${streetName}${unit ? ' ' + unit : ''}`.trim() : houseNumber;
      if (DEBUG_AUTOCOMPLETE) {
        console.log('[parseAddress] Built street1 from houseNumber:', address.street1);
      }
    } else if (streetName) {
      // Only street name available - but NEVER use feature.text alone if place_name exists with a number
      // Check if place_name has a number pattern before falling back
      if (feature.place_name) {
        const firstPart = feature.place_name.split(',')[0] || '';
        const hasNumberInPlaceName = /^\d+/.test(firstPart);
        if (hasNumberInPlaceName) {
          // place_name has a number, use it instead of streetName alone
          address.street1 = firstPart.trim();
          if (DEBUG_AUTOCOMPLETE) {
            console.log('[parseAddress] Built street1 from place_name (has number, avoiding streetName alone):', address.street1);
          }
        } else {
          address.street1 = streetName;
          if (DEBUG_AUTOCOMPLETE) {
            console.log('[parseAddress] Built street1 from streetName only (no number in place_name):', address.street1);
          }
        }
      } else {
        address.street1 = streetName;
        if (DEBUG_AUTOCOMPLETE) {
          console.log('[parseAddress] Built street1 from streetName only (no place_name):', address.street1);
        }
      }
    } else if (feature.text) {
      // Absolute fallback - but check place_name first if it exists
      if (feature.place_name) {
        const firstPart = feature.place_name.split(',')[0] || '';
        address.street1 = firstPart.trim();
        if (DEBUG_AUTOCOMPLETE) {
          console.log('[parseAddress] Built street1 from place_name (fallback, avoiding feature.text):', address.street1);
        }
      } else {
        address.street1 = feature.text.trim();
        if (DEBUG_AUTOCOMPLETE) {
          console.log('[parseAddress] Built street1 from feature.text (absolute fallback):', address.street1);
        }
      }
    }

    // Extract city, state, zip, country from context array (v5 format)
    context.forEach(item => {
      const id = item.id || '';
      if (id.includes('place')) {
        address.city = item.text || address.city;
      } else if (id.includes('region')) {
        // State code is usually in format "us-xx" or just "xx"
        const code = item.short_code || '';
        if (code.includes('-')) {
          address.state = code.split('-')[1].toUpperCase();
        } else if (code.length === 2) {
          address.state = code.toUpperCase();
        } else if (item.text) {
          address.state = item.text;
        }
      } else if (id.includes('postcode')) {
        address.zip = item.text || address.zip;
      } else if (id.includes('country')) {
        address.country = item.short_code?.toUpperCase() || 'US';
      }
    });

    if (DEBUG_AUTOCOMPLETE) {
      console.log('[parseAddress] Final parsed address:', address);
    }

    return address;
  };

  // Handle from address autocomplete
  const handleFromAddressSelect = useCallback((feature) => {
    if (DEBUG_AUTOCOMPLETE) {
      console.log('[handleFromAddressSelect] Called with feature:', feature);
    }
    
    // Immediately close suggestions
    if (fromAutocompleteCloseRef.current) {
      fromAutocompleteCloseRef.current();
    }
    
    const parsed = parseAddress(feature);
    if (DEBUG_AUTOCOMPLETE) {
      console.log('[handleFromAddressSelect] Parsed address:', parsed);
    }
    
    // Use parsed street1 directly (parseAddress returns raw strings, we uppercase here)
    const street1 = parsed.street1 ? parsed.street1.trim().toUpperCase() : '';
    
    const updatedAddress = {
      street1: street1,
      street2: (parsed.street2 || '').trim().toUpperCase(),
      city: (parsed.city || '').trim().toUpperCase(),
      state: (parsed.state || '').trim().toUpperCase(),
      zip: (parsed.zip || '').trim(),
      country: (parsed.country || 'US').toUpperCase()
    };
    
    if (DEBUG_AUTOCOMPLETE) {
      console.log('[handleFromAddressSelect] Updating from address with:', updatedAddress);
    }
    
    // Update React state immediately - this will update the controlled input
    setNewFromAddress(prev => ({
      ...prev,
      ...updatedAddress
    }));
  }, []);

  // Handle to address autocomplete
  const handleToAddressSelect = useCallback((feature) => {
    if (DEBUG_AUTOCOMPLETE) {
      console.log('[handleToAddressSelect] Called with feature:', feature);
    }
    
    // Immediately close suggestions
    if (toAutocompleteCloseRef.current) {
      toAutocompleteCloseRef.current();
    }
    
    const parsed = parseAddress(feature);
    if (DEBUG_AUTOCOMPLETE) {
      console.log('[handleToAddressSelect] Parsed address:', parsed);
    }
    
    // Use parsed street1 directly (parseAddress returns raw strings, we uppercase here)
    const street1 = parsed.street1 ? parsed.street1.trim().toUpperCase() : '';
    
    const updatedAddress = {
      street1: street1,
      street2: (parsed.street2 || '').trim().toUpperCase(),
      city: (parsed.city || '').trim().toUpperCase(),
      state: (parsed.state || '').trim().toUpperCase(),
      zip: (parsed.zip || '').trim(),
      country: (parsed.country || 'US').toUpperCase()
    };
    
    if (DEBUG_AUTOCOMPLETE) {
      console.log('[handleToAddressSelect] Updating to address with:', updatedAddress);
    }
    
    // Update React state immediately - this will update the controlled input
    setNewToAddress(prev => ({
      ...prev,
      ...updatedAddress
    }));
  }, []);

  // Initialize autocomplete for from address
  const fromAutocomplete = useMapboxAutocomplete(fromStreetRef, handleFromAddressSelect);
  // Store closeSuggestions function in ref for handler access
  fromAutocompleteCloseRef.current = fromAutocomplete.closeSuggestions;
  
  // Initialize autocomplete for to address
  const toAutocomplete = useMapboxAutocomplete(toStreetRef, handleToAddressSelect);
  // Store closeSuggestions function in ref for handler access
  toAutocompleteCloseRef.current = toAutocomplete.closeSuggestions;

  // City autocomplete hooks
  const fromCityAutocomplete = useCityAutocomplete(
    newFromAddress.city,
    newFromAddress.state,
    (result) => {
      setNewFromAddress(prev => ({
        ...prev,
        city: result.city,
        state: result.state || prev.state,
        zip: result.zip || prev.zip
      }));
    }
  );

  const toCityAutocomplete = useCityAutocomplete(
    newToAddress.city,
    newToAddress.state,
    (result) => {
      setNewToAddress(prev => ({
        ...prev,
        city: result.city,
        state: result.state || prev.state,
        zip: result.zip || prev.zip
      }));
    }
  );

  // ZIP lookup hooks
  const { lookupZip: lookupFromZip } = useZipLookup();
  const { lookupZip: lookupToZip } = useZipLookup();

  // Handle ZIP lookup for From address
  const handleFromZipBlur = useCallback(() => {
    if (newFromAddress.zip && newFromAddress.zip.trim().length === 5) {
      lookupFromZip(newFromAddress.zip, (result) => {
        // Only update if city/state are empty or mismatched
        if (!newFromAddress.city || !newFromAddress.state || 
            newFromAddress.city.toUpperCase() !== result.city ||
            newFromAddress.state !== result.state) {
          setNewFromAddress(prev => ({
            ...prev,
            city: result.city,
            state: result.state,
            zip: result.zip
          }));
        }
      });
    }
  }, [newFromAddress.zip, lookupFromZip]);

  // Handle ZIP lookup for To address
  const handleToZipBlur = useCallback(() => {
    if (newToAddress.zip && newToAddress.zip.trim().length === 5) {
      lookupToZip(newToAddress.zip, (result) => {
        // Only update if city/state are empty or mismatched
        if (!newToAddress.city || !newToAddress.state ||
            newToAddress.city.toUpperCase() !== result.city ||
            newToAddress.state !== result.state) {
          setNewToAddress(prev => ({
            ...prev,
            city: result.city,
            state: result.state,
            zip: result.zip
          }));
        }
      });
    }
  }, [newToAddress.zip, lookupToZip]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
      fetchPackages();
      fetchLabelTypes();
    }
  }, [user]);

  // Auto-select cheapest service based on package dimensions/weight
  // Helper: Filter services by family
  const groundServices = labelTypes.filter(x => String(x.apiId) === '126');
  const priorityServices = labelTypes.filter(x => String(x.apiId) === '373');
  const activeServices = serviceFamily === 'priority' ? priorityServices : groundServices;

  const autoSelectBestService = useCallback(() => {
    // Clear existing timer
    if (autoSelectTimerRef.current) {
      clearTimeout(autoSelectTimerRef.current);
    }

    // Debounce the auto-selection
    autoSelectTimerRef.current = setTimeout(() => {
      // Only auto-select if user hasn't manually selected
      if (userSelectedServiceId !== null) {
        return;
      }

      // Check if we have valid package dimensions and weight
      const length = parseFloat(newPackage.length);
      const width = parseFloat(newPackage.width);
      const height = parseFloat(newPackage.height);
      const weight = parseFloat(newPackage.weight);

      // Need at least weight to calculate rates
      if (!weight || weight <= 0) {
        setAutoSelectedServiceId(null);
        return;
      }

      // Filter available services that can handle this package (ONLY within active family)
      const validServices = activeServices.filter(service => {
        // Check weight limit
        if (service.maxWeight && weight > service.maxWeight) {
          return false;
        }

        // Check dimension limits if all dimensions provided
        if (length && width && height && service.maxDimensions) {
          const totalDimensions = length + width + height;
          if (totalDimensions > service.maxDimensions) {
            return false;
          }
        }

        return true;
      });

      if (validServices.length === 0) {
        setAutoSelectedServiceId(null);
        return;
      }

      // Select the cheapest service
      const cheapestService = validServices.reduce((cheapest, current) => {
        return current.price < cheapest.price ? current : cheapest;
      });

      setAutoSelectedServiceId(cheapestService.id);
    }, 500); // 500ms debounce
  }, [newPackage.length, newPackage.width, newPackage.height, newPackage.weight, activeServices, userSelectedServiceId]);

  // Auto-populate form fields when saved item is selected
  useEffect(() => {
    if (selectedPackageId) {
      const pkg = packages.find(p => p._id === selectedPackageId);
      if (pkg) {
        setNewPackage({
          label: pkg.label || 'New Package',
          length: pkg.length?.toString() || '0',
          width: pkg.width?.toString() || '0',
          height: pkg.height?.toString() || '0',
          weight: pkg.weight?.toString() || '0',
          description: pkg.description || ''
        });
        // Trigger auto-selection when saved package is selected
        // Reset user selection since package changed
        setUserSelectedServiceId(null);
      }
    } else {
      // Reset to 0 when no package is selected
      setNewPackage({
        label: 'New Package',
        length: '0',
        width: '0',
        height: '0',
        weight: '0',
        description: ''
      });
    }
  }, [selectedPackageId, packages]);

  // Auto-select service when package details change
  useEffect(() => {
    autoSelectBestService();
    
    // Cleanup timer on unmount
    return () => {
      if (autoSelectTimerRef.current) {
        clearTimeout(autoSelectTimerRef.current);
      }
    };
  }, [autoSelectBestService]);

  // Validate dimensions when service or package changes
  useEffect(() => {
    if (selectedService && selectedService.maxDimensions) {
      const length = parseFloat(newPackage.length) || 0;
      const width = parseFloat(newPackage.width) || 0;
      const height = parseFloat(newPackage.height) || 0;
      const totalDimensions = length + width + height;
      
      if (totalDimensions > 0 && totalDimensions > selectedService.maxDimensions) {
        setDimensionError(`Total dimensions: ${totalDimensions.toFixed(1)} inches (exceeds ${selectedService.maxDimensions} inches limit for ${selectedService.name})`);
      } else {
        setDimensionError('');
      }
    } else {
      setDimensionError('');
    }
  }, [selectedService, newPackage.length, newPackage.width, newPackage.height]);

  useEffect(() => {
    if (selectedFromAddressId) {
      const addr = addresses.find(a => a._id === selectedFromAddressId);
      if (addr) {
        setNewFromAddress({
          label: addr.label || 'New From Address',
          name: (addr.name || '').toUpperCase().trim(),
          street1: (addr.street1 || '').toUpperCase().trim(),
          street2: addr.street2 ? (addr.street2 || '').toUpperCase().trim() : '',
          city: (addr.city || '').toUpperCase().trim(),
          state: (addr.state || '').toUpperCase().trim(),
          zip: (addr.zip || '').trim(),
          phone: (addr.phone || '').trim(),
          country: (addr.country || 'US').toUpperCase().trim()
        });
      }
    }
  }, [selectedFromAddressId, addresses]);

  useEffect(() => {
    if (selectedToAddressId) {
      const addr = addresses.find(a => a._id === selectedToAddressId);
      if (addr) {
        setNewToAddress({
          label: addr.label || 'New To Address',
          name: (addr.name || '').toUpperCase().trim(),
          street1: (addr.street1 || '').toUpperCase().trim(),
          street2: addr.street2 ? (addr.street2 || '').toUpperCase().trim() : '',
          city: (addr.city || '').toUpperCase().trim(),
          state: (addr.state || '').toUpperCase().trim(),
          zip: (addr.zip || '').trim(),
          phone: (addr.phone || '').trim(),
          country: (addr.country || 'US').toUpperCase().trim()
        });
      }
    }
  }, [selectedToAddressId, addresses]);

  const fetchLabelTypes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/label-types`);
      setLabelTypes(response.data);
    } catch (error) {
      console.error('Error fetching label types:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/addresses`);
      setAddresses(response.data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/packages`);
      setPackages(response.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  // Validate dimensions in real-time
  const validateDimensions = (length, width, height) => {
    if (!selectedService || !selectedService.maxDimensions) {
      setDimensionError('');
      return;
    }

    const totalDimensions = (parseFloat(length) || 0) + (parseFloat(width) || 0) + (parseFloat(height) || 0);
    
    if (totalDimensions > 0 && totalDimensions > selectedService.maxDimensions) {
      setDimensionError(`Total dimensions: ${totalDimensions.toFixed(1)} inches (exceeds ${selectedService.maxDimensions} inches limit for ${selectedService.name})`);
    } else {
      setDimensionError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple form submissions
    if (isPurchaseInProgressRef.current || loading) {
      console.log('[CreateLabel] ⚠️ Form submission already in progress, ignoring duplicate submit');
      return;
    }
    
    setError('');
    setSuccess('');

    if (!user) {
      navigate('/register');
      return;
    }

    // Auto-select service if user hasn't selected one
    let serviceToUse = selectedService;
    if (!serviceToUse) {
      // Find cheapest valid service based on package dimensions/weight
      const length = parseFloat(newPackage.length) || 0;
      const width = parseFloat(newPackage.width) || 0;
      const height = parseFloat(newPackage.height) || 0;
      const weight = parseFloat(newPackage.weight) || 0;

      if (weight > 0) {
        const validServices = activeServices.filter(service => {
          // Check weight limit
          if (service.maxWeight && weight > service.maxWeight) {
            return false;
          }

          // Check dimension limits if all dimensions provided
          if (length && width && height && service.maxDimensions) {
            const totalDimensions = length + width + height;
            if (totalDimensions > service.maxDimensions) {
              return false;
            }
          }

          return true;
        });

        if (validServices.length > 0) {
          // Select the cheapest service
          const cheapestService = validServices.reduce((cheapest, current) => {
            return current.price < cheapest.price ? current : cheapest;
          });
          serviceToUse = cheapestService;
          setAutoSelectedServiceId(cheapestService.id);
        }
      }
    }

    if (!serviceToUse) {
      setError('Please select a USPS service or enter package weight');
      return;
    }

    // Validate addresses and package
    // Use saved address if selected, otherwise use form data
    let fromAddr, toAddr, pkg;

    if (selectedFromAddressId) {
      fromAddr = addresses.find(a => a._id === selectedFromAddressId);
    } else {
      if (!newFromAddress.name || !newFromAddress.street1 || !newFromAddress.city || !newFromAddress.state || !newFromAddress.zip) {
        setError('Please complete all required fields in From Address');
        return;
      }
      fromAddr = newFromAddress;
    }

    if (selectedToAddressId) {
      toAddr = addresses.find(a => a._id === selectedToAddressId);
    } else {
      if (!newToAddress.name || !newToAddress.street1 || !newToAddress.city || !newToAddress.state || !newToAddress.zip) {
        setError('Please complete all required fields in To Address');
        return;
      }
      toAddr = newToAddress;
    }

    if (selectedPackageId) {
      pkg = packages.find(p => p._id === selectedPackageId);
      
      // Validate dimensions for selected package
      if (serviceToUse && serviceToUse.maxDimensions) {
        const totalDimensions = (parseFloat(pkg.length) || 0) + (parseFloat(pkg.width) || 0) + (parseFloat(pkg.height) || 0);
        if (totalDimensions > serviceToUse.maxDimensions) {
          setError(`Selected package dimensions (${totalDimensions.toFixed(1)} inches total) exceed ${serviceToUse.maxDimensions} inches limit for ${serviceToUse.name}. Please select a different package or shipping option.`);
          setDimensionError(`Total dimensions: ${totalDimensions.toFixed(1)} inches (exceeds ${serviceToUse.maxDimensions} inches limit)`);
          return;
        }
      }
    } else {
      if (!newPackage.length || !newPackage.width || !newPackage.height || !newPackage.weight || !newPackage.description) {
        setError('Please complete all required package fields including SKU/Description');
        return;
      }
      pkg = {
        ...newPackage,
        length: parseFloat(newPackage.length),
        width: parseFloat(newPackage.width),
        height: parseFloat(newPackage.height),
        weight: parseFloat(newPackage.weight)
      };
    }

    if (serviceToUse && pkg.weight > serviceToUse.maxWeight) {
      setError(`Package weight exceeds ${serviceToUse.maxWeight} lbs limit for ${serviceToUse.name}`);
      return;
    }

    // Validate dimensions (total inches: length + width + height)
    if (serviceToUse && serviceToUse.maxDimensions) {
      const totalDimensions = (parseFloat(pkg.length) || 0) + (parseFloat(pkg.width) || 0) + (parseFloat(pkg.height) || 0);
      if (totalDimensions > serviceToUse.maxDimensions) {
        setError(`Package dimensions (${totalDimensions.toFixed(1)} inches total) exceed ${serviceToUse.maxDimensions} inches limit for ${serviceToUse.name}. Please reduce package size or select a different shipping option.`);
        setDimensionError(`Total dimensions: ${totalDimensions.toFixed(1)} inches (exceeds ${serviceToUse.maxDimensions} inches limit)`);
        return;
      }
      setDimensionError(''); // Clear dimension error if valid
    }

    // Show package details modal
    setShowPackageModal(true);
  };

  const handlePurchase = async () => {
    // Prevent multiple simultaneous requests using ref (synchronous, prevents race conditions)
    // This is more reliable than checking loading state because refs update immediately
    if (isPurchaseInProgressRef.current) {
      console.warn('[CreateLabel] ⚠️ BLOCKED: Purchase already in progress, ignoring duplicate request');
      console.warn('[CreateLabel] ⚠️ This prevents creating multiple labels from a single click');
      return;
    }
    
    // Set the ref immediately (synchronous) before any async operations
    console.log('[CreateLabel] 🔒 Locking purchase - setting isPurchaseInProgressRef.current = true');
    isPurchaseInProgressRef.current = true;
    
    setShowPackageModal(false);
    setLoading(true);
    setError('');

    try {
      // Determine which service to use (user selected or auto-selected)
      let serviceToUse = selectedService;
      if (!serviceToUse) {
        // Auto-select cheapest valid service
        const length = parseFloat(newPackage.length) || 0;
        const width = parseFloat(newPackage.width) || 0;
        const height = parseFloat(newPackage.height) || 0;
        const weight = parseFloat(newPackage.weight) || 0;

        if (weight > 0) {
          const validServices = activeServices.filter(service => {
            if (service.maxWeight && weight > service.maxWeight) return false;
            if (length && width && height && service.maxDimensions) {
              const totalDimensions = length + width + height;
              if (totalDimensions > service.maxDimensions) return false;
            }
            return true;
          });

          if (validServices.length > 0) {
            serviceToUse = validServices.reduce((cheapest, current) => {
              return current.price < cheapest.price ? current : cheapest;
            });
          }
        }
      }

      if (!serviceToUse) {
        setError('Please select a USPS service or enter package weight');
        isPurchaseInProgressRef.current = false; // Reset ref
        setLoading(false);
        return;
      }

      // Get addresses and package
      let fromAddr, toAddr;
      if (selectedFromAddressId) {
        fromAddr = addresses.find(a => a._id === selectedFromAddressId);
      } else {
        fromAddr = newFromAddress;
      }

      if (selectedToAddressId) {
        toAddr = addresses.find(a => a._id === selectedToAddressId);
      } else {
        toAddr = newToAddress;
      }

      let fromAddrId = selectedFromAddressId;
      let toAddrId = selectedToAddressId;
      let pkgId = selectedPackageId;

      // Note: Removed save address logic - users can save addresses from Saved Addresses page

      // Normalize address fields to uppercase before sending
      const normalizedFromAddress = fromAddrId ? fromAddr : {
        ...newFromAddress,
        name: newFromAddress.name.toUpperCase().trim(),
        street1: newFromAddress.street1.toUpperCase().trim(),
        street2: newFromAddress.street2 ? newFromAddress.street2.toUpperCase().trim() : '',
        city: newFromAddress.city.toUpperCase().trim(),
        state: newFromAddress.state.toUpperCase().trim()
      };

      const normalizedToAddress = toAddrId ? toAddr : {
        ...newToAddress,
        name: newToAddress.name.toUpperCase().trim(),
        street1: newToAddress.street1.toUpperCase().trim(),
        street2: newToAddress.street2 ? newToAddress.street2.toUpperCase().trim() : '',
        city: newToAddress.city.toUpperCase().trim(),
        state: newToAddress.state.toUpperCase().trim()
      };

      // Create order
      // IMPORTANT: Always send description from form field, even when using saved package
      // This ensures the SKU/Description field value is always sent to backend
      // Use the same axios instance pattern as other authenticated routes
      // The axios.defaults.headers.common['Authorization'] is set in AuthContext
      // But we'll also explicitly include it here for safety
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to create a label');
        isPurchaseInProgressRef.current = false; // Reset ref
        setLoading(false);
        return;
      }

      // Build payload for order creation
      // Only include IDs if they exist (not empty strings)
      const payload = {
        labelTypeId: serviceToUse.id,
        // Only include IDs if they are truthy (not empty string, null, or undefined)
        ...(fromAddrId && { fromAddressId: fromAddrId }),
        ...(toAddrId && { toAddressId: toAddrId }),
        ...(pkgId && { packageId: pkgId }),
        // Always send description from form if provided (for English product name)
        ...(newPackage.description && { description: newPackage.description }),
        // If new addresses/package, send full data (normalized to uppercase)
        ...(!fromAddrId && { fromAddress: normalizedFromAddress }),
        ...(!toAddrId && { toAddress: normalizedToAddress }),
        ...(!pkgId && { package: {
          ...newPackage,
          length: parseFloat(newPackage.length),
          width: parseFloat(newPackage.width),
          height: parseFloat(newPackage.height),
          weight: parseFloat(newPackage.weight)
        }})
      };

      const url = `${API_BASE_URL}/orders`;
      console.log('\n[CreateLabel] ════════════════════════════════════════════════════════════════');
      console.log('[CreateLabel] 🚀 CREATING LABEL - REQUEST DETAILS');
      console.log('[CreateLabel] ════════════════════════════════════════════════════════════════');
      console.log('[CreateLabel] URL:', url);
      console.log('[CreateLabel] Method: POST');
      console.log('[CreateLabel] Payload:', JSON.stringify(payload, null, 2));
      console.log('[CreateLabel] Token present:', !!token);
      console.log('[CreateLabel] Token length:', token ? token.length : 0);
      console.log('[CreateLabel] Token (first 30 chars):', token ? token.substring(0, 30) + '...' : 'MISSING');
      
      // A) Frontend: Only send Authorization header (no x-auth-token)
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      console.log('[CreateLabel] Request Headers:', JSON.stringify({
        'Authorization': `Bearer ${token.substring(0, 20)}...`,
        'Content-Type': 'application/json'
      }, null, 2));
      console.log('[CreateLabel] ════════════════════════════════════════════════════════════════\n');

      // POST /api/orders - Create new order/label
      const response = await axios.post(url, payload, {
        headers: headers
      });

      setCreatedOrder(response.data.order);
      setShowOrderConfirmation(true);
      // Log provider information for verification
      console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
      console.log('║                    ✅ LABEL CREATED SUCCESSFULLY                          ║');
      console.log('╚════════════════════════════════════════════════════════════════════════════╝');
      console.log('[CreateLabel] ✅ Label created successfully');
      console.log('[CreateLabel] ════════════════════════════════════════════════════════════════');
      console.log('[CreateLabel] PROVIDER USED:', response.data.providerUsed || response.data.provider || 'Unknown');
      console.log('[CreateLabel] Provider (raw):', response.data.provider);
      console.log('[CreateLabel] Order ID:', response.data.order?._id || response.data.order?.id);
      console.log('[CreateLabel] Tracking Number:', response.data.order?.trackingNumber);
      console.log('[CreateLabel] ════════════════════════════════════════════════════════════════\n');
      
      updateBalance(response.data.newBalance);
      await fetchUser();
      
      // Reset form
      setUserSelectedServiceId(null);
      setAutoSelectedServiceId(null);
      setSelectedFromAddressId('');
      setSelectedToAddressId('');
      setSelectedPackageId('');
      setNewFromAddress({
        label: 'New From Address',
        name: '',
        street1: '',
        street2: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        country: 'US'
      });
      setNewToAddress({
        label: 'New To Address',
        name: '',
        street1: '',
        street2: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        country: 'US'
      });
      setNewPackage({
        label: 'New Package',
        length: '0',
        width: '0',
        height: '0',
        weight: '0',
        description: ''
      });
    } catch (error) {
      console.error('\n[CreateLabel] ════════════════════════════════════════════════════════════════');
      console.error('[CreateLabel] ❌ CREATE LABEL ERROR');
      console.error('[CreateLabel] ════════════════════════════════════════════════════════════════');
      console.error('[CreateLabel] Error type:', error.name);
      console.error('[CreateLabel] Error message:', error.message);
      console.error('[CreateLabel] Error status:', error.response?.status);
      console.error('[CreateLabel] Error status text:', error.response?.statusText);
      console.error('[CreateLabel] Error data:', JSON.stringify(error.response?.data, null, 2));
      console.error('[CreateLabel] Request URL:', error.config?.url);
      console.error('[CreateLabel] Request method:', error.config?.method);
      
      // Log request headers (masked)
      if (error.config?.headers) {
        const headersToLog = { ...error.config.headers };
        if (headersToLog.Authorization) {
          headersToLog.Authorization = headersToLog.Authorization.substring(0, 30) + '...';
        }
        console.error('[CreateLabel] Request headers:', JSON.stringify(headersToLog, null, 2));
      }
      
      console.error('[CreateLabel] Full error object:', error);
      console.error('[CreateLabel] ════════════════════════════════════════════════════════════════\n');
      
      // Extract error message from backend response
      const errorData = error.response?.data || {};
      let errorMessage = errorData.message || 
                        errorData.error ||
                        error.message || 
                        'Failed to create label';
      
      // Handle insufficient balance (402)
      if (error.response?.status === 402) {
        const shortfall = errorData.shortfall || (errorData.required - errorData.balance);
        errorMessage = `Insufficient balance. You have $${(errorData.balance || 0).toFixed(2)}, but need $${(errorData.required || 0).toFixed(2)}. Please add funds to continue.`;
        setError(errorMessage);
        isPurchaseInProgressRef.current = false;
        setLoading(false);
        return;
      }
      
      // Handle authentication errors - ONLY if it's a real 401 from OUR auth middleware
      if (error.response?.status === 401) {
        // Check if this is a shipping service error (marked with isShippingError flag or provider prefix)
        const isShippingError = errorData.isShippingError || 
                               errorData.provider ||
                               errorMessage.includes('[SHIPLABEL]') ||
                               errorMessage.includes('[SHIPPFAST]') ||
                               errorMessage.includes('[BACKUP]');
        
        // Check if this is actually an auth error from our middleware
        const isRealAuthError = !isShippingError && (
          errorMessage.toLowerCase().includes('token') || 
          errorMessage.toLowerCase().includes('authorization') ||
          errorMessage.toLowerCase().includes('session') ||
          errorMessage.toLowerCase().includes('no token')
        );
        
        if (isRealAuthError) {
          console.error('[CreateLabel] 🔐 Real authentication error detected, logging out');
          setError(errorMessage);
          localStorage.removeItem('token');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          // This is a shipping service error - show it but don't log out
          console.warn('[CreateLabel] ⚠️ Received 401 but this is a shipping provider error, not auth');
          setError(`Shipping Error: ${errorMessage}`);
        }
      } else {
        // Add provider context if available
        if (errorData.provider) {
          errorMessage = `[${errorData.provider.toUpperCase()}] ${errorMessage}`;
        }
        
        // Show error message - DO NOT log out for non-auth errors
        setError(errorMessage || 'Server error occurred. Please try again.');
      }
      // Reset the ref to allow future purchases
      console.log('[CreateLabel] 🔓 Unlocking purchase (error) - setting isPurchaseInProgressRef.current = false');
      isPurchaseInProgressRef.current = false;
      setLoading(false);
    }
  };

  const getAddressForModal = () => {
    if (selectedFromAddressId) {
      return addresses.find(a => a._id === selectedFromAddressId);
    }
    return newFromAddress;
  };

  const getToAddressForModal = () => {
    if (selectedToAddressId) {
      return addresses.find(a => a._id === selectedToAddressId);
    }
    return newToAddress;
  };

  const getPackageForModal = () => {
    if (selectedPackageId) {
      return packages.find(p => p._id === selectedPackageId);
    }
    return {
      ...newPackage,
      length: parseFloat(newPackage.length) || 0,
      width: parseFloat(newPackage.width) || 0,
      height: parseFloat(newPackage.height) || 0,
      weight: parseFloat(newPackage.weight) || 0
    };
  };

  if (!user) {
    return (
      <div className="create-label">
        <h2>Create Shipping Label</h2>
        <div className="login-prompt">
          <div className="login-prompt-content">
            <h3>Sign Up Required</h3>
            <p>Create an account to start generating shipping labels. Get $10 free credit when you sign up!</p>
            <div className="login-prompt-buttons">
              <button onClick={() => navigate('/register')} className="signup-prompt-button">
                Sign Up Free
              </button>
              <button onClick={() => navigate('/login')} className="login-prompt-button">
                Already have an account? Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show confirmation if order was created successfully
  if (showOrderConfirmation && createdOrder) {
    return (
      <div className="create-label">
        <OrderConfirmation
          order={createdOrder}
          onClose={() => {
            setShowOrderConfirmation(false);
            setCreatedOrder(null);
            isPurchaseInProgressRef.current = false; // Reset ref when closing confirmation
            setLoading(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="create-label">
      <div className="create-label-container page-shell">
        <h2>Create Shipping Label</h2>
        <p className="subtitle">Select a USPS service and fill in the details below</p>

        {/* Select Service Section */}
        <div className="form-section section">
          <div className="section-header">
          <h3 className="section-title">Select Service</h3>
          </div>
          
          {/* Service Speed Toggle */}
          {labelTypes.length > 0 && (
            <div className="service-speed-toggle">
              <button
                type="button"
                className={`speed-toggle-btn ${serviceFamily === 'ground' ? 'active' : ''}`}
                onClick={() => {
                  const newFamily = 'ground';
                  setServiceFamily(newFamily);
                  // Clear selection if current selection is not in activeServices
                  const newActiveServices = labelTypes.filter(x => String(x.apiId) === '126');
                  if (userSelectedServiceId && !newActiveServices.find(s => s.id === userSelectedServiceId)) {
                    setUserSelectedServiceId(null);
                  }
                  setDimensionError(''); // Clear dimension error
                  // Trigger auto-select after state updates
                  setTimeout(() => {
                    autoSelectBestService();
                  }, 0);
                }}
              >
                Ground Advantage
              </button>
              <button
                type="button"
                className={`speed-toggle-btn ${serviceFamily === 'priority' ? 'active' : ''}`}
                onClick={() => {
                  const newFamily = 'priority';
                  setServiceFamily(newFamily);
                  // Clear selection if current selection is not in activeServices
                  const newActiveServices = labelTypes.filter(x => String(x.apiId) === '373');
                  if (userSelectedServiceId && !newActiveServices.find(s => s.id === userSelectedServiceId)) {
                    setUserSelectedServiceId(null);
                  }
                  setDimensionError(''); // Clear dimension error
                  // Trigger auto-select after state updates
                  setTimeout(() => {
                    autoSelectBestService();
                  }, 0);
                }}
              >
                Priority Mail
              </button>
            </div>
          )}
          
        {labelTypes.length > 0 ? (
            <>
              {/* Helper function to render a service card */}
              {(() => {
                const renderServiceCard = (option) => {
                  // For Priority cards (apiId 373), find corresponding Ground card (apiId 126) by position
                  let displayDimensions = option.maxDimensions;
                  let displayWeight = option.maxWeight;
                  
                  if (option.apiId === 373) {
                    const groundCards = labelTypes.filter(lt => lt.apiId === 126);
                    const priorityCards = labelTypes.filter(lt => lt.apiId === 373);
                    const priorityIndex = priorityCards.findIndex(lt => lt.id === option.id);
                    
                    if (priorityIndex >= 0 && priorityIndex < groundCards.length) {
                      const correspondingGround = groundCards[priorityIndex];
                      displayDimensions = correspondingGround.maxDimensions;
                      displayWeight = correspondingGround.maxWeight;
                    }
                  }
                  
                  // Determine if this card is disabled (not in active family)
                  const isDisabled = (serviceFamily === 'ground' && option.apiId === 373) || (serviceFamily === 'priority' && option.apiId === 126);
                  const disabledReason = isDisabled 
                    ? (serviceFamily === 'ground' 
                        ? 'Switch to Priority Mail to select this service' 
                        : 'Switch to Ground Advantage to select this service')
                    : null;
                  
                  return (
            <div
              key={option.id}
                      className={`usps-option ${effectiveServiceId === option.id && !isDisabled ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => {
                        // Prevent selection if disabled
                        if (isDisabled) return;
                        
                // User explicitly selected this service
                setUserSelectedServiceId(option.id);
                setDimensionError(''); // Clear dimension error when service changes
                // Re-validate dimensions if package is already entered
                if (newPackage.length || newPackage.width || newPackage.height) {
                  validateDimensions(newPackage.length, newPackage.width, newPackage.height);
                } else if (selectedPackageId) {
                  const pkg = packages.find(p => p._id === selectedPackageId);
                  if (pkg && option.maxDimensions) {
                    const totalDimensions = (parseFloat(pkg.length) || 0) + (parseFloat(pkg.width) || 0) + (parseFloat(pkg.height) || 0);
                    if (totalDimensions > option.maxDimensions) {
                      setDimensionError(`Total dimensions: ${totalDimensions.toFixed(1)} inches (exceeds ${option.maxDimensions} inches limit)`);
                    } else {
                      setDimensionError('');
                    }
                  }
                }
              }}
                      aria-disabled={isDisabled}
                      tabIndex={isDisabled ? -1 : 0}
            >
              {isDisabled && (
                <div className="unavailable-badge-wrapper">
                  <UnavailableBadge disabledReason={disabledReason} />
                </div>
              )}
              <div className="option-select-indicator">
                        {effectiveServiceId === option.id && !isDisabled ? (
                  <div className="selected-checkmark">✓</div>
                ) : (
                  <div className="select-arrow">→</div>
                )}
              </div>
              <div className="option-main-content">
                <div className="option-service-header">
                  <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                    <img 
                      src="https://1000logos.net/wp-content/uploads/2020/09/USPS-Logo.png"
                      alt="USPS" 
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        // Fallback to official USPS SVG if PNG doesn't work
                        if (!e.target.src.includes('.svg')) {
                          e.target.src = 'https://assets.usps.com/images/logo_usps_eagle.svg';
                        }
                      }}
                    />
                  </div>
                  <h3 className="option-service-name">{option.name}</h3>
                </div>
                
                <div className="option-max-info">
                  <SmartTooltip
                            maxDimensions={displayDimensions}
                            maxWeight={displayWeight}
                            apiId={option.apiId}
                  />
                </div>
                
                <div className="option-savings">
                  <span className="savings-badge">Save up to 90%</span>
                  <span className="savings-text">• Best value available</span>
                </div>

                <div className="option-price">
                  <span className="price-label">Price:</span>
                  <span className="price-value">${option.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
                  );
                };
                
                return (
                  <>
                    {/* Ground Advantage Section */}
                    {groundServices.length > 0 && (
                      <div className={`service-group ${serviceFamily !== 'ground' ? 'inactive-family' : ''}`}>
                        <h4 className="service-group-title">Ground Advantage</h4>
                        <p className="service-group-subtitle">Best value • 2–5 business days</p>
                        <div className="usps-options">
                          {groundServices.map(option => renderServiceCard(option))}
                        </div>
                      </div>
                    )}
                    
                    {/* Priority Section */}
                    {priorityServices.length > 0 && (
                      <div className={`service-group ${serviceFamily !== 'priority' ? 'inactive-family' : ''}`}>
                        <h4 className="service-group-title">Priority Mail</h4>
                        <p className="service-group-subtitle">Faster delivery • 1–3 business days</p>
                        <div className="usps-options">
                          {priorityServices.map(option => renderServiceCard(option))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
        ) : (
            <p>Loading available services...</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="label-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Package Section */}
          <div className="form-section package-section section">
            <div className="section-header">
            <h3 className="section-title">Package Details</h3>
            </div>
          
          {/* Saved packages dropdown - full width above card */}
          <div className="section-controls">
            <div className="form-field col-span-2">
            <label>Saved packages (optional)</label>
            <select
              value={selectedPackageId}
              onChange={(e) => {
                setSelectedPackageId(e.target.value);
                setDimensionError(''); // Clear error when package changes
                // Reset user selection when saved package changes to allow auto-selection
                setUserSelectedServiceId(null);
              }}
            >
              <option value="">Select a saved package</option>
              {packages.map(pkg => (
                <option key={pkg._id} value={pkg._id}>
                  {pkg.label} - {pkg.length}" × {pkg.width}" × {pkg.height}" ({pkg.weight} lbs)
                </option>
              ))}
            </select>
            </div>
          </div>

          <div className="form-card">
            <div className="form-grid-2">
              <div className="form-field">
                <label>Length (inches)*</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newPackage.length}
                    onChange={(e) => {
                    const newLength = e.target.value === '' ? '0' : e.target.value;
                      setNewPackage({ ...newPackage, length: newLength });
                      validateDimensions(newLength, newPackage.width, newPackage.height);
                      // Reset user selection when package changes to allow auto-selection
                      setUserSelectedServiceId(null);
                    }}
                    onBlur={() => {
                      // Trigger auto-selection when user finishes editing
                      autoSelectBestService();
                    }}
                    required
                  />
                </div>
              <div className="form-field">
                <label>Width (inches)*</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newPackage.width}
                    onChange={(e) => {
                    const newWidth = e.target.value === '' ? '0' : e.target.value;
                      setNewPackage({ ...newPackage, width: newWidth });
                      validateDimensions(newPackage.length, newWidth, newPackage.height);
                      // Reset user selection when package changes to allow auto-selection
                      setUserSelectedServiceId(null);
                    }}
                    onBlur={() => {
                      // Trigger auto-selection when user finishes editing
                      autoSelectBestService();
                    }}
                    required
                  />
                </div>
              <div className="form-field">
                <label>Height (inches)*</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newPackage.height}
                    onChange={(e) => {
                    const newHeight = e.target.value === '' ? '0' : e.target.value;
                      setNewPackage({ ...newPackage, height: newHeight });
                      validateDimensions(newPackage.length, newPackage.width, newHeight);
                      // Reset user selection when package changes to allow auto-selection
                      setUserSelectedServiceId(null);
                    }}
                    onBlur={() => {
                      // Trigger auto-selection when user finishes editing
                      autoSelectBestService();
                    }}
                    required
                  />
                </div>
              <div className="form-field">
                <label>Weight (lbs)*</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="70"
                  value={newPackage.weight}
                  onChange={(e) => {
                    const newWeight = e.target.value === '' ? '0' : e.target.value;
                    setNewPackage({ ...newPackage, weight: newWeight });
                    // Reset user selection when package changes to allow auto-selection
                    setUserSelectedServiceId(null);
                  }}
                  onBlur={() => {
                    // Trigger auto-selection when user finishes editing
                    autoSelectBestService();
                  }}
                  required
                />
              </div>
              <div className="form-field col-span-2">
                <label>SKU / Description*</label>
                <input
                  type="text"
                  value={newPackage.description}
                  onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                  required
                  placeholder="Enter SKU, product name, or package description"
                />
              </div>
            </div>
            {dimensionError && (
              <div className="dimension-error-message" style={{ 
                color: '#d32f2f', 
                fontSize: '14px', 
                marginTop: '10px',
                padding: '8px',
                backgroundColor: '#ffebee',
                borderRadius: '4px',
                border: '1px solid #ffcdd2'
              }}>
                ⚠️ {dimensionError}
              </div>
            )}
          </div>
        </div>

          {/* From Address Section */}
          <div className="form-section address-section section">
            <div className="section-header">
            <h3 className="section-title">From Address</h3>
            </div>
          
          {/* Saved addresses dropdown - full width above card */}
          <div className="section-controls">
            <div className="form-field col-span-2">
            <label>Saved addresses (optional)</label>
            <select
              value={selectedFromAddressId}
              onChange={(e) => setSelectedFromAddressId(e.target.value)}
            >
              <option value="">Select a saved address</option>
              {addresses.map(addr => (
                <option key={addr._id} value={addr._id}>
                  {addr.label} - {addr.city}, {addr.state}
                </option>
              ))}
            </select>
          </div>
                  </div>

          <div className="form-card">
            <AddressFormFields
              prefix="from"
              address={newFromAddress}
              setAddress={setNewFromAddress}
              autocomplete={fromAutocomplete}
              cityAutocomplete={fromCityAutocomplete}
              refs={{
                streetRef: fromStreetRef,
                cityRef: fromCityRef,
                zipRef: fromZipRef
              }}
              onAddressSelect={handleFromAddressSelect}
              onZipBlur={handleFromZipBlur}
              streetPlaceholder="START TYPING ADDRESS (E.G., 123 MAIN ST)"
            />
            </div>
        </div>

          {/* To Address Section */}
          <div className="form-section address-section section">
            <div className="section-header">
            <h3 className="section-title">To Address</h3>
            </div>
          
          {/* Saved addresses dropdown - full width above card */}
          <div className="section-controls">
            <div className="form-field col-span-2">
            <label>Saved addresses (optional)</label>
            <select
              value={selectedToAddressId}
              onChange={(e) => setSelectedToAddressId(e.target.value)}
            >
              <option value="">Select a saved address</option>
              {addresses.map(addr => (
                <option key={addr._id} value={addr._id}>
                  {addr.label} - {addr.city}, {addr.state}
                </option>
              ))}
            </select>
          </div>
                  </div>

          <div className="form-card">
            <AddressFormFields
              prefix="to"
              address={newToAddress}
              setAddress={setNewToAddress}
              autocomplete={toAutocomplete}
              cityAutocomplete={toCityAutocomplete}
              refs={{
                streetRef: toStreetRef,
                cityRef: toCityRef,
                zipRef: toZipRef
              }}
              onAddressSelect={handleToAddressSelect}
              onZipBlur={handleToZipBlur}
              streetPlaceholder="START TYPING ADDRESS (E.G., 123 MAIN ST)"
            />
            </div>
          </div>

          {selectedService && (
            <div className="cost-preview">
              <p>Estimated Cost: <strong>${selectedService.price.toFixed(2)}</strong></p>
              {autoSelectedServiceId && !userSelectedServiceId && (
                <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                  Auto-selected: {selectedService.name}
                </p>
              )}
            </div>
          )}

          <div className="cta-wrapper">
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Creating Label...' : 'Create Label'}
            </button>
          </div>
        </form>
      </div>

      {showPackageModal && (
        <PackageDetailsModal
          isOpen={showPackageModal}
          onClose={() => setShowPackageModal(false)}
          onPurchase={handlePurchase}
          packageData={getPackageForModal()}
          fromAddress={getAddressForModal()}
          toAddress={getToAddressForModal()}
          service={selectedService}
          price={selectedService?.price || 0}
          userBalance={user?.balance || 0}
          loading={loading}
        />
      )}

    </div>
  );
};

export default CreateLabel;
