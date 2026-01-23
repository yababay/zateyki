<script lang="ts">

	import Figure from "./Figure.svelte"

	export let svg: string;
	export let caption = '';
	export let modal = ''

	const getSvg = () => {
		const iof = svg.indexOf('<svg');
		if (iof > -1) return svg.slice(iof);
		return svg;
	};

</script>

<Figure {caption} {modal}>
	{@html getSvg()}
</Figure>
