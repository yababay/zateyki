<script lang="ts">
	import mermaid from 'mermaid';
	import Svg from './Svg.svelte';

	export let diagram: string, caption: string = ''

	const getSvg = async () => {
		const iof = diagram.indexOf('<svg');
		if (iof > -1) return diagram.slice(iof);
		const { svg } = await mermaid.render('api-render-id', diagram);
		return svg;
	};
</script>

{#await getSvg()}
	<div class="w-100 text-center p-3">
		<div  class="spinner-border text-secondary">
			<span class="visually-hidden">Загрузка диаграммы...</span>
		</div>
	</div>
{:then svg}
	<Svg {svg} {caption} modal={svg} />
{/await}
