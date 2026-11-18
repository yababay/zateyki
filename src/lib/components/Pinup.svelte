<script lang="ts">
    import { onMount } from "svelte"
    import { headState } from "#lib/stores/head.svelte.ts"
    import default_banner from  '#lib/assets/barny-banner.png'
    import { ROOT_TITLE, ROOT_DESCRIPTION } from '$app/env/public'

    let { title = ROOT_TITLE, description = ROOT_DESCRIPTION, pinup = "", banner = default_banner } = $props()

    onMount(() => {
        headState.title = title
        headState.description = description
        headState.banner = banner
        headState.pinup = pinup
    })    
</script>

{#if pinup}
    <img src={pinup} alt={title}>
{/if}

<svelte:head>
    <link rel="canonical" href="https://yababay.github.io/zateyki/">
    {#if pinup}
        <meta property="image" content={pinup} />
        <meta property="twitter:image" content={pinup} />
        <meta property="og:image:width" content="1600" />
        <meta property="og:image:height" content="840" />
        <meta property="og:image" content={pinup} />
    {/if}
    <meta name="description" content={description}>
    <meta name="og:description" content={description}>
    <meta name="og:title" content={title}>
    <title>{title}</title>
</svelte:head>

<style lang="scss">
    img {
        width: 100%;
        max-width: 78ch;
        margin: 0;
    }
</style>