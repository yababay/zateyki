<script lang="ts">

	export let caption = '';
	export let modal = ''

	const id = `modal-${new Date().getTime()}`
	let zoomed: HTMLElement
	let diagramShown = false

</script>

<figure class="text-center">
	<slot />
	{#if caption}
		<figcaption class="w-100 mt-3 d-flex align-items-center justify-content-between gap-3" style="--figcaption-color: #777;">
			<p class="m-0 p-0 text-start">
				<i class="bi bi-arrow-bar-up"></i>&nbsp;{caption}
			</p>
			{#if modal}
			<button type="button" class="btn btn-outline-secondary" title="Увеличить" on:click={() => diagramShown = true}>
				<i class="bi bi-zoom-in" data-bs-toggle="modal" data-bs-target={`#${id}`}></i>
			</button>
			{/if}
		</figcaption>
	{/if}
</figure>

{#if modal}
	<section class="modal-diagram d-none" bind:this={zoomed} class:d-none={!diagramShown} class:modal-diagram-shown={diagramShown}>
		<p class="w-100 text-end me-3 mt-2">
			<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть" on:click={() => diagramShown = false}></button>
		</p>
		{@html modal}
		<p class="m-3">{caption}</p>
	</section>
{/if}
  
  
<style lang="scss">

	.modal-diagram-shown {
		background-color: white;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
	}

	.modal-diagram {
		width: 100vw;
		height: 100vh;
		position: fixed;
		left: 0;
		top: 0;
	}

	figcaption {
        padding-inline: 5ch;
        text-align: center;
		color: var(--figcaption-color);
	}
</style>