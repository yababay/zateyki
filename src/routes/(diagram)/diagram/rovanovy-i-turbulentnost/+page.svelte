<script lang="ts">
	import './diagram.css';
	import Mermaid from '$lib/components/Mermaid.svelte';
	import diagram from '$lib/assets/_Романовы и турбулентность.svg?raw';
</script>

<Mermaid {diagram} caption="Романовы и турбулентность" />
