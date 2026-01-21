<script lang="ts">
	export let svg: string;

	const getSvg = () => {
		const iof = svg.indexOf('<svg');
		if (iof > -1) return svg.slice(iof);
		return svg;
	};

	export let caption = '';
</script>

<figure class="text-center">
	{@html getSvg()}
	{#if caption}
		<figcaption class="d-flex justify-content-center w-100">
			<p class="p-3 text-start w-75">{caption}</p>
		</figcaption>
	{/if}
</figure>
