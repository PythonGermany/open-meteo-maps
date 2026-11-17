import { derived, get } from 'svelte/store';

import * as maplibregl from 'maplibre-gl';

import {
	type GeoLocation,
	type SelectedLocation,
	addRecentLocation,
	selectedLocation,
	showFavoritesOnMap,
	storedFavoriteLocations
} from '#lib/stores/location.js';
import { map as m } from '#lib/stores/map.js';

import { syncLocationToUrl } from './url';

/** Zoom the map opens at and flies to for a location: the place within its region, which suits the raster resolution */
export const LOCATION_ZOOM = 8.5;

// The geolocate control's dot, pulsing ring included: a searched place looks
// like the located one, the two only differ in what put them on the map.
let marker: maplibregl.Marker | undefined;

const placeMarker = (map: maplibregl.Map, { latitude, longitude }: SelectedLocation): void => {
	if (!marker) {
		const dot = document.createElement('div');
		dot.className = 'maplibregl-user-location-dot';
		marker = new maplibregl.Marker({ element: dot });
	}
	marker.setLngLat([longitude, latitude]).addTo(map);
};

/**
 * Select `location`: stored, mirrored into the URL, marked on the map, and the
 * camera flies there.
 */
export const setLocation = (location: SelectedLocation): void => {
	selectedLocation.set(location);
	syncLocationToUrl(location);

	const map = get(m);
	if (!map) return;
	placeMarker(map, location);
	map.flyTo({ center: [location.longitude, location.latitude], zoom: LOCATION_ZOOM });
};

/** Select a geocoded place, as picking it in the search or clicking its favourite star does */
export const selectGeoLocation = (location: GeoLocation): void => {
	addRecentLocation(location);
	setLocation({
		name: location.name,
		latitude: location.latitude,
		longitude: location.longitude
	});
};

export const clearLocation = (): void => {
	selectedLocation.set(undefined);
	syncLocationToUrl(undefined);
	marker?.remove();
};

/**
 * Marks the location the URL named once the map exists. No flight: the map
 * starts on it (see createMap), or on the position hash when there is one.
 */
export const addLocationMarker = (): void => {
	const map = get(m);
	const location = get(selectedLocation);
	if (map && location) placeMarker(map, location);
};

// Lucide's star, the icon the search marks favourites with
const STAR_PATH =
	'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z';
// Left padding plus half the star (see .favorite-marker): moves the star, not the pill's edge, onto the place
const STAR_CENTER_OFFSET = 11;

let favoriteMarkers: maplibregl.Marker[] = [];

const createFavoriteElement = (location: GeoLocation): HTMLElement => {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'favorite-marker';
	button.title = location.name;
	button.setAttribute('aria-label', `Select ${location.name}`);

	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('viewBox', '0 0 24 24');
	svg.setAttribute('aria-hidden', 'true');
	const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	path.setAttribute('d', STAR_PATH);
	svg.append(path);

	// The name comes from the geocoding API: text only, never markup
	const label = document.createElement('span');
	label.textContent = location.name;

	button.append(svg, label);
	button.addEventListener('click', (event) => {
		// The map would take the click as its own and move the popup there
		event.stopPropagation();
		selectGeoLocation(location);
	});
	return button;
};

const isSelected = (location: GeoLocation, selected: SelectedLocation | undefined): boolean =>
	selected?.latitude === location.latitude && selected.longitude === location.longitude;

/**
 * Keeps a star marker on every favourite while the setting is on. The selected
 * place is left out, its dot already marks it.
 */
export const watchFavoriteMarkers = (): void => {
	derived(
		[storedFavoriteLocations, showFavoritesOnMap, selectedLocation, m],
		(stores) => stores
	).subscribe(([favorites, show, selected, map]) => {
		for (const marker of favoriteMarkers) marker.remove();
		favoriteMarkers = [];
		if (!map || !show) return;
		favoriteMarkers = favorites
			.filter((location) => !isSelected(location, selected))
			.map((location) =>
				new maplibregl.Marker({
					element: createFavoriteElement(location),
					anchor: 'left',
					offset: [-STAR_CENTER_OFFSET, 0]
				})
					.setLngLat([location.longitude, location.latitude])
					.addTo(map)
			);
	});
};
