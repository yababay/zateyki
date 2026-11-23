<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children?: Snippet } = $props();
</script>

<sup>{#if children}{@render children()}{:else}*{/if}</sup>
