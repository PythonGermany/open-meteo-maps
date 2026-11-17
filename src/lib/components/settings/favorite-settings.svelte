<script lang="ts">
	import { showFavoritesOnMap, storedFavoriteLocations } from '#lib/stores/location.js';

	import { Label } from '#lib/components/ui/label/index.js';
	import { Switch } from '#lib/components/ui/switch/index.js';

	import SettingsSection from './settings-section.svelte';
</script>

<SettingsSection title="Favourites">
	<div class="mt-3 flex gap-3">
		<Switch id="show_favorites" class="cursor-pointer" bind:checked={$showFavoritesOnMap} />
		<Label class="cursor-pointer" for="show_favorites">Always show favourites on map</Label>
	</div>
	{#if $storedFavoriteLocations.length === 0}
		<p class="text-muted-foreground mt-2 text-sm">
			Star places in the location search to add favourites.
		</p>
	{/if}
</SettingsSection>
