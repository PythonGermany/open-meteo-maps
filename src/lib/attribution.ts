// Raises the map attribution above the time selector when the two would
// overlap at the bottom of the screen. On wide screens where there is enough
// room next to the time selector, the attribution stays in the corner.
import { get } from 'svelte/store';

import * as maplibregl from 'maplibre-gl';

import { browser } from '$app/env';

import { attributionExpanded } from '#lib/stores/preferences.js';

import type { Map } from 'maplibre-gl';

const COMPACT_CLASS = 'maplibregl-compact';
const SHOW_CLASS = 'maplibregl-compact-show';

/**
 * MapLibre's attribution control, but it remembers whether the visitor last
 * expanded or collapsed it, instead of always starting expanded. Only clicks
 * on the info button count: the collapse MapLibre does on map drag does not.
 */
export class PersistentAttributionControl extends maplibregl.AttributionControl {
	constructor() {
		super();
		// MapLibre expands the control when it first turns compact, which
		// happens once attributions arrive (not necessarily in onAdd).
		const updateCompact = this._updateCompact;
		this._updateCompact = () => {
			const wasCompact = this._container.classList.contains(COMPACT_CLASS);
			updateCompact();
			const isCompact = this._container.classList.contains(COMPACT_CLASS);
			if (!wasCompact && isCompact && !get(attributionExpanded)) {
				this._container.classList.remove(SHOW_CLASS);
				this._container.removeAttribute('open');
			}
		};
	}

	onAdd(map: Map): HTMLElement {
		const container = super.onAdd(map);
		// Registered after MapLibre's toggle listener, so the class is updated
		this._compactButton.addEventListener('click', () => {
			attributionExpanded.set(this._container.classList.contains(SHOW_CLASS));
		});
		return container;
	}
}

const RAISED_CLASS = 'attrib-raised';
// The chevron buttons stick out 28px on each side of the time selector's
// border box, plus a little breathing room.
const OVERLAP_MARGIN = 36;

let resizeObserver: ResizeObserver | undefined;
let listenerController: AbortController | undefined;

const updateOverlap = () => {
	if (!browser) {
		return;
	}
	const attribution = document.querySelector('.maplibregl-ctrl-bottom-right');
	const timeSelector = document.querySelector('.time-selector-container');
	if (!attribution || !timeSelector) return;

	const attributionRect = attribution.getBoundingClientRect();
	const selectorRect = timeSelector.getBoundingClientRect();
	// Compare horizontal extents only: raising the attribution changes its
	// vertical position, so a vertical check would toggle itself back off.
	const overlaps =
		attributionRect.left < selectorRect.right + OVERLAP_MARGIN &&
		attributionRect.right > selectorRect.left - OVERLAP_MARGIN;
	document.body.classList.toggle(RAISED_CLASS, overlaps);
};

export const watchAttributionOverlap = () => {
	if (!browser) {
		return;
	}
	const attribution = document.querySelector('.maplibregl-ctrl-bottom-right');
	const timeSelector = document.querySelector('.time-selector-container');
	if (!attribution || !timeSelector) return;

	// Reacts to attribution text changes (style/source updates) and to the time
	// selector growing once metadata loads or the 75vw cap kicks in.
	resizeObserver = new ResizeObserver(updateOverlap);
	resizeObserver.observe(attribution);
	resizeObserver.observe(timeSelector);

	// Both elements can keep their size while the gap between them changes.
	listenerController = new AbortController();
	window.addEventListener('resize', updateOverlap, { signal: listenerController.signal });

	updateOverlap();
};

export const unwatchAttributionOverlap = () => {
	if (!browser) {
		return;
	}
	resizeObserver?.disconnect();
	resizeObserver = undefined;
	listenerController?.abort();
	listenerController = undefined;
	document.body.classList.remove(RAISED_CLASS);
};
