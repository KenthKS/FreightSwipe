
import React, { useEffect, useRef } from 'react';
import './AddressSelection.css';

const AddressSelection = ({ apiKey, onConfirm, title }) => {
  const locationInputRef = useRef(null);
  const localityInputRef = useRef(null);
  const adminAreaInputRef = useRef(null);
  const postalCodeInputRef = useRef(null);
  const countryInputRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const SHORT_NAME_ADDRESS_COMPONENT_TYPES = new Set([
      'street_number',
      'administrative_area_level_1',
      'postal_code',
    ]);

    const ADDRESS_COMPONENT_TYPES_IN_FORM = [
      'location',
      'locality',
      'administrative_area_level_1',
      'postal_code',
      'country',
    ];

    function getFormInputElement(componentType) {
      switch (componentType) {
        case 'location':
          return locationInputRef.current;
        case 'locality':
          return localityInputRef.current;
        case 'administrative_area_level_1':
          return adminAreaInputRef.current;
        case 'postal_code':
          return postalCodeInputRef.current;
        case 'country':
          return countryInputRef.current;
        default:
          return null;
      }
    }

    function fillInAddress(place) {
      function getComponentName(componentType) {
        for (const component of place.address_components || []) {
          if (component.types[0] === componentType) {
            return SHORT_NAME_ADDRESS_COMPONENT_TYPES.has(componentType)
              ? component.short_name
              : component.long_name;
          }
        }
        return '';
      }

      function getComponentText(componentType) {
        return componentType === 'location'
          ? `${getComponentName('street_number')} ${getComponentName('route')}`
          : getComponentName(componentType);
      }

      for (const componentType of ADDRESS_COMPONENT_TYPES_IN_FORM) {
        const inputElement = getFormInputElement(componentType);
        if (inputElement) {
          inputElement.value = getComponentText(componentType);
        }
      }
    }

    function renderAddress(place) {
      if (mapRef.current && markerRef.current) {
        if (place.geometry && place.geometry.location) {
          mapRef.current.center = place.geometry.location;
          markerRef.current.position = place.geometry.location;
        } else {
          markerRef.current.position = null;
        }
      }
    }

    async function initMap() {
      await window.customElements.whenDefined('gmpx-api-loader');
      const { Autocomplete } = await window.google.maps.importLibrary('places');

      const mapOptions = {
        center: { lat: 37.4221, lng: -122.0841 },
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        zoom: 11,
        zoomControl: true,
        maxZoom: 22,
        mapId: 'DEMO_MAP_ID',
      };

      if (mapRef.current) {
        mapRef.current.innerMap.setOptions(mapOptions);
      }

      const autocomplete = new Autocomplete(locationInputRef.current, {
        fields: ['address_components', 'geometry', 'name'],
        types: ['address'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
          window.alert(`No details available for input: '${place.name}'`);
          return;
        }
        renderAddress(place);
        fillInAddress(place);
      });
    }

    initMap();
  }, []);

  const handleConfirm = () => {
    const address = {
      address: locationInputRef.current.value,
      city: localityInputRef.current.value,
      province: adminAreaInputRef.current.value,
      postalCode: postalCodeInputRef.current.value,
      country: countryInputRef.current.value,
    };
    onConfirm(address);
  };

  return (
    <div className="address-selection-container">
      <gmpx-api-loader key={apiKey} solution-channel="GMP_QB_addressselection_v4_cABC"></gmpx-api-loader>
      <gmpx-split-layout row-layout-min-width="600">
        <div className="panel" slot="fixed">
          <div>
            <img
              className="sb-title-icon"
              src="https://fonts.gstatic.com/s/i/googlematerialicons/location_pin/v5/24px.svg"
              alt=""
            />
            <span className="sb-title">{title}</span>
          </div>
          <input type="text" placeholder="Address" ref={locationInputRef} />
          <input type="text" placeholder="Apt, Suite, etc (optional)" />
          <input type="text" placeholder="City" ref={localityInputRef} />
          <div className="half-input-container">
            <input
              type="text"
              className="half-input"
              placeholder="State/Province"
              ref={adminAreaInputRef}
            />
            <input
              type="text"
              className="half-input"
              placeholder="Zip/Postal code"
              ref={postalCodeInputRef}
            />
          </div>
          <input type="text" placeholder="Country" ref={countryInputRef} />
          <gmpx-icon-button variant="filled" onClick={handleConfirm}>{title}</gmpx-icon-button>
        </div>
        <gmp-map slot="main" ref={mapRef}>
          <gmp-advanced-marker ref={markerRef}></gmp-advanced-marker>
        </gmp-map>
      </gmpx-split-layout>
    </div>
  );
};

export default AddressSelection;
