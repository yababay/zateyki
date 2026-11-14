<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
    import banner  from '#lib/assets/barny-banner.png'
   	let { title = '', description = '', canonical = '', image = '', src = undefined } = $props()
</script>

<img src={src || banner} alt={title} class="d-none">

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
