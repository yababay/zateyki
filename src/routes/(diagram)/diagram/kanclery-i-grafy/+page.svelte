<script lang="ts">
	import Mermaid from '$lib/components/Mermaid.svelte';
	import svg from './diagram.svg?raw';

	const iof = svg.indexOf('<svg');
	const diagram = svg.slice(iof);
</script>

<Mermaid {diagram} caption="Российские канцлеры — графы Священной римской империи" />
