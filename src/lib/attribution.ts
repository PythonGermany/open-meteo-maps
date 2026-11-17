// Raises the map attribution above the time selector when the two would
// overlap at the bottom of the screen. On wide screens where there is enough
// room next to the time selector, the attribution stays in the corner. On
// narrow screens it sits level with the centered model run selector when it
// fits in the space to the right of it.
import { browser } from '$app/env';

const RAISED_CLASS = 'attrib-raised';
const BESIDE_SELECTOR_CLASS = 'attrib-beside-selector';
// The chevron buttons stick out 28px on each side of the time selector's
// border box, plus a little breathing room.
const OVERLAP_MARGIN = 36;
// Gap between the model run selector and the attribution's left margin.
const BESIDE_SELECTOR_GAP = 4;
// Matches the narrow layout breakpoint in styles.css.
const NARROW_QUERY = '(max-width: 768px)';

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

	// Width only: the expanded attribution keeps its width when lowered, so
	// this can't toggle itself back off either.
	const modelRunSelector = document.querySelector('.model-run-selector');
	const fitsBesideSelector =
		window.matchMedia(NARROW_QUERY).matches &&
		!!modelRunSelector &&
		attributionRect.width + BESIDE_SELECTOR_GAP <=
			window.innerWidth - modelRunSelector.getBoundingClientRect().right;
	document.body.classList.toggle(BESIDE_SELECTOR_CLASS, fitsBesideSelector);
};

export const watchAttributionOverlap = () => {
	if (!browser) {
		return;
	}
	const attribution = document.querySelector('.maplibregl-ctrl-bottom-right');
	const timeSelector = document.querySelector('.time-selector-container');
	if (!attribution || !timeSelector) return;

	// Reacts to attribution text changes (style/source updates), the attribution
	// expanding, and to the time selector or model run selector growing once
	// metadata loads or the 75vw cap kicks in.
	resizeObserver = new ResizeObserver(updateOverlap);
	resizeObserver.observe(attribution);
	resizeObserver.observe(timeSelector);
	const modelRunSelector = document.querySelector('.model-run-selector');
	if (modelRunSelector) resizeObserver.observe(modelRunSelector);

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
	document.body.classList.remove(RAISED_CLASS, BESIDE_SELECTOR_CLASS);
};
