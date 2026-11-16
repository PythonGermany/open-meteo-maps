<script lang="ts">
	import { autoplay, autoplayLoopSteps } from '#lib/stores/preferences.js';

	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Switch } from '#lib/components/ui/switch/index.js';

	import { MIN_AUTOPLAY_LOOP_STEPS } from '#lib/constants.js';

	import SettingsSection from './settings-section.svelte';
</script>

<SettingsSection title="Autoplay">
	<div class="mt-3 flex flex-col gap-3">
		<div class="flex gap-3 cursor-pointer">
			<Switch id="autoplay" bind:checked={$autoplay} />
			<Label for="autoplay" class="cursor-pointer">
				Autoplay on load {$autoplay ? 'on' : 'off'}
			</Label>
		</div>
		<div class="flex items-center gap-3">
			<Label for="autoplay-loop-steps" class="w-28 shrink-0">Loop timesteps</Label>
			<Input
				id="autoplay-loop-steps"
				type="number"
				min={MIN_AUTOPLAY_LOOP_STEPS}
				class="w-24 bg-background/60"
				bind:value={$autoplayLoopSteps}
			/>
		</div>
	</div>
</SettingsSection>
