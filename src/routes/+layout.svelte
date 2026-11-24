<script lang="ts">
	import { ROOT_TITLE, ROOT_DESCRIPTION } from '$app/env/public'
	import type { LayoutProps } from './$types';
	import Header  from '#lib/components/Header.svelte';
    import Footer  from '#lib/components/Footer.svelte';
    import Home from '#lib/components/Home.svelte';
    import ScrollTop from '#lib/components/ScrollTop.svelte';
    import Social from '#lib/components/Social.svelte';
    import Pinup from '#lib/components/Pinup.svelte';
    import '#lib/styles/bootstrap-icons.min.css'
    import '#lib/styles/article.scss'

	let { children }: LayoutProps = $props();

</script>

<Pinup />
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

<svelte:head>
    <link rel="canonical" href="https://yababay.github.io/zateyki/">
    <meta name="description" content={ROOT_DESCRIPTION}>
    <meta name="og:description" content={ROOT_DESCRIPTION}>
    <meta name="og:title" content={ROOT_TITLE}>
    <title>{ROOT_TITLE}</title>
</svelte:head>