<script lang="ts">
	import type { LayoutProps } from './$types';
	import Header  from '#lib/components/Header.svelte';
    import Footer  from '#lib/components/Footer.svelte';
    import Home from '#lib/components/Home.svelte';
    import Telegram from '#lib/components/Telegram.svelte';
    import '#lib/styles/article.scss'

	let { children }: LayoutProps = $props();

</script>

<Header />
<Home />
<Telegram />

<section class="container">
	<article>
		{@render children()}
	</article>
</section>

<Footer />
