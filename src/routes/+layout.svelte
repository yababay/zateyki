<script lang="ts">
    import { onMount } from "svelte"
	import { ROOT_TITLE, ROOT_DESCRIPTION } from '$app/env/public'
	import type { LayoutProps } from './$types';
    import { headState } from "#lib/stores/head.svelte.ts"
	import Header  from '#lib/components/Header.svelte';
    import Footer  from '#lib/components/Footer.svelte';
    import Home from '#lib/components/Home.svelte';
    import ScrollTop from '#lib/components/ScrollTop.svelte';
    import Social from '#lib/components/Social.svelte';
    // import Pinup from '#lib/components/Pinup.svelte';
    // import '#lib/styles/bootstrap-icons.min.css'
    import '#lib/styles/article.scss'

	let { children }: LayoutProps = $props();

    /*onMount(() => {
        headState.title = ROOT_TITLE
        headState.description = ROOT_DESCRIPTION
        //headState.banner = banner
        //headState.pinup = pinup
    })*/  
</script>

<!-- Pinup / -->
<Header />
<Home />
<ScrollTop />
<Social />

<section class="container">
	<article>
		{@render children()}
	</article>
</section>

<Footer />


<!-- svelte:head>
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
</svelte:head -->
