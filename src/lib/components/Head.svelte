<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
    import src from '#lib/assets/barny-banner.png'
    import { headState } from '#lib/stores/head.svelte.ts';
    import { onMount } from 'svelte';

   	let { title = '', description = '', canonical = '', image = '', banner } = $props()

    let imageProvider = $state<HTMLElement | null>(null)

    onMount(() => {
        headState.title = title
        if(!imageProvider) return
        const header = document.querySelector('header') as HTMLImageElement
        const img = imageProvider.querySelector('img')
        if(!img) return
        header.style.backgroundImage = `url("${img.src}")`
    })
</script>
  
<div class="d-none" bind:this={imageProvider}>
    {#if banner}
        {@render banner()}
    {:else}
        <img {src} alt="banner">
    {/if}
</div>

<svelte:head>
    {#if canonical}
        <link rel="canonical" href={canonical}>
    {/if}
    {#if image}
        <meta property="image" content={image} />
        <meta property="twitter:image" content={image} />
        <meta property="og:image:width" content="1600" />
        <meta property="og:image:height" content="840" />
        <meta property="og:image" content={image} />
    {/if}
    {#if description}
        <meta name="description" content={description}>
        <meta name="og:description" content={description}>
    {/if}
    <link rel="icon" href={favicon} />
    <meta name="og:title" content={title}>
    <title>{title}</title>
</svelte:head>
