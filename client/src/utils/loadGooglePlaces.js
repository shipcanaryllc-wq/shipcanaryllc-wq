// Utility to load Google Places API dynamically
export const loadGooglePlaces = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      resolve();
      return;
    }

    const apiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn('Google Places API key not found. Address autocomplete will not work.');
      reject(new Error('API key not found'));
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Places')));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Places'));
    document.head.appendChild(script);
  });
};

